<?php

namespace App\Services;

class DataMaskingService
{
    public function identifier(?string $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        $visibleLength = min(4, mb_strlen($value));

        return str_repeat('•', mb_strlen($value) - $visibleLength)
            .mb_substr($value, -$visibleLength);
    }

    public function evidence(?string $value): array
    {
        if ($value === null || trim($value) === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        if (! is_array($decoded)) {
            return ['summary' => $this->text($value)];
        }

        return $this->safeEvidence($decoded);
    }

    public function text(string $value): string
    {
        $masked = preg_replace_callback(
            '/(?<!\d)\d{13,16}(?!\d)/',
            fn (array $matches): string => $this->identifier($matches[0]) ?? '',
            $value,
        );

        return preg_replace('/(Rp\.?\s*)[\d.,]+/i', '$1••••', (string) $masked) ?? '';
    }

    /**
     * @param  array<string|int, mixed>  $values
     * @return array<string, mixed>
     */
    private function safeEvidence(array $values): array
    {
        $safe = [];

        foreach ($values as $key => $value) {
            $key = (string) $key;

            if (preg_match('/nik|npwp|nib|upah|wage|income|penghasilan|nama|salary/i', $key)) {
                continue;
            }

            if (is_array($value)) {
                $safe[$key] = $this->safeEvidence($value);
            } elseif (is_string($value)) {
                $safe[$key] = $this->text($value);
            } elseif (is_int($value) || is_float($value) || is_bool($value) || $value === null) {
                $safe[$key] = $value;
            }
        }

        return $safe;
    }
}
