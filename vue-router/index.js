//Router对象的主要功能是提供统一的编程接口
//接收配置参数：mode,id,routes
class Router {
    constructor(options){
        this.mode = options.mode || 'hash'
        this.routes = options.routes
        this.container = options.id
        //1.传入Router
        this.history = this.mode === 'history' ? new HTML5History(this) : new HashHistory(this)

        Object.defineProperty(this, 'route', {
            get: () => {
              return this.history.current
            }
        })

        this.init()
    }
    push(location){
        this.history.push(location)
    }
    replace(location){
        this.history.replaceState(location)
    }
    go(n){
        this.history.go(n)
    }
    render(){
        let i
        if ((i = this.history.current) && (i = i.route) && (i = i.component)) {
          document.getElementById(this.container).innerHTML = i
        }
    }
    init(){
        const history = this.history
        observer.call(this, this.history.current)
        new Watcher(this.history.current, 'route', this.render.bind(this))
        history.transitionTo(history.getCurrentLocation())
    }
}
//监听history.router对象
class Observer {
    constructor (value) {
      this.walk(value)
    }
  
    walk (obj) {
      Object.keys(obj).forEach((key) => {
        // 如果是对象，则递归调用walk，保证每个属性都可以被defineReactive
        if (typeof obj[key] === 'object') {
          this.walk(obj[key])
        }
        defineReactive(obj, key, obj[key])
      })
    }
  }
  
  function defineReactive(obj, key, value) {
    let dep = new Dep()
    Object.defineProperty(obj, key, {
      get: () => {
        if (Dep.target) {
          dep.add()
        }
        return value
      },
      set: (newValue) => {
        value = newValue
        dep.notify()
      }
    })
  }
  
  function observer(value) {
    return new Observer(value)
  }
//收集Watcher
  class Dep {
    constructor () {
      this.deppend = []
    }
    add () {
      this.deppend.push(Dep.target)
    }
    notify () {
      this.deppend.forEach((target) => {
        target.update()
      })
    }
  }
  
  Dep.target = null

  function setTarget (target) {
    Dep.target = target
  }

  function cleanTarget() {
    Dep.target = null
  }

  //Watcher监听route
  class Watcher {
    constructor (vm, expression, callback) {
      this.vm = vm
      this.callbacks = []
      this.expression = expression
      this.callbacks.push(callback)
      this.value = this.getVal()
  
    }
    getVal () {
      setTarget(this)
      let val = this.vm
      this.expression.split('.').forEach((key) => {
        val = val[key]
      })
      cleanTarget()
      return val
    }
  
  
    update () {
      this.callbacks.forEach((cb) => {
        cb()
      })
    }
  }

