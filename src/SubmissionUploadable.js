import Observable from './Observable';
import ObservablePromise from './ObservablePromise';

export default class SubmissionUploadable {
  constructor(file, submission) {
    this.file = file;
    this.submission = submission;

    this.uploadPromise = new ObservablePromise(this.doUpload());
  }

  doUpload() {
    throw Error("not implemented");
  }

  isValidForSubmit() {
    return this.uploadPromise.isFulfilled();
  }
}
