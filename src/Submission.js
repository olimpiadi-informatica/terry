import axios from 'axios';
import wait from './utils';
import Source from './Source';
import Output from './Output';

class Submission {
    constructor(input, model) {
      this.input = input;
      this.model = model;
    }

    setSource(file) {
      this.source = new Source(file, this);
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

    submit() {
      // TODO: dummy
      wait(500).then(() => {
        this.submission = {
          id: "sub1",
          input: this.input,
          source: {
            id: "src1",
          },
          output : {
            id: "o1",
          },
        };

        const userTask = this.model.user.tasks[this.input.task]
        userTask.previous_attempts += 1;
        delete userTask.current_input;

        this.model.view.forceUpdate();
      })
    }

    isSubmitted() {
      return this.submission !== undefined;
    }
}

export default Submission;
