import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AnomalyController::index
 * @see app/Http/Controllers/AnomalyController.php:81
 * @route '/anomalies'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/anomalies',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AnomalyController::index
 * @see app/Http/Controllers/AnomalyController.php:81
 * @route '/anomalies'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnomalyController::index
 * @see app/Http/Controllers/AnomalyController.php:81
 * @route '/anomalies'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AnomalyController::index
 * @see app/Http/Controllers/AnomalyController.php:81
 * @route '/anomalies'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AnomalyController::index
 * @see app/Http/Controllers/AnomalyController.php:81
 * @route '/anomalies'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AnomalyController::index
 * @see app/Http/Controllers/AnomalyController.php:81
 * @route '/anomalies'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AnomalyController::index
 * @see app/Http/Controllers/AnomalyController.php:81
 * @route '/anomalies'
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
/**
* @see \App\Http\Controllers\AnomalyController::create
 * @see app/Http/Controllers/AnomalyController.php:22
 * @route '/anomalies/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/anomalies/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AnomalyController::create
 * @see app/Http/Controllers/AnomalyController.php:22
 * @route '/anomalies/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnomalyController::create
 * @see app/Http/Controllers/AnomalyController.php:22
 * @route '/anomalies/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AnomalyController::create
 * @see app/Http/Controllers/AnomalyController.php:22
 * @route '/anomalies/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AnomalyController::create
 * @see app/Http/Controllers/AnomalyController.php:22
 * @route '/anomalies/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AnomalyController::create
 * @see app/Http/Controllers/AnomalyController.php:22
 * @route '/anomalies/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AnomalyController::create
 * @see app/Http/Controllers/AnomalyController.php:22
 * @route '/anomalies/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\AnomalyController::store
 * @see app/Http/Controllers/AnomalyController.php:36
 * @route '/anomalies'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/anomalies',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AnomalyController::store
 * @see app/Http/Controllers/AnomalyController.php:36
 * @route '/anomalies'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnomalyController::store
 * @see app/Http/Controllers/AnomalyController.php:36
 * @route '/anomalies'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\AnomalyController::store
 * @see app/Http/Controllers/AnomalyController.php:36
 * @route '/anomalies'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AnomalyController::store
 * @see app/Http/Controllers/AnomalyController.php:36
 * @route '/anomalies'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const AnomalyController = { index, create, store }

export default AnomalyController