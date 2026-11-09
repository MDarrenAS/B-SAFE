<?php

namespace App\Http\Requests;

use App\Enums\CaseStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFraudAlertStatusRequest extends FormRequest
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
            'status' => ['required', Rule::in(array_column(CaseStatus::cases(), 'value'))],
            'notes' => ['required', 'string', 'min:5', 'max:2000'],
        ];
    }
}
