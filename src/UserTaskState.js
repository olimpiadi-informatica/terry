import client from './TerryClient';
import Submission from './Submission';
import Observable from './Observable';

export default class UserTaskState extends Observable {
  constructor(model, task) {
    super();

    this.model = model;
    this.task = task;

    this.refreshSubmissionList();
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

    return this.inputGenerationPromise = client.api.post('/generate_input', data).then((response) => {
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

  canSubmit(inputId) {
    return this.hasCurrentInput() && this.getCurrentInput().id === inputId;
  }

  createSubmission(inputId) {
    if(!this.canSubmit(inputId)) throw new Error();

    const input = this.getCurrentInput();
    return new Submission(input, this);
  }

  loadSubmissionList() {
    return client.api.get("/user/" + this.getUser().token + "/submissions/" + this.task.name).then((response) => {
      return response.data;
    });
  }

  refreshSubmissionList() {
    this.submissionListPromise = this.loadSubmissionList();
  }

}
