import axios from 'axios';
import 'promise.prototype.finally';

class Model {
    constructor(props) {
      this.view = props.view;
    }

    loadContest() {
      delete this.contest;
      delete this.tasksByName;

      return axios.get('http://localhost:3001/contest')
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

    isLoggedIn() {
      return this.user !== undefined;
    }

    attemptLogin(token) {
      delete this.user;
      this.loginAttempt = {};

      this.view.forceUpdate();

      return axios.get('http://localhost:3001/user/' + token)
        .then((response) => {
          this.user = response.data;
          this.view.forceUpdate();
        })
        .catch((response) => {
          console.log(response);
          this.loginAttempt.error = response;
          this.view.forceUpdate();
        });
    }
}

export default Model;
