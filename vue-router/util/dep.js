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