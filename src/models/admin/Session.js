import client from '../../TerryClient';
import Cookies from 'universal-cookie';
import Observable from '../Observable';


export default class Session extends Observable {
  static cookieName = "adminToken";

  constructor() {
    super();

    this.cookies = new Cookies();
  }

  adminToken() {
    return this.cookies.get(Session.cookieName);
  }

  isLoggedIn() {
    return this.adminToken() !== undefined;
  }

  isLoading() {
    return this.loadingStatus !== undefined;
  }

  loadStatus(adminToken) {
    return client.adminApi(adminToken, "/status");
  }

  tryLogin() {
    if (this.isLoggedIn()) {
      this.attemptLogin(this.adminToken());
    }
  }

  attemptLogin(token) {
    delete this.status;
    this.fireUpdate();

    return this.loadingStatus = this.loadStatus(token)
        .then((response) => {
          this.status = response.data;
          this.cookies.set(Session.cookieName, token);
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
    this.cookies.remove(Session.cookieName);
    delete this.status;
    this.fireUpdate();
  }
}
