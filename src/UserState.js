import client from './TerryClient';
import Submission from './Submission';
import Observable from './Observable';
import ObservablePromise from './ObservablePromise';
import UserTaskState from './UserTaskState';
import Task from './Task';

export default class UserState extends Observable {
  constructor(model, data) {
    super();
    this.model = model;
    this.data = data;

    this.userTaskState = {};
    for(const task of data.contest.tasks) {
      const state = new UserTaskState(this.model, this, task);
      this.userTaskState[task.name] = state;
    }
  }

  getTasks() {
    return this.data.contest.tasks.map((d) => new Task(this, d.name, d));
  }

  getTask(taskName) {
    const byName = {};
    for(let task of this.getTasks()) {
      byName[task.name] = task;
    }
    return byName[taskName];
  }

  getTaskState(taskName) {
    return this.userTaskState[taskName];
  }

}
