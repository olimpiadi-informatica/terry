import client from '../TerryClient';
import Observable from './Observable';

export default class SubmissionResult extends Observable {
  constructor(contest, id, data) {
    super();

    this.contest = contest;
    this.id = id;
    this.data = data;
  }

  isLoading() {
    return this.loadPromise !== undefined;
  }

  load() {
    if(this.isLoading()) throw Error("load() called while already loading statement");

    this.fireUpdate();

    return this.loadPromise = client.api.get("/submission/" + this.id).then((response) => {
      this.data = response.data;
      delete this.loadPromise;
      this.fireUpdate();
    }, (response) => {
      delete this.loadPromise;
      this.fireUpdate();
      return Promise.reject(response);
    });
  }

  isLoaded() {
    return this.data !== undefined;
  }
}
