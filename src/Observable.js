class Observable {
    constructor() {
      this.observers = new Set();
    }

    pushObserver(o) {
      if(this.observers.has(o)) throw new Error();
      this.observers.add(o);
    }

    popObserver(o) {
      if(!this.observers.has(o)) throw new Error();
      this.observers.delete(o);
    }

    fireUpdate() {
      for(let o of this.observers) {
        o.forceUpdate();
      }
    }

    // Delegate for chaining observers
    forceUpdate() {
      this.fireUpdate();
    }
}

export default Observable;
