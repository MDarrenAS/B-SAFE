<?php

namespace App\Enums;

enum RiskLevel: string
{
    case Rendah = 'RENDAH';
    case Sedang = 'SEDANG';
    case Tinggi = 'TINGGI';

    public function label(): string
    {
        return match ($this) {
            self::Rendah => 'Rendah',
            self::Sedang => 'Sedang',
            self::Tinggi => 'Tinggi',
        };
    }

    public function rank(): int
    {
        return match ($this) {
            self::Rendah => 1,
            self::Sedang => 2,
            self::Tinggi => 3,
        };
    }
}
