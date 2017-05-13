import client from './TerryClient';
import Submission from './Submission';
import SubmissionList from './SubmissionList';
import Observable from './Observable';

class UserTaskState extends Observable {
    constructor(model, task) {
      super();

      this.model = model;
      this.task = task;

      this.submissionList = new SubmissionList(this);
    }

    getUser() {
      return this.model.user;
    }

    doGetCurrentInput() {
      return this.getUser().tasks[this.task.name].current_input;
    }

    hasCurrentInput() {
      return this.doGetCurrentInput() !== null;
    }

    getCurrentInput() {
      if(!this.hasCurrentInput()) throw new Error();
      return this.doGetCurrentInput();
    }

    isGeneratingInput() {
      return this.inputGenerationPromise !== undefined;
    }

    generateInput() {
      if(this.isGeneratingInput()) throw new Error("already generating input");

      const data = new FormData();

      data.append("token", this.getUser().token);
      data.append("task", this.task.name);

      this.fireUpdate();

      return this.inputGenerationPromise = client.post('/generate_input', data).then((response) => {
        return this.model.refreshUser();
      }).then(() => {
        delete this.inputGenerationPromise;
        this.fireUpdate();
      }, (response) => {
        delete this.inputGenerationPromise;
        this.fireUpdate();
        return Promise.reject(response);
      });
    }

    hasSubmission() {
      return this.submission !== undefined;
    }

    canSubmit(inputId) {
      return this.hasCurrentInput() && this.getCurrentInput().id === inputId;
    }

    createSubmission() {
      if(this.hasSubmission()) throw new Error("already has a current submission");
      if(!this.hasCurrentInput()) throw new Error("does not have an input, yet");

      const input = this.getCurrentInput();
      return new Submission(input, this);
    }

    getSubmissionList() {
      return this.submissionList;
    }

}

export default UserTaskState;
