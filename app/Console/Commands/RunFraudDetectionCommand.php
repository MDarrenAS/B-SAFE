<?php

namespace App\Console\Commands;

use App\DTO\DetectionContext;
use App\Jobs\RunFraudDetectionJob;
use App\Services\Detection\FraudDetectionEngine;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('bsafe:detect {period : Period in YYYY-MM format}')]
#[Description('Run configured fraud detection rules for a reporting period')]
class RunFraudDetectionCommand extends Command
{
    public function handle(FraudDetectionEngine $engine): int
    {
        $period = (string) $this->argument('period');
        DetectionContext::fromPeriod($period);
        $engine->assertConfigured();
        RunFraudDetectionJob::dispatch($period);

        $this->info("Deteksi periode {$period} dijadwalkan.");

        return self::SUCCESS;
    }
}
