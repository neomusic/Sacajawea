import { parse } from 'url'
import NextLink from './link'
import NextRouter from './Router'
import Route from './Route'
import { generateRouteFromObjectName, redirectToLocalizedHome, detectLocale } from './helpers/routeHelper'
import MiddlewareManager from './middleware/MiddlewareManager'

export default class Routes {
  constructor({ Link = NextLink, Router = NextRouter, locale, forceLocale = false, siteUrl } = {}) {
    this.routes = []
    this.Link = this.getLink(Link)
    this.Router = this.getRouter(Router)
    this.locale = locale
    this.forceLocale = forceLocale
    this.siteUrl = siteUrl
  }

  add(name, locale = this.locale, pattern, page, data, update = false) {
    let options
    if (name instanceof Object) {
      options = generateRouteFromObjectName(name)
    } else {
      if (typeof page === 'object') {
        options = { data: page, page: name, pattern, locale, name }
      } else {
        options = { data, page: page || name, pattern, locale, name }
      }
    }

    if (data) {
      options.data = data
    }

    options.isDefaultLocale = locale === this.locale
    options.forceLocale = this.forceLocale

    if (this.findByName(name, locale)) {
      if (update) {
        // remove old route on update
        this.routes = this.routes.filter(route => route.name !== name || route.locale !== locale)
      } else {
        throw new Error(`Route "${name}" already exists`)
      }
    }

    this.routes.push(new Route(options))

    return this
  }

  middleware(functions) {
    if (!functions || !Array.isArray(functions)) {
      throw new Error('props must be an array')
    }

    const lastRoute = this.routes[this.routes.length - 1]

    functions.forEach((middleware, index) => {
      if (typeof middleware !== 'function') {
        throw new Error(`middleware at position ${index} is not a function`)
      }
    })

    lastRoute.setMiddlewares(functions)
    return this
  }

  setLocale(locale) {
    this.locale = locale
  }

  findByName(name, locale = this.locale) {
    return name && this.routes.filter(route => route.name === name && route.locale === locale)[0] || false
  }

  match(url) {
    const parsedUrl = parse(url, true)
    const { pathname, query } = parsedUrl

    return this.routes.reduce((result, route) => {
      if (result.route) {
        return result
      }
      const params = route.match(pathname)
      if (!params) {
        return result
      }

      return { ...result, route, params, query: { ...query, ...params } }
    }, { query, parsedUrl })
  }

  findAndGetUrls(name, locale = this.locale, params = {}) {
    const route = this.findByName(name, locale)

    if (route) {
      return { route, urls: route.getUrls(params), byName: true }
    }
    throw new Error(`Route "${name}" not found`)

  }

  getMultilanguageUrls(route, query) {
    return this.routes.filter((r) => {
      return r.name === route.name
    }).map((r) => {
      return {
        url: r.getAs(query),
        locale: r.locale,
        isDefaultLocale: r.isDefaultLocale
      }
    })
  }

  getRequestHandler(app, customHandler) {
    const nextHandler = app.getRequestHandler()

    return (req, res) => {
      const { route, query, parsedUrl } = this.match(req.url)

      if (route) {
        req.locale = route.locale
        req.nextRoute = route
        req.siteUrl = this.siteUrl
        req.getMultilanguageUrls = () => this.getMultilanguageUrls(route, query)

        const middleware = MiddlewareManager(route.middlewares, { req, res, route, query })
        middleware((err, data) => {
          if (err) {
            const { pathname } = parsedUrl
            const { statusCode = 500 } = err
            res.statusCode = statusCode
            app.renderError(err, req, res, pathname, query)
            return
          }

          req.nextData = data
          renderRoute(app, customHandler, { req, res, route, query })
        })

        return
      }


      if (req.url === '/' && this.forceLocale) {
        const detectedLocale = detectLocale({ req, routes: this.routes, defaultLocale: this.locale })
        redirectToLocalizedHome(res, detectedLocale)
        return
      }

      nextHandler(req, res, parsedUrl)
    }
  }

  getLink(Link) { //eslint-disable-line
    const LinkRoutes = props => {
      const { locale = this.locale, route, params, ...newProps } = props
      const { urls } = this.findAndGetUrls(route, locale, params)
      const propsToPass = { ...newProps, ...urls }

      return <Link {...propsToPass} />
    }
    return LinkRoutes
  }

  getRouter(Router) {
    const wrap = method => (route, params, locale) => {
      const { urls: { href } } = this.findAndGetUrls(route, locale, params)
      return Router[method](href)
    }

    Router.pushRoute = wrap('push')
    Router.replaceRoute = wrap('replace')
    return Router
  }
}

const renderRoute = (app, customHandler, { req, res, route, query }) => {
  if (customHandler) {
    customHandler({ req, res, route, query })
  } else {
    app.render(req, res, route.page, query)
  }
}
