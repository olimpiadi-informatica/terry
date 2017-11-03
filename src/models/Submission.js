import client from '../TerryClient';
import Source from './Source';
import Output from './Output';
import Observable from './Observable';

export default class Submission extends Observable {
  constructor(input, taskState) {
    super();

    this.input = input;
    this.taskState = taskState;

    this.model = taskState.model;
  }

  setSource(file) {
    if(this.hasSource()) throw Error("setSource called when hasSource is true")

    this.source = new Source(file, this);
    this.source.upload();

    this.source.pushObserver(this);

    this.fireUpdate();
  }

  getSource() {
    return this.source;
  }

  hasSource() {
    return this.source !== undefined;
  }

  resetSource() {
    this.source.popObserver(this);
    delete this.source;
    this.fireUpdate();
  }

  setOutput(file) {
    if(this.hasOutput()) throw Error("setOutput called when hasOutput is true")

    this.output = new Output(file, this);
    this.output.upload();

    this.output.pushObserver(this);

    this.fireUpdate();
  }

  getOutput() {
    return this.output;
  }

  hasOutput() {
    return this.output !== undefined;
  }

  resetOutput() {
    this.output.popObserver(this);
    delete this.output;
    this.fireUpdate();
  }

  canSubmit() {
    return this.hasOutput() && this.getOutput().isValidForSubmit()
      && this.hasSource() && this.getSource().isValidForSubmit();
  }

  isSubmitting() {
    return this.submitPromise !== undefined;
  }

  submit() {
    if(!this.canSubmit()) throw new Error("called submit() but canSubmit() returns false");
    if(this.isSubmitting()) throw new Error("called submit() while already submitting");
    if(this.isSubmitted()) throw new Error("called submit() when already submitted");

    const data = new FormData();

    data.append("input_id", this.input.id);
    data.append("source_id", this.getSource().data.id);
    data.append("output_id", this.getOutput().data.id);

    this.fireUpdate();

    return this.submitPromise = client.api.post("/submit", data).then((response) => {
      this.data = response.data;
      return this.model.refreshUser();
    }).then(() => {
      delete this.submitPromise;
      this.fireUpdate();
    }, (error) => {
      delete this.submitPromise;
      this.fireUpdate();
      return Promise.reject(error);
    });
  }

  isSubmitted() {
    return this.data !== undefined;
  }
}
