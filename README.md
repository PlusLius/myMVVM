## Vue依赖追踪原理

```js
class Dep {
    constructor(){
        this.subs = []
    }
    addSub(sub){
        this.subs.push(sub)
    }
    notify(){
        this.subs.forEach(sub => sub.update())
    }
}

class Watcher {
    constructor(){
        Dep.target = this
    }
    update(){
        console.log('视图更新！')
    }   
}

class Observer{
    constructor(data){
        let self = this
        Object.keys(data).forEach(key => 
            self.defineReactive(data,key,data[key])
        )
    }
    defineReactive(data,key,val){
        const dep = new Dep()

        Object.defineProperty(data,key,{
            configurable:true,
            enumerable:true,
            get(){
                dep.addSub(Dep.target)
                return val
            },
            set(newVal){
                if(val === newVal)return;
                val = newVal;
                dep.notify()
            }
        })
    }
}

function observe(value){
    if(!value || typeof value != 'object')return;
    new Observer(value)
}

class Vue {
    constructor(options){
        //1.挂载data到vm
        this._data = options.data
        //2.添加getter setter
        observe(this._data)
        //3.注册订阅者watcher
        new Watcher()
        //4.强制添加订阅者
        console.log('添加订阅者' + this._data.test)
    }
}


const test = new Vue({
    data:{
        test:'plus'
    }
})

test._data.test = 'test plus'
console.log(test._data.test)

Dep.target = null
```

## Vue的执行过程

```js
proxyData(data){
    Object.keys(data).forEach(key => {
        //1.将vm.data下的对象,代理到vm下
        Object.defineProperty(this,key,{
            configurable:true,
            enumerable:false,
            get(){
                return data[key]
            },
            set(newVal){
                data[key] = newVal
            }
        })
    })
}

defineReactive(data,key,val){
    //3.收集watcher
    const dep = new Dep()
    //2.递归定义getter setter 为了后续添加wacher订阅者作准备
    observe(val)
    Object.defineProperty(data,key,{
        enumerable:true,
        configurable:true,
        get(){
            if(Dep.target){
                dep.addSub(Dep.target)
            }
            return val
        },
        set(newVal){
            if(val === newVal)return;
            val = newVal
            dep.notify()
        }
    })
}
}

compileModel(node,vm,exp,dir){
    let val = vm[exp]
    this.modelUpdater(node,val)
    //5.在编译v-model时添加订阅者
    new Watcher(vm,exp,(value,oldValue) => {
        //将新的值添加到真实dom上
        this.modelUpdater(node,value)
    })
    //绑定输入事件
    node.addEventListener('input',e => {
        let newValue = e.target.value
        if(val === newValue)return;
        //当接收到视图变化的时候通知订阅者更新
        vm[exp] = newValue
    })
}

compileText(node,exp){
    let initText = this.vm[exp]
    //将变量替换为变量所对应的文字
    this.updateText(node,initText)
    //6.编译文本节点的时候添加订阅者
    new Watcher(this.vm,exp,(value,oldValue) => {
        this.updateText(node,value)
    })
}

class Vue {
    constructor(options){
        this.data = options.data;
        this.methods = options.methods;
        this.proxyData(this.data)
        observe(this.data)
        //4.编译#app模版代码
        new Compile(options.el,this)
        //7.执行生命周期函数
        options.mounted.call(this);
    }
} 

```

## Vuex原理

```js

const state = {
    foo:'foo',
    bar:'bar'
}
const actions = {
    asyncFoo(commit,payload){
        setTimeout(() => commit('foo',payload),3000)
    },
    asyncBar(commit,payload){
        setTimeout(() => commit('bar',payload),3000)
    }
}
const mutations = {
    foo(state,type,payload){
         state[type] = payload
    },
    bar(state,type,payload){
         state[type] = payload
    }
}
const store = new Store({state,actions,mutations});
window.Vue.use(Vuex)
new Vue({
    name:'testRoot',
    el:'#app',
    store,
    data:{
        title:'plus'
    },
    beforeCreate(){
        this.$store.dispatch('asyncFoo','我是foo')
        this.$store.dispatch('asyncBar','我是bar')
    },
    computed:{  
        foo(){
            return this.$store._state.foo
        },
        bar(){
            return this.$store._state.bar
        }
    }
})

class Store {
    constructor({state,actions,mutations}){   
        this._vm = new Vue({
            data:{
                $$state:state
            }
        })
        
        this._state = this._vm._data.$$state
       
        this._actions = {
            ...actions,
        }

        this._mutations = {
            ...mutations
        }
    }

    commit(type,payload,_options){
        const entry = [this._mutations[type]]
        entry.forEach((handler) => {
            handler(this._vm._data.$$state,type,payload);
        })
    }
   
    dispatch(type,payload){
        const entry = [this._actions[type]]
        return entry[0](this.commit.bind(this),payload)
    }
}

function vuexInit(){
    //拿到根组件传入到配置参数
    const options = this.$options
    if(options.store){
        //有store挂到$store上
        this.$store = options.store
    } else {
        //没有store查找父组件到store
        this.$store = options.parent.$store
    }
}

function Vuex(_Vue){
    //将vuex插件混入到各个组件到beforeCreate中去
    _Vue.mixin({beforeCreate:vuexInit})
}

```