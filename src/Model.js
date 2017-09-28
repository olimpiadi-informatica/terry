import client from './TerryClient';
import Cookies from 'universal-cookie';
import Observable from './Observable';
import UserTaskState from './UserTaskState';
import Contest from './Contest';

export default class Model extends Observable {
  constructor() {
    super();

    this.cookies = new Cookies();
    this.inputGenerationPromise = {};

    this.contest = new Contest();
  }

  getContest() {
    return this.contest;
  }

  onAppStart() {
    this.getContest().load();
    this.maybeLoadUser();
  }

  loadUser(token) {
    return client.api.get('/user/' + token);
  }

  isLoggedIn() {
    const userToken = this.cookies.get('userToken');
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
    const userToken = this.cookies.get('userToken');

    return this.userLoadingPromise = this.loadUser(userToken)
      .then(response => {
        delete this.userLoadingPromise;
        this.user = response.data;
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
        this.cookies.set('userToken', token);
        // if the login is valid the contest must be reloaded, in fact most of the useful properties are not present yet
        // like the tasks and the start time. contest.load() will fire all the required updates
        this.contest.load();
      })
      .catch((response) => {
        console.error(response);
        this.loginAttempt.error = response;
        this.fireUpdate();
      });
  }

  logout() {
    if(!this.isLoggedIn()) throw Error("logout() should be called only if logged in");
    this.cookies.remove('userToken');
    delete this.user;
    this.fireUpdate();
  }

  // function to be called when both user and contest are loaded
  enterContest() {
    this.userTaskState = {};
    for(const task of this.getContest().getTasks()) {
      const state = new UserTaskState(this, task);
      this.userTaskState[task.name] = state;
    }
  }

  hasEnteredContest() {
    return this.userTaskState !== undefined;
  }

  getTaskState(taskName) {
    if(!this.hasEnteredContest()) throw new Error();
    return this.userTaskState[taskName];
  }
}
