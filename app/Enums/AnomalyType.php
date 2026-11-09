<?php

namespace App\Enums;

enum AnomalyType: string
{
    case Pduk = 'PDUK';
    case UnderReportingWage = 'UNDER_REPORTING_UPAH';
    case EmploymentMisclassification = 'MISKLASIFIKASI_HUBUNGAN_KERJA';
    case FictitiousMutation = 'MANIPULASI_MUTASI';
    case InvalidIdentity = 'IDENTITAS_TIDAK_VALID';

    public function label(): string
    {
        return match ($this) {
            self::Pduk => 'PDUK',
            self::UnderReportingWage => 'Under-reporting upah',
            self::EmploymentMisclassification => 'Misklasifikasi hubungan kerja',
            self::FictitiousMutation => 'Manipulasi mutasi',
            self::InvalidIdentity => 'Identitas tidak valid',
        };
    }
}
