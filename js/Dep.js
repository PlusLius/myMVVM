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
        this._data = options.data
        observe(this._data)
        new Watcher()
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