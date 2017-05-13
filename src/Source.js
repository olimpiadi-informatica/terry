import axios from 'axios';

class Source {
    constructor(file, submission) {
      this.file = file;
      this.submission = submission;

      this.model = submission.model;
    }

    upload() {
      const data = new FormData();

      data.append("input", this.submission.input.id);
      data.append("file", this.file)

      return axios.post("http://localhost:1234/upload_source", data).then((response) => {
        this.data = response.data;
        this.model.view.forceUpdate();
      });
    }

    isUploaded() {
      return this.data !== undefined;
    }

    isValidForSubmit() {
      return this.isUploaded()
    }

}

export default Source;
