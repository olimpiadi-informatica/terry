import axios from 'axios';
import wait from './utils';

class Submission {
    constructor(input, model) {
      this.input = input;
      this.model = model;
    }

    setSource(file) {
      this.sourceFile = file;
      this.model.view.forceUpdate();
    }

    hasSource() {
      return this.sourceFile !== undefined;
    }

    resetSource() {
      delete this.sourceFile;
    }

    getSourceFile() {
      return this.sourceFile;
    }

    setOutput(file) {
      this.outputFile = file;
      this.model.view.forceUpdate();
    }

    hasOutput() {
      return this.outputFile !== undefined;
    }

    resetOutput() {
      delete this.outputFile;
    }

    getOutputFile() {
      return this.outputFile;
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
