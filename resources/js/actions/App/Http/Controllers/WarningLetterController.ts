import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
/**
* @see \App\Http\Controllers\WarningLetterController::show
 * @see app/Http/Controllers/WarningLetterController.php:64
 * @route '/warning-letters/{warningLetter}'
 */
export const show = (args: { warningLetter: number | { id: number } } | [warningLetter: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/warning-letters/{warningLetter}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WarningLetterController::show
 * @see app/Http/Controllers/WarningLetterController.php:64
 * @route '/warning-letters/{warningLetter}'
 */
show.url = (args: { warningLetter: number | { id: number } } | [warningLetter: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { warningLetter: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { warningLetter: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    warningLetter: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        warningLetter: typeof args.warningLetter === 'object'
                ? args.warningLetter.id
                : args.warningLetter,
                }

    return show.definition.url
            .replace('{warningLetter}', parsedArgs.warningLetter.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WarningLetterController::show
 * @see app/Http/Controllers/WarningLetterController.php:64
 * @route '/warning-letters/{warningLetter}'
 */
show.get = (args: { warningLetter: number | { id: number } } | [warningLetter: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WarningLetterController::show
 * @see app/Http/Controllers/WarningLetterController.php:64
 * @route '/warning-letters/{warningLetter}'
 */
show.head = (args: { warningLetter: number | { id: number } } | [warningLetter: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WarningLetterController::show
 * @see app/Http/Controllers/WarningLetterController.php:64
 * @route '/warning-letters/{warningLetter}'
 */
    const showForm = (args: { warningLetter: number | { id: number } } | [warningLetter: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WarningLetterController::show
 * @see app/Http/Controllers/WarningLetterController.php:64
 * @route '/warning-letters/{warningLetter}'
 */
        showForm.get = (args: { warningLetter: number | { id: number } } | [warningLetter: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WarningLetterController::show
 * @see app/Http/Controllers/WarningLetterController.php:64
 * @route '/warning-letters/{warningLetter}'
 */
        showForm.head = (args: { warningLetter: number | { id: number } } | [warningLetter: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const WarningLetterController = { store, show }

export default WarningLetterController