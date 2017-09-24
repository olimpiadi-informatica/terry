import client from './TerryClient';
import Observable from './Observable';

export default class SubmissionList extends Observable {
    constructor(taskState) {
      super();

      this.taskState = taskState;
    }

    load() {
      if(this.isLoading()) throw new Error("load() called while already loading");

      this.fireUpdate();
      // TODO: handle errors
      return this.loadPromise = client.api.get("/user/" + this.taskState.getUser().token + "/submissions/" + this.taskState.task.name).then((response) => {
        this.data = response.data;
        delete this.loadPromise;
        this.fireUpdate();
      }, (response) => {
        delete this.loadPromise;
        this.fireUpdate();
        return Promise.reject(response);
      });
    }

    isLoading() {
      return this.loadPromise !== undefined;
    }

    isLoaded() {
      return this.data !== undefined;
    }

    isEmpty() {
      if(!this.isLoaded()) throw new Error();

      return this.data.items && this.data.items.length === 0;
    }
}
