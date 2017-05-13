import client from './TerryClient';
import Source from './Source';
import Output from './Output';
import Observable from './Observable';

class Submission extends Observable {
    constructor(input, model) {
      super()

      this.input = input;
      this.model = model;
    }

    setSource(file) {
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

      data.append("input", this.input.id);
      data.append("source", this.getSource().data.id);
      data.append("output", this.getOutput().data.id);

      this.fireUpdate();

      return this.submitPromise = client.post("/submit", data).then((response) => {
        this.data = response.data;
        delete this.submitPromise;
        this.fireUpdate();
      }, (response) => {
        delete this.submitPromise;
        this.fireUpdate();
        return Promise.reject(response);
      });
    }

    isSubmitted() {
      return this.data !== undefined;
    }
}

export default Submission;
