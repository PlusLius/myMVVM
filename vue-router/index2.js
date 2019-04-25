class Base {
    constructor(router){
        this.router = router
        this.current = {
            path:'/',
            name:'',
            query:{},
            params:{},
            route:{},
            fullPath:''
        }
    }
    transitionTo(target,cb){
        let route = this.match(target,this.router.routes)
        this.confirmTransition(route,() => {
            this.current.route = route
            this.current.name = route.name
            this.current.path = route.path
            this.current.query = route.query 
            this.current.fullPath = route.fullPath
            cb && cb()
        })
    }
    confirmTransition(route,cb){
        const queue = [
            this.router.beforeEach,
            this.current.route.beforeLeave, //拿到上一次route的钩子
            route.beforeEnter,
            route.afterEnter
        ]

        function next(queue){
            let i = -1;
            (function _next(){
                i++
                if(i >= queue.length){
                    cb()
                } else if(queue[i]){
                    queue[i](_next)
                } else {
                    _next()
                }
            })()
        }
        next(queue)
    }
    match(path,routeMap){
        let match 
        let fullPath = path
        let isString = typeof path === 'string'
        path = isString ? (path.indexOf('?') !== -1 ? path.substring(0,path.indexOf('?')) : path) : path
        if(isString){
            match = routeMap.find((item) => (
                item['path'] === path
            ))
            match.query = this.getQuery()
            match.fullPath = fullPath
        }else{
            match = routeMap.find((item) => (
               path.name !== undefined ? (item['name'] === path.name ) : (path.path !== undefined ? item['path'] === path.path : '' )
            ))
            path.query ? match.query = path.query : '';
            match.fullPath = this.fullPath(fullPath,match)
        }
        return match
    }
    getQuery(){
        const hash = window.location.hash
        const queryStr = hash.indexOf('?') == -1 ? '' : hash.substring(hash.indexOf('?') + 1)
        const queryArray = queryStr ? queryStr.split('&') : []

        let query = {}

        queryArray.forEach(item => {
            let kv = item.split('=')
            query[kv[0]] = kv[1]
        })

        return query
    }
    fullPath({path,query = {}},match){
        path = path ? path : match['path']
        const res =  Object.keys(query).map(key => {
            const val = query[key]
            if(val === undefined){
                return ''
            }
            if(val === null){
                return key
            }
            if(Array.isArray(val)){
                const res = []
                val.forEach(props => {
                    if(props === null){
                        res.push(key) 
                    }
                    if(props === undefined){
                        return 
                    }
                    res.push(key + '=' + props)
                })
                return res.join('&')
            }
            return key + '=' + val
        }).filter(s => s.length > 0).join('&')

        return res ? path + `?${res}` : '' 
    }
}

class HashHistory extends Base{
    constructor(router){
        super(router)
        window.addEventListener('hashchange',() => {
            this.transitionTo(this.getCurrentLocation())
        })
    }
    push(location){
        this.transitionTo(location,() => {
            this.changeUrl(this.current.fullPath.substring(1))
        })        
    }   
    replace(location){
        this.transitionTo(location,() => {
            this.changeUrl(this.current.fullPath.substring(1),true)
        })    
    }
    getCurrentLocation(){
        const href = window.location.href
        const hash = href.indexOf('#')
        return hash === -1 ? '' : href.slice(hash + 1)
    }
    changeUrl(path,replace){
        const href = window.location.href
        const i = href.indexOf('#')
        const base = i >= 0 ? href.slice(0,i) : href
        if(replace){
          window.history.replaceState({},'',`${base}#/${path}`)
        }else{
          window.history.pushState({},'',`${base}#/${path}`)
        }
    }
}

class Dep {
    constructor(){
        Dep.target = null
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

function setTarget(target){
    Dep.target = target
}
function cleanTarget() {
    Dep.target = null
}


class Observer {
    constructor(value){
        this.walk(value)
    }
    walk(obj){
        Object.keys(obj).forEach((key) => {
            if(obj[key] === 'object'){
                this.walk(obj[key])
            }
            this.defineReactive(obj,key,obj[key])
        })
    }
    defineReactive(obj,key,value){
        let dep = new Dep()
        Object.defineProperty(obj,key,{
            get(){
                if(Dep.target){
                  dep.add()
                }
                return value
            },
            set(newValue){
                value = newValue
                dep.notify()
            }
        })
    }
}

function observer(value){
    new Observer(value)
}

class Watcher{
    constructor(vm,expression,callback){
        this.vm = vm
        this.callbacks = []
        this.expression = expression
        this.callbacks.push(callback)
        this.value = this.getVal()
    }
    getVal(){
        setTarget(this)
        let val = this.vm
        this.expression.split('.').forEach((key) => {
            val = val[key]
        })
        setTarget(this)
        return val
    } 
    update(){
        this.callbacks.forEach((cb) => {
            cb()
        })
    }
}

class Router {
    constructor(options){
        this.container = options.id
        this.mode = options.mode || 'hash'
        this.history = new HashHistory(this)
        this.routes = options.routes
        this.init()
    }
    push(location){
        this.history.push(location)
    }
    replace(location){
        this.history.replace(location)
    }
    render(){
        document.getElementById(this.container).innerHTML 
        = this.history.current.route.component
    }
    init(){
        const history = this.history
        observer.call(this,history.current)
        new Watcher(this.history.current,'route',this.render.bind(this))
    }
}



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
    router.replace({name: 'bar', query: {name: 'bar'}})

    // router.push({name: 'bar', query: {name: ['bar','foo','ok']}})
    //  router.push({path: '/', query: {name: 'bar'}})

// router.replace({name: 'foo', query: {name: 'foo'}})