import axios from 'axios';
import Submission from './Submission';
import SubmissionList from './SubmissionList';
import Cookies from 'universal-cookie';

class Model {
    constructor(props) {
      this.view = props.view;
      this.cookies = new Cookies();
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

          this.view.forceUpdate();
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
          this.view.forceUpdate();
        });
    }

    attemptLogin(token) {
      delete this.user;
      this.loginAttempt = {};

      this.view.forceUpdate();

      return this.loadUser(token)
        .then((response) => {
          this.user = response.data;
          this.cookies.set('userToken', token);
          this.view.forceUpdate();
        })
        .catch((response) => {
          console.log(response);
          this.loginAttempt.error = response;
          this.view.forceUpdate();
        });
    }

    logout() {
      if(!this.isLoggedIn()) throw Error("logout() should be called only if logged in");
      this.cookies.remove('userToken');
      delete this.user;
      this.view.forceUpdate();
    }

    getCurrentInput(taskName) {
      const data = this.user.tasks[taskName].current_input;
      if(data === undefined) return;
      return data;
    }

    generateInput(taskName) {
      const data = new FormData();

      data.append("token", this.user.token);
      data.append("task", taskName);

      return axios.post('http://localhost:1234/generate_input', data).then((response) => {
        return this.refreshUser();
      });
    }

    createSubmission(input) {
      return new Submission(input, this);
    }

    getSubmissionList(taskName) {
      return new SubmissionList(taskName, this);
    }
}

export default Model;
