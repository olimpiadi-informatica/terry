import axios from 'axios';
import Source from './Source';
import Output from './Output';

class Submission {
    constructor(input, model) {
      this.input = input;
      this.model = model;
    }

    setSource(file) {
      this.source = new Source(file, this);
      this.source.upload();
      this.model.view.forceUpdate();
    }

    getSource() {
      return this.source;
    }

    hasSource() {
      return this.source !== undefined;
    }

    resetSource() {
      delete this.source;
    }

    setOutput(file) {
      this.output = new Output(file, this);
      this.output.upload();
      this.model.view.forceUpdate();
    }

    getOutput() {
      return this.output;
    }

    hasOutput() {
      return this.output !== undefined;
    }

    resetOutput() {
      delete this.output;
    }

    canSubmit() {
      return this.hasOutput() && this.getOutput().isValidForSubmit()
        && this.hasSource() && this.getSource().isValidForSubmit();
    }

    submit() {
      if(!this.canSubmit()) throw new Error("called submit() but canSubmit() returns false");

      const data = new FormData();

      data.append("input", this.input.id);
      data.append("source", this.getSource().data.id);
      data.append("output", this.getOutput().data.id);

      return axios.post("http://localhost:1234/submit", data).then((response) => {
        this.data = response.data;
        this.model.view.forceUpdate();
      });
    }

    isSubmitted() {
      return this.data !== undefined;
    }
}

export default Submission;
