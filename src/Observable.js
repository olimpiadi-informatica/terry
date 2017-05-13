class Observable {
    constructor() {
      this.observers = [];
    }

    pushObserver(o) {
      this.observers.push(o);
    }

    popObserver(o) {
      const oo = this.observers.pop();

      if(o !== oo) throw new Error("observer popped out-of-order");
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
