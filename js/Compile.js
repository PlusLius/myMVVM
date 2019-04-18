class Compile {
    constructor(el,vm){
        this.el = document.querySelector(el)
        this.vm = vm
        this.fragment = null
        this.init()
    }
    init(){
        if(this.el){
            //将模版代码转换为内存代码
            this.fragment = this.nodeToFragment(this.el)
            //将模版变量替换为data里面的值
            this.compileElement(this.fragment)
            //将代码添加到真实dom中去
            this.el.appendChild(this.fragment)
        }
    }
    nodeToFragment(el){
        let child = el.firstChild
        let fragment = document.createDocumentFragment()
        while(child){
            fragment.appendChild(child)
            child = el.firstChild
        }
        return fragment
    }
    isElementNode(node){
        return node.nodeType === 1
    }
    isTextNode(node){
        return node.nodeType === 3
    }
    isDirective(attr){
        return attr.startsWith('v-')
    }
    isEventDirective(attr){
        return attr.startsWith('on:')
    }
    compileElement(fragmentNode){
        let nodes = Array.from(fragmentNode.childNodes)
        nodes.forEach(node => {
             let reg = /\{\{(.*)\}\}/
             let text = node.textContent

             if(this.isElementNode(node)){
                this.compile(node)
             } else if(this.isTextNode(node) && reg.test(text)){
                this.compileText(node,reg.exec(text)[1])
             }

             if(node.childNodes && node.childNodes.length){
                 this.compileElement(node)
             }
        })
    }
    compile(node){
        let attrs = Array.from(node.attributes)
        attrs.forEach(attr => {
            let attrName = attr.name
            if(this.isDirective(attrName)){
                let exp = attr.value
                let dir = attrName.substring(2)
                if(this.isEventDirective(dir)){
                    this.compileEvent(node,this.vm,exp,dir)
                }else{
                    this.compileModel(node,this.vm,exp,dir)
                }
                node.removeAttribute(attrName)
            }
        })
    }
    compileEvent(node,vm,exp,dir){
        let eventType = dir.split(':')[1]
        let cb = vm.methods && vm.methods[exp]

        if(eventType && cb){
            node.addEventListener(eventType,cb.bind(vm),false)
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
    modelUpdater(node,value,oldValue){
        node.value = typeof value === 'undefined' ? '' : value
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
    updateText(node,value){
        node.textContent = typeof value === 'undefined' ? '' : value
    }
}