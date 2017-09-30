import client from '../../TerryClient';
import Cookies from 'universal-cookie';
import Observable from '../Observable';

export default class Session extends Observable {
  constructor() {
    super();

    this.cookies = new Cookies();
  }

  isLoggedIn() {
    const adminToken = this.cookies.get('adminToken');
    return adminToken !== undefined;
  }

  isLoading() {
    return this.loadingStatus !== undefined;
  }

  loadStatus(adminToken) {
    const data = new FormData();
    data.append("admin_token", adminToken);
    return client.api.post("/admin/status", data);
  }

  tryLogin() {
    if (this.isLoggedIn()) {
      const adminToken = this.cookies.get('adminToken');
      this.attemptLogin(adminToken);
    }
  }

  attemptLogin(token) {
    delete this.status;
    this.fireUpdate();

    return this.loadingStatus = this.loadStatus(token)
        .then((response) => {
          this.status = response.data;
          this.cookies.set('adminToken', token);
          delete this.loadingStatus;
          delete this.error;
          this.fireUpdate();
        })
        .catch((response) => {
          console.error(response);
          this.error = response;
          delete this.loadingStatus;
          if (this.isLoggedIn()) this.logout();
          else this.fireUpdate();
        });
  }

  logout() {
    if(!this.isLoggedIn()) throw Error("logout() should be called only if logged in");
    this.cookies.remove('adminToken');
    delete this.status;
    this.fireUpdate();
  }
}
