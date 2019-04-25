class Base {
    constructor(router){
        //接收子类传来的router对象
        this.router = router
        //定义history对象拥有的原信息对象
        this.current = {
            path:'/',
            query:{},
            params:{},
            name:'',
            fullPath:'/',
            route:{}
        }
    }
    transitionTo(target,cb){
        //target是path，
        //match(path,路由配置)，拿到匹配结果
        const targetRoute = match(target,this.router.routes)
        //执行钩子函数队列
        this.confirmTransition(targetRoute, () => {
            //执行完后进行赋值
            this.current.route = targetRoute
            this.current.name = targetRoute.name
            this.current.path = targetRoute.path
            this.current.query = targetRoute.query || getQuery()
            this.current.fullPath = getFullPath(this.current)
            //有回调执行回调
            cb && cb()
        })
    }
        /**
     * 确认跳转
     * @param route
     * @param cb
     */
    confirmTransition (route, cb) {
        // 钩子函数执行队列
        let queue = [].concat(
            this.router.beforeEach,
            this.current.route.beforeLeave,
            route.beforeEnter,
            route.afterEnter
        )

        // 通过 step 调度执行
        let i = -1
        const step = () => {
            i ++
            if (i > queue.length) {
                cb()
            } else if (queue[i]) {
                queue[i](step)
            } else {
                step()
            }
        }
        step(i)
    }
}

function match(path, routeMap) {
    let match = {}
    if (typeof path === 'string' || path.name === undefined) {
      for(let route of routeMap) {
        //找到配置路由的path与window.path相匹配的项
        if (route.path === path || route.path === path.path) {
          //将匹配到的配置路由赋值给match
          match = route
          break;
        }
      }
    } else {
      for(let route of routeMap) {
        if (route.name === path.name) {
          //匹配路由名字，和加入query
          match = route
          if (path.query) {
            match.query = path.query
          }
          break;
        }
      }
    }
    return match
}

function getFullPath ({ path, query = {}, hash = '' }, _stringifyQuery){
    const stringify = _stringifyQuery || stringifyQuery
    return (path || '/') + stringify(query) + hash
}

function getQuery() {
    const hash = location.hash
    const queryStr = hash.indexOf('?') !== -1 ? hash.substring(hash.indexOf('?') + 1) : ''
    const queryArray = queryStr ? queryStr.split('&') : []
    let query = {}
    queryArray.forEach((q) => {
      let qArray = q.split('=')
      query[qArray[0]] = qArray[1]
    })
    return query
}

function stringifyQuery (obj) {
    const res = obj ? Object.keys(obj).map(key => {
      const val = obj[key]
  
      if (val === undefined) {
        return ''
      }
  
      if (val === null) {
        return key
      }
  
      if (Array.isArray(val)) {
        const result = []
        val.forEach(val2 => {
          if (val2 === undefined) {
            return
          }
          if (val2 === null) {
            result.push(key)
          } else {
            result.push(key + '=' + val2)
          }
        })
        return result.join('&')
      }
  
      return key + '=' + val
    }).filter(x => x.length > 0).join('&') : null
    return res ? `?${res}` : ''
}
  