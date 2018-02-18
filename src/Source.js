import client from './TerryClient';
import SubmissionUploadable from './SubmissionUploadable';

export default class Source extends SubmissionUploadable {
  doUpload() {
    const data = new FormData();

    data.append("input_id", this.submission.input.id);
    data.append("file", this.file);

    return client.api.post("/upload_source", data)
  }

  isValidForSubmit() {
    return this.isUploaded()
  }
}
