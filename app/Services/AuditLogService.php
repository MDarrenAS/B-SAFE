<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditLogService
{
    /**
     * @param  array<string, int|float|string|bool|null>  $metadata
     */
    public function record(
        ?int $userId,
        string $action,
        string $resource,
        ?string $resourceId = null,
        array $metadata = [],
    ): AuditLog {
        return AuditLog::query()->create([
            'user_id' => $userId,
            'action' => $action,
            'resource' => $resource,
            'resource_id' => $resourceId,
            'metadata' => $metadata,
        ]);
    }
}
