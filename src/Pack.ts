import client from './TerryClient';
import Observable from './Observable';
import { notifyError } from './utils';


export default class Pack extends Observable {
  loading?: Promise<any>;
  error: any;
  data: any;

  onAppStart() {
    this.update();
  }

  isLoaded() {
    return this.data !== undefined;
  }

  isLoading() {
    return this.loading !== undefined;
  }

  update() {
    this.fireUpdate();
    return this.loading = client.api("/admin/pack_status")
      .then((response) => {
        this.data = response.data;
        delete this.error;
        delete this.loading;
        this.fireUpdate();
      })
      .catch((response) => {
        notifyError(response)
        delete this.data;
        delete this.loading;
        this.fireUpdate();
      });
  }

  upload(file: any) {
    const data = new FormData();

    data.append("file", file);

    return client.api.post("/admin/upload_pack", data)
      .then(() => {
        return this.update();
      }).catch(response => {
        notifyError(response)
        this.fireUpdate();
      });
  }

}
