import client from './TerryClient';
import Source from './Source';
import Output from './Output';
import Observable from './Observable';

class SubmissionList extends Observable {
    constructor(taskName, model) {
      super();

      this.taskName = taskName;
      this.model = model;
    }

    load() {
      if(this.isLoading()) throw new Error("load() called while already loading");

      this.fireUpdate();
      const endpoint = process.env.REACT_APP_API_ENDPOINT + "/user/" + this.model.user.token + "/submissions/" + this.taskName;
      // TODO: handle errors
      return this.loadPromise = client.get(endpoint).then((response) => {
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

}

export default SubmissionList;
