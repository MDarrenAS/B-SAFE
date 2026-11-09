<?php

$floatValue = static function (string $key): ?float {
    $value = env($key);

    return is_numeric($value) ? (float) $value : null;
};

$jsonMap = static function (string $key): array {
    $value = env($key);

    if (! is_string($value) || trim($value) === '') {
        return [];
    }

    $decoded = json_decode($value, true, flags: JSON_THROW_ON_ERROR);

    return is_array($decoded) ? $decoded : [];
};

return [
    'detection' => [
        'pduk_threshold' => $floatValue('BSAFE_PDUK_THRESHOLD'),
        'wage_gap_threshold' => $floatValue('BSAFE_WAGE_GAP_THRESHOLD'),
        'company_wage_gap_threshold' => $floatValue('BSAFE_COMPANY_WAGE_GAP_THRESHOLD'),
        'employment_status_map' => $jsonMap('BSAFE_EMPLOYMENT_STATUS_MAP'),
    ],
    'risk_scoring' => [
        'method' => env('BSAFE_RISK_SCORING_METHOD'),
        'weights' => $jsonMap('BSAFE_RISK_WEIGHTS'),
        'thresholds' => $jsonMap('BSAFE_RISK_THRESHOLDS'),
    ],
];
