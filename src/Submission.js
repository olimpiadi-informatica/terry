import client from './TerryClient';
import Source from './Source';
import Output from './Output';
import Observable from './Observable';
import ObservablePromise from './ObservablePromise';
import SubmissionResult from './SubmissionResult';

export default class Submission extends Observable {
  constructor(input, taskState) {
    super();

    this.input = input;
    this.taskState = taskState;

    this.model = taskState.model;
    this.submitPromise = null;
  }

  setSource(file) {
    if(this.isSubmitted()) throw Error();
    if(this.hasSource()) throw Error("setSource called when hasSource is true");

    this.source = new Source(file, this);
    this.source.uploadPromise.pushObserver(this);
    this.fireUpdate();
  }

  getSource() {
    return this.source;
  }

  hasSource() {
    return this.source !== undefined;
  }

  resetSource() {
    if(this.isSubmitted()) throw Error();
    this.source.uploadPromise.popObserver(this);
    delete this.source;
    this.fireUpdate();
  }

  setOutput(file) {
    if(this.isSubmitted()) throw Error();
    if(this.hasOutput()) throw Error("setOutput called when hasOutput is true")

    this.output = new Output(file, this);
    this.output.uploadPromise.pushObserver(this);
    this.fireUpdate();
  }

  getOutput() {
    return this.output;
  }

  hasOutput() {
    return this.output !== undefined;
  }

  resetOutput() {
    if(this.isSubmitted()) throw Error();
    this.output.uploadPromise.popObserver(this);
    delete this.output;
    this.fireUpdate();
  }

  canSubmit() {
    return !this.isSubmitted() && this.hasOutput() && this.getOutput().isValidForSubmit()
      && this.hasSource() && this.getSource().isValidForSubmit();
  }

  isSubmitted() {
    return this.submitPromise !== null;
  }

  submit() {
    if(!this.canSubmit()) throw new Error("called submit() but canSubmit() returns false");

    const data = new FormData();

    data.append("input_id", this.input.id);
    data.append("source_id", this.getSource().uploadPromise.value.data.id);
    data.append("output_id", this.getOutput().uploadPromise.value.data.id);

    this.fireUpdate();

    return this.submitPromise = new ObservablePromise(
      client.api.post("/submit", data)
      .then((response) => new SubmissionResult(response.data))
      .then((result) => {
        this.model.refreshUser();
        this.taskState.refreshSubmissionList();
        return result;
      })
    );
  }
}
