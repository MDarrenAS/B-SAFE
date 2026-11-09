<?php

namespace App\Services\Detection;

use App\Contracts\DetectionRule;
use App\DTO\DetectionContext;
use App\Models\CompanyRiskScore;
use App\Models\FraudAlert;
use App\Services\AuditLogService;
use App\Services\Detection\Rules\EmploymentMisclassificationRule;
use App\Services\Detection\Rules\FictitiousMutationRule;
use App\Services\Detection\Rules\PdukRule;
use App\Services\Detection\Rules\UnderReportingWageRule;
use Illuminate\Support\Facades\DB;

class FraudDetectionEngine
{
    public function __construct(
        private readonly PdukRule $pdukRule,
        private readonly UnderReportingWageRule $underReportingWageRule,
        private readonly EmploymentMisclassificationRule $employmentMisclassificationRule,
        private readonly FictitiousMutationRule $fictitiousMutationRule,
        private readonly RiskScoringService $riskScoringService,
        private readonly AuditLogService $auditLogService,
    ) {}

    public function assertConfigured(): void
    {
        foreach ($this->rules() as $rule) {
            $rule->assertConfigured();
        }

        $this->riskScoringService->assertConfigured();
    }

    public function run(string $period): int
    {
        $this->assertConfigured();
        $context = DetectionContext::fromPeriod($period);
        $drafts = [];

        foreach ($this->rules() as $rule) {
            array_push($drafts, ...$rule->detect($context));
        }

        $draftsByCompany = [];

        foreach ($drafts as $draft) {
            $draftsByCompany[$draft->npwp][] = $draft;
        }

        foreach ($draftsByCompany as $npwp => $companyDrafts) {
            $risk = $this->riskScoringService->score($companyDrafts);

            DB::transaction(function () use ($companyDrafts, $npwp, $risk, $context): void {
                foreach ($companyDrafts as $draft) {
                    $alert = FraudAlert::query()
                        ->where('npwp', $draft->npwp)
                        ->where('jenis_anomali', $draft->type->value)
                        ->where('tahun_pajak', $draft->year)
                        ->where('masa_pajak', $draft->month)
                        ->whereNull('nik')
                        ->lockForUpdate()
                        ->first();

                    $alert ??= new FraudAlert;
                    $alert->fill([
                        'npwp' => $draft->npwp,
                        'kode_badan_usaha' => $draft->kodeBadanUsaha,
                        'nik' => null,
                        'jenis_anomali' => $draft->type->value,
                        'masa_pajak' => $draft->month,
                        'tahun_pajak' => $draft->year,
                        'nilai_bpjs' => $draft->bpjsAmount,
                        'nilai_pembanding' => $draft->comparisonAmount,
                        'selisih' => $draft->difference,
                        'tingkat_risiko' => $risk['level']->value,
                        'keterangan' => json_encode([
                            'summary' => $draft->summary,
                            ...$draft->evidence,
                        ], JSON_THROW_ON_ERROR),
                    ]);
                    $alert->save();
                }

                CompanyRiskScore::query()->updateOrCreate(
                    [
                        'company_npwp' => $npwp,
                        'tahun' => $context->year,
                        'masa' => $context->month,
                    ],
                    [
                        'score' => $risk['score'],
                        'level' => $risk['level']->value,
                        'breakdown' => $risk['breakdown'],
                        'generated_at' => now(),
                    ],
                );
            });
        }

        $this->auditLogService->record(
            userId: null,
            action: 'detection.completed',
            resource: 'fraud_detection',
            resourceId: $period,
            metadata: ['alerts_written' => count($drafts)],
        );

        return count($drafts);
    }

    /**
     * @return list<DetectionRule>
     */
    private function rules(): array
    {
        return [
            $this->pdukRule,
            $this->underReportingWageRule,
            $this->employmentMisclassificationRule,
            $this->fictitiousMutationRule,
        ];
    }
}
