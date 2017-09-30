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

  updateStatus() {
    this.loadingStatus = this.loadStatus(this.adminToken())
        .then(response => {
          this.status = response.data;
          delete this.loadingStatus;
          delete this.error;
          this.fireUpdate();
          this.updateLogs();
        })
        .catch(response => {
          console.error(response);
          this.fireUpdate();
        });
  }

  startContest() {
    if (!this.isLoggedIn()) throw Error("You have to be logged in to start the contest");
    return client.adminApi(this.adminToken(), "/start")
        .then(response => {
          this.updateStatus();
        }).catch(response => {
          console.error(response);
          this.error = response.response.data.message;
          this.fireUpdate();
        });
  }

  extractContest(filename, password) {
    if (!this.isLoggedIn()) throw Error("You have to be logged in to extract the contest");
    return client.adminApi(this.adminToken(), "/extract", {filename: filename, password: password})
        .then(response => {
          this.updateStatus();
        }).catch(response => {
          console.error(response);
          this.error = response.response.data.message;
          this.fireUpdate();
          return Promise.reject(response);
        });
  }

  setExtraTime(token) {
    if (!this.isLoggedIn()) throw Error("You have to be logged in to set the extra time");
    const options = { extra_time: this.status.extra_time };
    if (token) options.token = token;
    return client.adminApi(this.adminToken(), "/set_extra_time", options)
        .then(response => {
          this.updateStatus();
        }).catch(response => {
          console.error(response);
          this.error = response.response.data.message;
          this.fireUpdate();
        });
  }
}
