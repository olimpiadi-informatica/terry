import wait from './utils';
import client from './TerryClient';
import Observable from './Observable';

class Output extends Observable {
    constructor(file, submission) {
      super();

      this.file = file;
      this.submission = submission;

      this.model = submission.model;
    }

    upload() {
      const data = new FormData();

      data.append("input", this.submission.input.id);
      data.append("file", this.file)

      let id;

      return Promise.resolve()
        .then(() => {
          return client.api.post("/upload_output", data).then((response) => {
            id = response.data.id;
          });
        })
        .then(() => {
          return client.api.get("/output/" + id).then((response) => {
            this.data = response.data;
            this.fireUpdate();
          });
        });
    }

    isUploaded() {
      return this.data !== undefined;
    }

    isValidForSubmit() {
      // TODO: return this.isUploaded() && this.data.validation_result.valid_for_submit;
      return this.isUploaded();
    }

}

export default Output;
