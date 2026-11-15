import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\RiskMapController::index
 * @see app/Http/Controllers/RiskMapController.php:16
 * @route '/risk-map'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/risk-map',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RiskMapController::index
 * @see app/Http/Controllers/RiskMapController.php:16
 * @route '/risk-map'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RiskMapController::index
 * @see app/Http/Controllers/RiskMapController.php:16
 * @route '/risk-map'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RiskMapController::index
 * @see app/Http/Controllers/RiskMapController.php:16
 * @route '/risk-map'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\RiskMapController::index
 * @see app/Http/Controllers/RiskMapController.php:16
 * @route '/risk-map'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\RiskMapController::index
 * @see app/Http/Controllers/RiskMapController.php:16
 * @route '/risk-map'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\RiskMapController::index
 * @see app/Http/Controllers/RiskMapController.php:16
 * @route '/risk-map'
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
const riskMap = {
    index: Object.assign(index, index),
}

export default riskMap