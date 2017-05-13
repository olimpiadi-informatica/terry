import client from './TerryClient';
import Observable from './Observable';

class Source extends Observable {
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

      // TODO: isUpdating()...
      return client.post("/upload_source", data).then((response) => {
        this.data = response.data;
        this.fireUpdate();
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
