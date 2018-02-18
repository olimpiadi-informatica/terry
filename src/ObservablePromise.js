import Observable from './Observable';

export default class ObservablePromise extends Observable {
  constructor(promise) {
    super();

    this.state = "pending";

    this.value = null;
    this.error = null;

    promise.then((value) => {
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
