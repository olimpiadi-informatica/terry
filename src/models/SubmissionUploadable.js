import Observable from './Observable';

export default class SubmissionUploadable extends Observable {
  constructor(file, submission) {
    super();

    this.file = file;
    this.submission = submission;

    this.model = submission.model;
  }

  upload() {
    this.fireUpdate();
    this.uploadPromise = this.doUpload().then((response) => {
      this.data = response.data;
      this.fireUpdate();
      delete this.uploadPromise;
    }).catch((error) => {
      this.error = error;
      this.fireUpdate();
      delete this.uploadPromise;
      return Promise.reject(error);
    });
  }

  doUpload() {
    throw Error("not implemented");
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
