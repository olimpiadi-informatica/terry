import axios from 'axios';
import wait from './utils';

class Output {
    constructor(file, submission) {
      this.file = file;
      this.submission = submission;

      this.model = submission.model;
    }

    process() {
      return Promise.resolve()
        .then(() => this.create())
        .then(() => this.upload())
        .then(() => this.validate())
    }

    create() {
      // TODO: dummy
      return wait(500).then(() => {
        this.metadata = {
          id: "o1",
        },
        this.model.view.forceUpdate();
      });
    }

    isCreated() {
      return this.metadata !== undefined;
    }

    upload() {
      // TODO: dummy
      return wait(500).then(() => {
        this.uploadResult = {};
        this.model.view.forceUpdate();
      });
    }

    isUploaded() {
      return this.uploadResult !== undefined;
    }

    validate() {
      // TODO: dummy
      return wait(500).then(() => {
        this.metadata = {
          id: "o1",
          validation_result: {
            warnings: [
              {
                code: "partial_parse",
                severity: "warning",
                message: "Attention: the submitted file could not be fully processed.",
              },
            ],
            cases: [
              {
                id: "1",
                status: "okay",
                message: "Case loaded.",
              },
              {
                id: "5",
                status: "okay",
                message: "Case loaded.",
              },
              {
                id: "4",
                status: "okay",
                message: "Case loaded.",
              },
            ]
          },
        };
        this.model.view.forceUpdate();
      });
    }

    isValidated() {
      return this.isCreated() && this.metadata.validation_result !== undefined;
    }

}

export default Output;