const inBrowser = window !== undefined
const supportsPushState = inBrowser && (function () {
    const ua = window.navigator.userAgent
  
    if (
      (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1 &&
      ua.indexOf('Windows Phone') === -1
    ) {
      return false
    }
  
    return window.history && 'pushState' in window.history
})()

//base对外提供接口，真实处理路由配置
//主要处理2种类型，一种是url格式的，另一种是{}格式的对象
class Base {
    constructor(router){
        //最终拿到外面的router对象的是x`对象
        this.router = router
        //定义current对象
        this.current = {
            path:'/',
            query:{},
            params:{},
            name:'',
            fullPath:'',
            route:{}
        }
    }
    transitionTo(target,cb){
        //拿到history或hash对象传入的locaion
        const targetRoute = match(target,this.router.routes)

        //开始执行路由跳转
        this.confirmTransition(targetRoute,()=>{
            //执行完路由钩子，开始给router对象配置参数
            //route就是匹配到的配置路由信息
            this.current.route = targetRoute
            this.current.name = targetRoute.name
            this.current.path = targetRoute.path
            this.current.query = targetRoute.query || getQuery()
            this.current.fullPath = getFullPath(this.current)
            cb && cb()
        })
    }
    confirmTransition(route,cb){
        //将钩子函数加入队列
        let queue = [].concat(
            this.router.beforeEach,
            this.current.route.beforeLeave,
            route.beforeEnter,
            route.afterEnter
        )

        let i = -1
        const step = () => {
            i++
            if(i > queue.length){
                cb()
            }
            else if(queue[i]){
                queue[i](step)
            } else {
                step()
            }
        }
        //执行队列
        step(i)
    }
}
function match(path,routeMap){
    let match = {}
    if(typeof path === 'string' || path.name === undefined){
        //url的情况
        for(let route of routeMap){
            //找到对于路由配置
            if(route.path === path){
                //保存找到的路由配置
                match = route
                break
            }
        }
    }else{
        //调用push方法时传入的route配置
        for(let route of routeMap){
            if(route.name === path.name){
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

function getQuery(){
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

function stringifyQuery(obj){
    const res = obj ? Object.keys(obj).map(key => {
        const val = obj[key]
        if(val === undefined){
            return ''
        }

        if(val === null){
            return key
        }

        if(Array.isArray(val)){
            const result = []
            val.forEach(val2 => {
                if(val2 === undefined){
                    return
                }
                if(val2 === null){
                    result.push(key)
                }
                else{
                    result.push(key + '=' + val2)
                }
            })
            return result.join('&')
        }
        return key + '=' + val
    }).filter(x => x.length > 0).join('&') : null
    return res ? `?${res}` : ''
}

function getFullPath({path,query={},hash=''},_stringifyQuery){
    const stringify = _stringifyQuery || stringifyQuery
    //完整路径 path + query + hash
    return (path || '/') + stringify(query) + hash
}


//hash对象提供了一些接口，用来进行hash的路由跳转
class HashHistory extends Base {
    constructor(router){
        //得到current路由信息对象
        super(router)
        //确保当前平台可以使用
        this.ensureSlash()
        window.addEventListener('hashchange',() => {
            //Base统一处理hash模式或者history模式下的location
            this.transitionTo(this.getCurrentLocation())
        })
    }
    push(location){
        this.transitionTo(location,() => {
            changeUrl(this.current.fullPath.substring(1))
        })
    }
    replaceState(location){
        this.transitionTo(location, () => {
          changeUrl(this.current.fullPath.substring(1), true)
        })
    }
    ensureSlash(){
        const path = this.getCurrentLocation()
        if (path.charAt(0) === '/') {
          return true
        }
        changeUrl(path)
        return false
    }
    getCurrentLocation(){
        const href = window.location.href
        const index = href.indexOf('#')
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
      window.history.pushState({}, '', `${base}#/${path}`)
    }
}

window.Router = Router


var router = new Router({
    id: 'router-view', //id do what ? 这个是用来找到容器的
    mode: 'hash', //选择模式
    routes: [ //路由配置项
      {
        path: '/', //路径
        name: 'home', //路径名
        component: '<div>Home</div>',//组件
        beforeEnter: (next) => { //钩子函数
          console.log('before enter home')
          next()
        },
        afterEnter: (next) => {
          console.log('enter home')
          next()
        },
        beforeLeave: (next) => {
          console.log('start leave home')
          next()
        }
      },
      {
        path: '/bar',
        name: 'bar',
        component: '<div>Bar</div>',
        beforeEnter: (next) => {
          console.log('before enter bar')
          next()
        },
        afterEnter: (next) => {
          console.log('enter bar')
          next()
        },
        beforeLeave: (next) => {
          console.log('start leave bar')
          next()
        }
      },
      {
        path: '/foo',
        name: 'foo',
        component: '<div>Foo</div>'
      }
    ]
})
  
//setTimeout(function () {
    //push一个路由配置对象
    // router.push({name: 'bar', query: {name: 'bar'}})
    // router.replace({name: 'foo', query: {name: 'foo'}})
    // console.log(router.route)
    router.push({name: 'bar', query: {name: 'bar'}})
router.push({path: '/', query: {name: 'bar'}})
//}, 1000)
  