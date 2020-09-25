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

  static loading<T, E>() {
    return new Loadable<T, E>();
  }

  static of<T, E>(value: T) {
    return new Loadable<T, E>(value);
  }

  static error<T, E>(error: E) {
    return new Loadable<T, E>(undefined, error);
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
    if (this.value_ === undefined) throw new Error("Cannot get value, the state is " + this.state);
    return this.value_;
  }

  error(): E {
    if (this.error_ === undefined) throw new Error("Cannot get error, the state is " + this.state);
    return this.error_;
  }

  valueOr(def: T): T {
    if (this.value_ === undefined) return def;
    return this.value_;
  }
}
