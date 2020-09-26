export enum LoadableState {
  Loading,
  Ready,
  Error,
}

export default class Loadable<T, E = unknown> {
  private state = LoadableState.Loading;

  private value_?: T;

  private error_?: E;

  private constructor(value?: T, error?: E) {
    if (value !== undefined) {
      this.state = LoadableState.Ready;
      this.value_ = value;
    } else if (error !== undefined) {
      this.state = LoadableState.Error;
      this.error_ = error;
    } else {
      this.state = LoadableState.Loading;
    }
  }

  static loading<T_, E_>() {
    return new Loadable<T_, E_>();
  }

  static of<T_, E_>(value: T_) {
    return new Loadable<T_, E_>(value);
  }

  static error<T_, E_>(error: E_) {
    return new Loadable<T_, E_>(undefined, error);
  }

  isLoading() {
    return this.state === LoadableState.Loading;
  }

  isReady() {
    return this.state === LoadableState.Ready;
  }

  isError() {
    return this.state === LoadableState.Error;
  }

  value(): T {
    if (this.value_ === undefined) throw new Error(`Cannot get value, the state is ${this.state}`);
    return this.value_;
  }

  error(): E {
    if (this.error_ === undefined) throw new Error(`Cannot get error, the state is ${this.state}`);
    return this.error_;
  }

  valueOr(def: T): T {
    if (this.value_ === undefined) return def;
    return this.value_;
  }
}
