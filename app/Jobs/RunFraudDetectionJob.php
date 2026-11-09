<?php

namespace App\Jobs;

use App\Services\Detection\FraudDetectionEngine;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RunFraudDetectionJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $uniqueFor = 3600;

    public function __construct(public readonly string $period) {}

    public function handle(FraudDetectionEngine $engine): void
    {
        $engine->run($this->period);
    }

    public function uniqueId(): string
    {
        return 'fraud-detection:'.$this->period;
    }
}
