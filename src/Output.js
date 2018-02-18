import client from './TerryClient';
import SubmissionUploadable from './SubmissionUploadable';

export default class Output extends SubmissionUploadable {
  doUpload() {
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
        return client.api.get("/output/" + id);
      });
  }
}
