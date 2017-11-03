import client from '../TerryClient';
import Observable from './Observable';

export default class SubmissionUploadable extends Observable {
  constructor(file, submission) {
    super();

    this.file = file;
    this.submission = submission;

    this.model = submission.model;
  }

  upload() {
    const data = new FormData();

    data.append("input_id", this.submission.input.id);
    data.append("file", this.file);

    let id;

    return Promise.resolve()
      .then(() => {
        return client.api.post("/upload_output", data).then((response) => {
          id = response.data.id;
          delete this.error;
        }).catch(error => {
          this.error = error.response.data.message;
          this.fireUpdate();
          return Promise.reject();
        });
      })
      .then(() => {
        return client.api.get("/output/" + id).then((response) => {
          this.data = response.data;
          this.fireUpdate();
        });
      });
  }

  doUpload() {
    throw Error("not implemented")
  }

  isUploading() {
    return this.uploadPromise !== undefined;
  }

  isUploaded() {
    return this.data !== undefined;
  }

  hasErrored() {
    return this.error !== undefined;
  }

  isValidForSubmit() {
    return this.isUploaded()
  }
}
