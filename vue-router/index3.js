class Base {
    constructor(router){
        this.router = router
        this.current = {
            path:'/',
            name:'',
            params:{},
            query:{},
            fullPath:'',
            route:[]
        }
    }
    transitionTo(path,cb){
        const route = this.match(path,this.router.routes)
        this.comfirmTransitionTo(route,() => {
            this.current.path = route.path
            this.current.name = route.name
            this.current.params = route.params
            this.current.query = route.query
            this.current.route = route
            this.current.fullPath = route.fullPath
            cb && cb()
        })
    }
    comfirmTransitionTo(route,cb){
        const queue = [
            this.router.beforeEach,
            this.current.route.beforeLeave,
            route.beforeEnter,
            route.afterEnter
        ]

        function next(queue){
            let i = -1;
            (function _next(){
                i++
                if(i >= queue.length){
                    cb()
                }else if(queue[i]){
                    queue[i](_next)
                } else {
                    _next()
                }
            })()
        }
        next(queue)
    }
    match(path,routes){
        const isString = typeof path === 'string'
        let match = {}
        if(isString){
            const query = this.getQuery(path)
            const fullPath = path
            path = path.indexOf('?') !== -1 ? path.substring(0,path.indexOf('?')) : path
            match = {
                query,
                fullPath,
                ...routes.find(item => {
                return path === item['path']
            })}        
        }else {
            const query = path.query
            const route = routes.find(item => {
                return path.path === item['path'] || path.name === item['name']
            })
            const fullPath = route.path + this.stringifyQuery(path.query)
            match = {
                query,
                fullPath,
                ...route
            }
        }
        return match
    }
    getQuery(path){
        const query = path.indexOf('?') !== -1 ? path.substring(path.indexOf('?') + 1) : ''
        if(query){
           const queryArray = query.split('&')
           const res = {}
           queryArray.forEach((k) => {
                const kv = k.split('=')
                res[kv[0]] = kv[1]
           })
           return res
        }
    }
    getCurrentLocation(){
        const hash = window.location.hash.substring(1)
        return hash
    }
    stringifyQuery(query){
         const res = Object.keys(query).map((key) => {
            const val = query[key]
            if(val === undefined){
                return key
            }
            if(val === null){
                return ''
            }
            if(Array.isArray(val)){
                return val.map(props => {
                    return key + '=' + props
                }).join('&')
            }
            return key + '=' + val
        }).filter(str => str.length > 0).join('&')

        return '?' + res
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
           this.changeUrl(this.current)
        })
    }
    replace(location){
        this.transitionTo(location,() => {
            this.changeUrl(this.current,true)
        })
    }
    changeUrl(path,replace){
        const base = window.location.pathname
        if(replace){
          window.history.replaceState({},'',base + '#' + path.fullPath)
        }else{
           window.history.pushState({},'',base + '#' + path.fullPath)
        }
    }
}

class Watcher {
    constructor(vm,expr,cb){
        this.vm = vm
        this.expr = expr
        this.cb = cb
        this.value = this.getVal()
    }
    getVal(){
        Dep.target = this
        let val = this.vm[this.expr]
        Dep.target = null
        return val
    }
    update(){
        this.cb()
    }
}

class Dep {
    constructor(){
        Dep.target = null;
        this.subs = []
    }
    add(sub){
        this.subs.push(sub)
    }
    notify(){
        this.subs.forEach(sub => sub.update())
    }
}

class Observer {
    constructor(obj){
        this.walk(obj)
    }
    walk(obj){
        Object.keys(obj).forEach(key => {
            this.defineReactive(obj,key,obj[key])
        })
    }
    defineReactive(obj,key,value){
        const dep = new Dep()
        Object.defineProperty(obj,key,{
            get(){
                if(Dep.target){
                    dep.add(Dep.target)
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

class Router {
    constructor(options){
        this.container = options.id
        this.mode = options.mode || 'hash'
        this.routes = options.routes
        this.history = new HashHistory(this)
        this.init()
    }
    push(location){
        this.history.push(location)
    }
    replace(location){
        this.history.replace(location)
    }
    render(){
        document.getElementById(this.container).innerHTML = this.history.current.route.component
    }
    init(){
        observer(this.history.current)
        new Watcher(this.history.current,'route',this.render.bind(this))
    }
}

var router = new Router({
    id: 'router-view', //这个是用来找到容器的
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

router.push({name: 'home', query: {name: ['bar','foo','ok']}})

setTimeout(() => {
router.replace({name: 'bar', query: {name: 'bar'}}) 
},3000)

