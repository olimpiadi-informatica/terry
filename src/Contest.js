import client from './TerryClient';
import Cookies from 'universal-cookie';
import Observable from './Observable';
import Task from './Task';

class Contest extends Observable {
    constructor() {
      super();

      this.cookies = new Cookies();
      this.inputGenerationPromise = {};
    }

    isLoading() {
      return this.loadPromise !== undefined;
    }

    load() {
      return this.loadPromise = client.get('/contest').then((response) => {
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

    getTasks() {
      if(!this.isLoaded()) throw new Error();

      return this.data.tasks.map((d) => new Task(this, d.name, d));
    }

    getTask(taskName) {
      const byName = {};
      for(let task of this.getTasks()) {
        byName[task.name] = task;
      }
      return byName[taskName];
    }

}

export default Contest;
