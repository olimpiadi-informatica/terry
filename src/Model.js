import client from './TerryClient';
import Cookies from 'universal-cookie';
import Observable from './Observable';
import UserTaskState from './UserTaskState';
import { DateTime, Duration } from 'luxon';
import Task from './Task';
import SubmissionResult from './SubmissionResult';

export default class Model extends Observable {
  static cookieName = "userToken";

  constructor() {
    super();

    this.cookies = new Cookies();
    this.inputGenerationPromise = {};
    this.submissions = {};
  }

  getContest() {
    return {
      data: this.user.contest,
    };
  }

  onAppStart() {
    this.maybeLoadUser();
  }

  loadUser(token) {
    return client.api.get('/user/' + token).then((response) => {
      this.timeDelta = DateTime.local().diff(DateTime.fromHTTP(response.headers['date']));
      return response;
    });
  }

  isLoggedIn() {
    const userToken = this.cookies.get(Model.cookieName);
    return userToken !== undefined;
  }

  isUserLoaded() {
    return this.user !== undefined;
  }

  isUserLoading() {
    return this.userLoadingPromise !== undefined;
  }

  maybeLoadUser() {
    if(this.isLoggedIn()) {
      this.refreshUser();
    }
  }

  refreshUser() {
    if(!this.isLoggedIn()) throw Error("refreshUser can only be called after a successful login");
    const userToken = this.cookies.get(Model.cookieName);

    return this.userLoadingPromise = this.loadUser(userToken)
      .then(response => {
        delete this.userLoadingPromise;
        this.user = response.data;
        this.enterContest();
        this.fireUpdate();
      })
      .catch(response => {
        delete this.userLoadingPromise;
        console.log("Forced logout because: ", response);
        this.logout();
        return Promise.reject(response);
      });
  }

  attemptLogin(token) {
    delete this.user;
    this.loginAttempt = {};

    this.fireUpdate();

    return this.loadUser(token)
      .then((response) => {
        this.user = response.data;
        this.cookies.set(Model.cookieName, this.user.token);
        // if the login is valid the contest must be reloaded, in fact most of the useful properties are not present yet
        // like the tasks and the start time. contest.load() will fire all the required updates
        this.enterContest();
        this.fireUpdate();
      })
      .catch((response) => {
        console.error(response);
        this.loginAttempt.error = response;
        this.fireUpdate();
        return Promise.reject(response);                
      });
  }

  logout() {
    if(!this.isLoggedIn()) throw Error("logout() should be called only if logged in");
    this.cookies.remove(Model.cookieName);
    delete this.user;
    // TODO redirect to /
    this.fireUpdate();
  }

  // function to be called when both user and contest are loaded
  enterContest() {
    this.userTaskState = {};
    for(const task of this.user.contest.tasks) {
      const state = new UserTaskState(this, task);
      this.userTaskState[task.name] = state;
    }
  }

  getTaskState(taskName) {
    return this.userTaskState[taskName];
  }

  getTasks() {
    if(!this.isUserLoaded()) throw new Error();

    return this.user.contest.tasks.map((d) => new Task(this, d.name, d));
  }

  getTask(taskName) {
    const byName = {};
    for(let task of this.getTasks()) {
      byName[task.name] = task;
    }
    return byName[taskName];
  }

  getSubmission(id) {
    if (this.submissions[id] !== undefined) return this.submissions[id];

    return this.submissions[id] = new SubmissionResult(this, id);
  }
}
