class Dep {
    constructor(){
        this.subs = []
        Dep.target = null
    }
    addSub(sub){
        this.subs.push(sub)
    }
    notify(){
        this.subs.forEach(sub => sub.update())
    }
}

class Observer {
    constructor(data){
        this.data = data;
        this.walk(this.data) 
    }
    walk(data){
        Object.keys(data).forEach(key => {
            this.defineReactive(data,key,data[key])            
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

function observe(value){
    if(!value || typeof value !== 'object')return;
    new Observer(value)
}