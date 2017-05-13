import axios from 'axios';
import Submission from './Submission';
import SubmissionList from './SubmissionList';
import Cookies from 'universal-cookie';
import Observable from './Observable';

class Model extends Observable {
    constructor() {
      super();

      this.cookies = new Cookies();
      this.inputGenerationPromise = {};
    }

    loadContest() {
      delete this.contest;
      delete this.tasksByName;

      return axios.get('http://localhost:1234/contest')
        .then((response) => {
          this.contest = response.data;
          this.tasksByName = {};
          for(let task of this.contest.tasks) {
            this.tasksByName[task.name] = task;
          }

          this.fireUpdate();
        });
    }

    isContestLoaded() {
      return this.contest !== undefined;
    }

    loadUser(token) {
      return axios.get('http://localhost:1234/user/' + token);
    }

    isLoggedIn() {
      const userToken = this.cookies.get('userToken');
      return userToken !== undefined;
    }

    isUserLoaded() {
      return this.user !== undefined;
    }

    maybeLoadUser() {
      if(this.isLoggedIn()) {
        this.refreshUser();
      }
    }

    refreshUser() {
      if(!this.isLoggedIn()) throw Error("refreshUser can only be called after a successful login");
      const userToken = this.cookies.get('userToken');

      return this.loadUser(userToken)
        .then((response) => {
          this.user = response.data;
          this.fireUpdate();
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
          this.fireUpdate();
        })
        .catch((response) => {
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

    getCurrentInput(taskName) {
      const data = this.user.tasks[taskName].current_input;
      if(data === undefined) return;
      return data;
    }

    isGeneratingInput(taskName) {
      return this.inputGenerationPromise[taskName] !== undefined;
    }

    generateInput(taskName) {
      if(this.isGeneratingInput(taskName)) throw new Error("already generating input");

      const data = new FormData();

      data.append("token", this.user.token);
      data.append("task", taskName);

      this.fireUpdate();

      const endpoint = 'http://localhost:1234/generate_input';
      return this.inputGenerationPromise[taskName] = axios.post(endpoint, data).then((response) => {
        return this.refreshUser();
      }).then(() => {
        delete this.inputGenerationPromise[taskName];
        this.fireUpdate();
      }, (response) => {
        delete this.inputGenerationPromise[taskName];
        this.fireUpdate();
        return Promise.reject(response);
      });
    }

    hasCurrentInput(taskName) {
      return this.user.tasks[taskName].current_input !== null;
    }

    createSubmission(input) {
      return new Submission(input, this);
    }

    getSubmissionList(taskName) {
      return new SubmissionList(taskName, this);
    }
}

export default Model;
