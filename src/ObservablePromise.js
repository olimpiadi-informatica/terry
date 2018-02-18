import Observable from './Observable';

export default class ObservablePromise extends Observable {
  constructor(promise) {
    super();

    this.promise = promise;

    if(!promise.then) throw new Error("ObservablePromise was not provided with a valid promise");

    this.state = "pending";

    this.value = null;
    this.error = null;

    this.fireUpdate();
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

  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.promise.catch(onRejected);
  }

}
