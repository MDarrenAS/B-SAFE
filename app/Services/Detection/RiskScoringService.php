<?php

namespace App\Services\Detection;

use App\DTO\AnomalyDraft;
use App\Enums\RiskLevel;
use LogicException;

class RiskScoringService
{
    public function assertConfigured(): void
    {
        $method = config('bsafe.risk_scoring.method');
        $weights = config('bsafe.risk_scoring.weights');
        $thresholds = config('bsafe.risk_scoring.thresholds');

        if ($method !== 'weighted_sum') {
            throw new LogicException(
                'Risk scoring belum diaktifkan. Tetapkan BSAFE_RISK_SCORING_METHOD=weighted_sum setelah metode disetujui.',
            );
        }

        if (! is_array($weights) || $weights === []) {
            throw new LogicException('BSAFE_RISK_WEIGHTS harus berisi bobot yang disetujui.');
        }

        if (
            ! is_array($thresholds)
            || ! is_numeric($thresholds['medium_min'] ?? null)
            || ! is_numeric($thresholds['high_min'] ?? null)
            || (float) $thresholds['high_min'] <= (float) $thresholds['medium_min']
        ) {
            throw new LogicException(
                'BSAFE_RISK_THRESHOLDS harus menyediakan medium_min dan high_min yang valid.',
            );
        }
    }

    /**
     * @param  list<AnomalyDraft>  $drafts
     * @return array{score: float, level: RiskLevel, breakdown: array<string, mixed>}
     */
    public function score(array $drafts): array
    {
        $this->assertConfigured();

        $weights = config('bsafe.risk_scoring.weights');
        $thresholds = config('bsafe.risk_scoring.thresholds');
        $counts = [];

        foreach ($drafts as $draft) {
            $counts[$draft->type->value] = ($counts[$draft->type->value] ?? 0) + 1;
        }

        $score = 0.0;
        $breakdown = [];

        foreach ($counts as $type => $count) {
            if (! is_numeric($weights[$type] ?? null)) {
                throw new LogicException("Bobot risiko untuk jenis {$type} belum dikonfigurasi.");
            }

            $weight = (float) $weights[$type];
            $contribution = $weight * $count;
            $score += $contribution;
            $breakdown[$type] = [
                'count' => $count,
                'weight' => $weight,
                'contribution' => $contribution,
            ];
        }

        $level = match (true) {
            $score >= (float) $thresholds['high_min'] => RiskLevel::Tinggi,
            $score >= (float) $thresholds['medium_min'] => RiskLevel::Sedang,
            default => RiskLevel::Rendah,
        };

        return [
            'score' => $score,
            'level' => $level,
            'breakdown' => [
                'method' => 'weighted_sum',
                'anomalies' => $breakdown,
            ],
        ];
    }
}
