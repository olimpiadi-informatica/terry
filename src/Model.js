import axios from 'axios';
import 'promise.prototype.finally';
import wait from './utils';
import Submission from './Submission';

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

    loadUser(token) {
      return axios.get('http://localhost:3001/user/' + token);
    }

    refreshUser() {
      return this.loadUser(this.userToken)
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
          this.userToken = token;
          this.view.forceUpdate();
        })
        .catch((response) => {
          console.log(response);
          this.loginAttempt.error = response;
          this.view.forceUpdate();
        });
    }

    getCurrentInput(taskName) {
      const data = this.user.tasks[taskName].current_input;
      if(data === undefined) return;
      return Object.assign({
        task: taskName
      }, data);
    }

    generateInput(taskName) {
      // TODO: dummy
      return wait(500).then(() => {
        return this.refreshUser();
      }).then(() => {
        this.user.tasks[taskName].current_input = {
          id: "i2",
        };
        this.view.forceUpdate();
      })

      return axios.post('http://localhost:3001/generate_input', {
        user : this.user.id,
        task : taskName
      }).then((response) => {
        return this.refreshUser();
      });
    }

    createSubmission(input) {
      return new Submission(input, this);
    }
}

export default Model;
