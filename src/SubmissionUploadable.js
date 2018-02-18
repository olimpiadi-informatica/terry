import Observable from './Observable';
import ObservablePromise from './ObservablePromise';

export default class SubmissionUploadable extends Observable {
  constructor(file, submission) {
    super();

    this.file = file;
    this.submission = submission;

    this.uploadPromise = new ObservablePromise(this.doUpload());
    this.uploadPromise.pushObserver(this);
  }

  doUpload() {
    throw Error("not implemented");
  }

  isValidForSubmit() {
    return this.uploadPromise.isFulfilled();
  }
}
