import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AuditPriorityController::index
 * @see app/Http/Controllers/AuditPriorityController.php:18
 * @route '/audit-priority'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/audit-priority',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AuditPriorityController::index
 * @see app/Http/Controllers/AuditPriorityController.php:18
 * @route '/audit-priority'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AuditPriorityController::index
 * @see app/Http/Controllers/AuditPriorityController.php:18
 * @route '/audit-priority'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AuditPriorityController::index
 * @see app/Http/Controllers/AuditPriorityController.php:18
 * @route '/audit-priority'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AuditPriorityController::index
 * @see app/Http/Controllers/AuditPriorityController.php:18
 * @route '/audit-priority'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AuditPriorityController::index
 * @see app/Http/Controllers/AuditPriorityController.php:18
 * @route '/audit-priority'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AuditPriorityController::index
 * @see app/Http/Controllers/AuditPriorityController.php:18
 * @route '/audit-priority'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
const AuditPriorityController = { index }

export default AuditPriorityController