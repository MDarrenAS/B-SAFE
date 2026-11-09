<?php

namespace App\Contracts;

use App\DTO\AnomalyDraft;
use App\DTO\DetectionContext;

interface DetectionRule
{
    public function assertConfigured(): void;

    /**
     * @return list<AnomalyDraft>
     */
    public function detect(DetectionContext $context): array;
}
