<?php

namespace App\DTO;

use App\Enums\AnomalyType;

class AnomalyDraft
{
    /**
     * @param  array<string, int|float|string|bool|null>  $evidence
     */
    public function __construct(
        public readonly string $npwp,
        public readonly ?string $kodeBadanUsaha,
        public readonly AnomalyType $type,
        public readonly int $year,
        public readonly int $month,
        public readonly ?float $bpjsAmount,
        public readonly ?float $comparisonAmount,
        public readonly ?float $difference,
        public readonly string $summary,
        public readonly array $evidence,
    ) {}
}
