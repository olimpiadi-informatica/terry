import axios from 'axios';

class Model {
    constructor(props) {
      this.view = props.view;
    }

    loadContest() {
      delete this.contest;

      axios.get('http://localhost:3001/contest')
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
}

export default Model;
