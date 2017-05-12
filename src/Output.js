import wait from './utils';
import axios from 'axios';

class Output {
    constructor(file, submission) {
      this.file = file;
      this.submission = submission;

      this.model = submission.model;
    }

    upload() {
      const data = new FormData();

      data.append("input", this.submission.input.id);
      data.append("file", this.file)

      return axios.post("http://localhost:1234/upload_output", data).then((response) => {
        this.data = response.data;
        this.model.view.forceUpdate();
      });
    }

    isUploaded() {
      return this.data !== undefined;
    }

    isValidForSubmit() {
      return this.isUploaded() && this.data.validation_result.valid_for_submit
    }

}

export default Output;
