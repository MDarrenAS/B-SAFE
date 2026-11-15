import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:17
 * @route '/account'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/account',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:17
 * @route '/account'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:17
 * @route '/account'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:17
 * @route '/account'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:17
 * @route '/account'
 */
    const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:17
 * @route '/account'
 */
        showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:17
 * @route '/account'
 */
        showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const account = {
    show: Object.assign(show, show),
}

export default account