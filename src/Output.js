import wait from './utils';
import axios from 'axios';
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
          return axios.post("http://localhost:1234/upload_output", data).then((response) => {
            id = response.data.id;
          });
        })
        .then(() => {
          return axios.get("http://localhost:1234/output/" + id).then((response) => {
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
