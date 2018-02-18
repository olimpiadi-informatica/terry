import client from './TerryClient';
import Observable from './Observable';

export default class Users extends Observable {
    constructor(session) {
      super();

      this.session = session;
    }

    load() {
      // ignore double calls
      if(this.isLoading()) return;

      this.fireUpdate();

      return this.loadPromise = client.adminApi(this.session.adminToken(), "/user_list")
          .then((response) => {
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
