type ForceUpdateable = {
  //React.ComponentType<RouteComponentProps<any>>
  forceUpdate: () => void;
};

export default class Observable {
  observers: ForceUpdateable[];

  constructor() {
    this.observers = [];
  }

  pushObserver(o: ForceUpdateable) {
    if (this.observers.indexOf(o) >= 0) throw new Error();
    this.observers.push(o);
  }

  popObserver(o: ForceUpdateable) {
    if (this.observers.indexOf(o) < 0) throw new Error();
    this.observers.splice(this.observers.indexOf(o), 1);
  }

  fireUpdate() {
    this.propagateUpdate();
  }

  propagateUpdate() {
    const observers = [...this.observers];
    for (const o of observers) {
      o.forceUpdate();
    }
  }

  // Delegate for chaining observers
  forceUpdate() {
    this.propagateUpdate();
  }
}
