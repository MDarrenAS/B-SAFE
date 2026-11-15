import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\CompanyController::show
 * @see app/Http/Controllers/CompanyController.php:16
 * @route '/companies/{company}'
 */
export const show = (args: { company: string | { nib: string } } | [company: string | { nib: string } ] | string | { nib: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/companies/{company}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CompanyController::show
 * @see app/Http/Controllers/CompanyController.php:16
 * @route '/companies/{company}'
 */
show.url = (args: { company: string | { nib: string } } | [company: string | { nib: string } ] | string | { nib: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { company: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'nib' in args) {
            args = { company: args.nib }
        }
    
    if (Array.isArray(args)) {
        args = {
                    company: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        company: typeof args.company === 'object'
                ? args.company.nib
                : args.company,
                }

    return show.definition.url
            .replace('{company}', parsedArgs.company.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CompanyController::show
 * @see app/Http/Controllers/CompanyController.php:16
 * @route '/companies/{company}'
 */
show.get = (args: { company: string | { nib: string } } | [company: string | { nib: string } ] | string | { nib: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CompanyController::show
 * @see app/Http/Controllers/CompanyController.php:16
 * @route '/companies/{company}'
 */
show.head = (args: { company: string | { nib: string } } | [company: string | { nib: string } ] | string | { nib: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CompanyController::show
 * @see app/Http/Controllers/CompanyController.php:16
 * @route '/companies/{company}'
 */
    const showForm = (args: { company: string | { nib: string } } | [company: string | { nib: string } ] | string | { nib: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CompanyController::show
 * @see app/Http/Controllers/CompanyController.php:16
 * @route '/companies/{company}'
 */
        showForm.get = (args: { company: string | { nib: string } } | [company: string | { nib: string } ] | string | { nib: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CompanyController::show
 * @see app/Http/Controllers/CompanyController.php:16
 * @route '/companies/{company}'
 */
        showForm.head = (args: { company: string | { nib: string } } | [company: string | { nib: string } ] | string | { nib: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const companies = {
    show: Object.assign(show, show),
}

export default companies