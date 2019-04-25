class HashHistory extends Base {
    constructor (router) {
      //拿到router对象
      super(router)
      //确保是不是/
      this.ensureSlash()
      //监听hashchange的变化
      window.addEventListener('hashchange', () => {
          //继承Base的transitionTo，将路径传进去
        this.transitionTo(this.getCurrentLocation())
      })
    }
  
    push (location) {
        //包装对象，实际处理是Base.transitionTo
      const targetRoute = match(location, this.router.routes)
  
      this.transitionTo(targetRoute, () => {
        changeUrl(this.current.fullPath.substring(1))
      })
    }
  
    replaceState (location) {
        //包装对象，实际处理是Base.transitionTo
      const targetRoute = match(location, this.router.routes)
  
      this.transitionTo(targetRoute, () => {
        changeUrl(this.current.fullPath.substring(1), true)
      })
    }
  
  
    ensureSlash () {
      const path = this.getCurrentLocation()
      if (path.charAt(0) === '/') {
          //是/返回true
        return true
      }
      //如果不是/则跳转到对应的url并且返回false
      changeUrl(path)
      return false
    }
  
    getCurrentLocation() {
      //获取当前的url
      const href = window.location.href
      const index = href.indexOf('#')
      //拿到hash后面的路径
      return index === -1 ? '' : href.slice(index + 1)
    }
}
  
function changeUrl(path, replace) {
    const href = window.location.href
    const i = href.indexOf('#')
    const base = i >= 0 ? href.slice(0, i) : href
    if (replace) {
      window.history.replaceState({}, '', `${base}#/${path}`)
    } else {
        //跳转到对应url
      window.history.pushState({}, '', `${base}#/${path}`)
    }
}
 
  