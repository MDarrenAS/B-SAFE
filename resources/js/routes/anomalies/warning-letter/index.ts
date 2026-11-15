import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\WarningLetterController::store
 * @see app/Http/Controllers/WarningLetterController.php:18
 * @route '/anomalies/{fraudAlert}/warning-letter'
 */
export const store = (args: { fraudAlert: number | { id: number } } | [fraudAlert: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/anomalies/{fraudAlert}/warning-letter',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WarningLetterController::store
 * @see app/Http/Controllers/WarningLetterController.php:18
 * @route '/anomalies/{fraudAlert}/warning-letter'
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
* @see \App\Http\Controllers\WarningLetterController::store
 * @see app/Http/Controllers/WarningLetterController.php:18
 * @route '/anomalies/{fraudAlert}/warning-letter'
 */
store.post = (args: { fraudAlert: number | { id: number } } | [fraudAlert: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WarningLetterController::store
 * @see app/Http/Controllers/WarningLetterController.php:18
 * @route '/anomalies/{fraudAlert}/warning-letter'
 */
    const storeForm = (args: { fraudAlert: number | { id: number } } | [fraudAlert: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WarningLetterController::store
 * @see app/Http/Controllers/WarningLetterController.php:18
 * @route '/anomalies/{fraudAlert}/warning-letter'
 */
        storeForm.post = (args: { fraudAlert: number | { id: number } } | [fraudAlert: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const warningLetter = {
    store: Object.assign(store, store),
}

export default warningLetter