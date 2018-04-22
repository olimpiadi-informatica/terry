import Observable from './Observable';

export default class ObservablePromise extends Observable {
  delegate: Promise<any>;
  state: string;
  value: any;
  error: any;

  constructor(delegate: Promise<any>) {
    super();

    this.delegate = delegate;

    if (!delegate.then) throw new Error("ObservablePromise was not provided with a valid promise");

    this.state = "pending";

    this.value = null;
    this.error = null;

    delegate.then((value) => {
      this.state = "fulfilled";
      this.value = value;
      this.fireUpdate();
    }, (error) => {
      this.state = "rejected";
      this.error = error;
      this.fireUpdate();
    });
  }

  isPending() {
    return this.state === "pending";
  }

  isFulfilled() {
    return this.state === "fulfilled";
  }

  isRejected() {
    return this.state === "rejected";
  }

}
