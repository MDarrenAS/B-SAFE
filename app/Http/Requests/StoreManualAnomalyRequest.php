<?php

namespace App\Http\Requests;

use App\Enums\AnomalyType;
use App\Enums\RiskLevel;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreManualAnomalyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'npwp' => ['required', 'string', 'regex:/^\d{16}$/'],
            'type' => ['required', Rule::in(array_column(AnomalyType::cases(), 'value'))],
            'risk' => ['required', Rule::in(array_column(RiskLevel::cases(), 'value'))],
            'year' => ['required', 'integer', 'between:2000,'.now()->year],
            'month' => ['required', 'integer', 'between:1,12'],
            'summary' => ['required', 'string', 'min:5', 'max:2000'],
        ];
    }
}
