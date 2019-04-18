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
}
