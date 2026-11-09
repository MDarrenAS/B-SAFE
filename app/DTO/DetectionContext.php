<?php

namespace App\DTO;

use InvalidArgumentException;

class DetectionContext
{
    public function __construct(
        public readonly int $year,
        public readonly int $month,
    ) {}

    public static function fromPeriod(string $period): self
    {
        if (! preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/D', $period, $matches)) {
            throw new InvalidArgumentException('Periode harus berformat YYYY-MM.');
        }

        return new self((int) $matches[1], (int) $matches[2]);
    }

    public function period(): string
    {
        return sprintf('%04d-%02d', $this->year, $this->month);
    }
}
