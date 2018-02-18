import client from './TerryClient';
import Submission from './Submission';
import Observable from './Observable';
import ObservablePromise from './ObservablePromise';

export default class UserTaskState extends Observable {
  constructor(model, user, task) {
    super();

    this.model = model;
    this.user = user;
    this.task = task;

    this.refreshSubmissionList();
  }

  doGetCurrentInput() {
    return this.user.data.tasks[this.task.name].current_input;
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

    data.append("token", this.user.data.token);
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
    return client.api.get("/user/" + this.user.data.token + "/submissions/" + this.task.name).then((response) => {
      return response.data;
    });
  }

  refreshSubmissionList() {
    this.submissionListPromise = new ObservablePromise(this.loadSubmissionList());
    this.fireUpdate();
  }

}
