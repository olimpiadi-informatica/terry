import axios from 'axios';
import wait from './utils';

class Submission {
    constructor(input, model) {
      this.input = input;
      this.model = model;
    }

    setSource(file) {
      this.sourceFile = file;
      console.log("source set:", file);
    }

    resetSource() {
      delete this.sourceFile;
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
