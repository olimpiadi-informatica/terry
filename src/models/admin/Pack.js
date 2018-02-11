import client from '../../TerryClient';
import Observable from '../Observable';


export default class Pack extends Observable {
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
          console.error(response);
          this.error = response;
          delete this.data;
          delete this.loading;
          this.fireUpdate();
        });
  }

  upload(file) {
    const data = new FormData();

    data.append("file", file);

    return client.api.post("/admin/upload_pack", data)
    .then(response => {
      return this.update();
    }).catch(response => {
      console.error(response);
      this.error = response.response.data.message;
      this.fireUpdate();
    })
    ;
  }

}
