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

