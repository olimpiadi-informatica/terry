import client from './TerryClient';
import Cookies from 'universal-cookie';
import Observable from './Observable';
import UserTaskState from './UserTaskState';
import { DateTime, Duration } from 'luxon';
import Task from './Task';
import SubmissionResult from './SubmissionResult';
import UserState from './UserState';
import ObservablePromise from './ObservablePromise';

export default class Model extends Observable {
  static cookieName = "userToken";

  constructor() {
    super();

    this.cookies = new Cookies();
    this.inputGenerationPromise = {};
    this.submissions = {};
  }

  onAppStart() {
    if(this.isLoggedIn()) {
      this.refreshUser();
    }
  }

  loadUser(token) {
    return ;
  }

  userToken() {
    return this.cookies.get(Model.cookieName);
  }

  isLoggedIn() {
    return this.userToken() !== undefined;
  }

  refreshUser() {
    if(!this.isLoggedIn()) throw Error("refreshUser can only be called after a successful login");
    const userToken = this.cookies.get(Model.cookieName);

    this.fireUpdate();
    return this.userStatePromise = new ObservablePromise(
      client.api.get('/user/' + this.userToken())
        .then((response) => {
          this.timeDelta = DateTime.local().diff(DateTime.fromHTTP(response.headers['date']));
          this.fireUpdate();
          return new UserState(this, response.data);
        })
        .catch(error => {
          console.error("Forced logout because: ", error);
          this.logout();
          return Promise.reject(error);
        })
    );
  }

  attemptLogin(token) {
    this.loginAttempt = {};

    this.fireUpdate();

    this.cookies.set(Model.cookieName, token);
    
    return this.refreshUser()
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
    delete this.userStatePromise;
    // TODO redirect to /
    this.fireUpdate();
  }

  getSubmission(id) {
    if (this.submissions[id] !== undefined) return this.submissions[id];

    return this.submissions[id] = new SubmissionResult(this, id);
  }

}
