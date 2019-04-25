class HTML5History extends Base {
    constructor (router) {
     //拿到router对象
      super(router)
      window.addEventListener('popstate', () => {
        //匹配对于路由，进行
        this.transitionTo(getLocation())
      })
    }
  
    /**
     * 跳转，添加历史记录
     * @param location
     * @example this.push({name: 'home'})
     * @example this.push('/')
     */
    push (location) {
      const targetRoute = match(location, this.router.routes)
  
      this.transitionTo(targetRoute, () => {
        //拿到修改后的路径后，跳转到对应的url
        changeUrl(this.router.base, this.current.fullPath)
      })
    }
  
    /**
     * 跳转，添加历史记录
     * @param location
     * @example this.replaceState({name: 'home'})
     * @example this.replaceState('/')
     */
    replaceState(location) {
      const targetRoute = match(location, this.router.routes)
  
      this.transitionTo(targetRoute, () => {
        changeUrl(this.router.base, this.current.fullPath, true)
      })
    }
  
    go (n) {
      window.history.go(n)
    }
  
    getCurrentLocation () {
      return getLocation(this.router.base)
    }
  }
  
  function getLocation (base = ''){
    let path = window.location.pathname
    if (base && path.indexOf(base) === 0) {
      path = path.slice(base.length)
    }
    return (path || '/') + window.location.search + window.location.hash
  }
  
  function changeUrl(base, path, replace) {
    if (replace) {
      window.history.replaceState({}, '', (base + path).replace(/\/\//g, '/'))
    } else {
      window.history.pushState({}, '', (base + path).replace(/\/\//g, '/'))
    }
  }