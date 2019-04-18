class Watcher {
    constructor(vm,exp,cb){
        this.cb = cb
        this.exp = exp
        this.vm = vm
        this.value = this.get()
    }
    update(){
        this.run()
    }
    run(){
        //拿到当前的值，看看是不是变化了
        let value = this.vm.data[this.exp]
        let oldVal = this.value
        if(value !== oldVal){
            this.value = value
            //调用回调，将新旧值传给watcher
            this.cb.call(this.vm,value,oldVal)
        }
    }
    get(){
        Dep.target = this;
        //记录初始值
        let value = this.vm.data[this.exp]
        Dep.target = null
        return value
    }
}