import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AnomalyFollowUpController::store
 * @see app/Http/Controllers/AnomalyFollowUpController.php:14
 * @route '/anomalies/{fraudAlert}/follow-ups'
 */
export const store = (args: { fraudAlert: number | { id: number } } | [fraudAlert: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/anomalies/{fraudAlert}/follow-ups',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AnomalyFollowUpController::store
 * @see app/Http/Controllers/AnomalyFollowUpController.php:14
 * @route '/anomalies/{fraudAlert}/follow-ups'
 */
store.url = (args: { fraudAlert: number | { id: number } } | [fraudAlert: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { fraudAlert: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { fraudAlert: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    fraudAlert: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        fraudAlert: typeof args.fraudAlert === 'object'
                ? args.fraudAlert.id
                : args.fraudAlert,
                }

    return store.definition.url
            .replace('{fraudAlert}', parsedArgs.fraudAlert.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnomalyFollowUpController::store
 * @see app/Http/Controllers/AnomalyFollowUpController.php:14
 * @route '/anomalies/{fraudAlert}/follow-ups'
 */
store.post = (args: { fraudAlert: number | { id: number } } | [fraudAlert: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\AnomalyFollowUpController::store
 * @see app/Http/Controllers/AnomalyFollowUpController.php:14
 * @route '/anomalies/{fraudAlert}/follow-ups'
 */
    const storeForm = (args: { fraudAlert: number | { id: number } } | [fraudAlert: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AnomalyFollowUpController::store
 * @see app/Http/Controllers/AnomalyFollowUpController.php:14
 * @route '/anomalies/{fraudAlert}/follow-ups'
 */
        storeForm.post = (args: { fraudAlert: number | { id: number } } | [fraudAlert: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const AnomalyFollowUpController = { store }

export default AnomalyFollowUpController