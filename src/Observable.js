export default class Observable {
  constructor() {
    this.observers = new Set();
  }

  pushObserver(o) {
    if (this.observers.has(o)) throw new Error();
    this.observers.add(o);
  }

  popObserver(o) {
    if (!this.observers.has(o)) throw new Error();
    this.observers.delete(o);
  }

  fireUpdate() {
    this.propagateUpdate();
  }

  propagateUpdate() {
    const observers = new Set(this.observers);
    for (let o of observers) {
      o.forceUpdate();
    }
  }

  // Delegate for chaining observers
  forceUpdate() {
    this.propagateUpdate();
  }

}
