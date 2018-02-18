import client from './TerryClient';
import Cookies from 'universal-cookie';
import Observable from './Observable';
import { DateTime } from "luxon";
import ObservablePromise from './ObservablePromise';

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

  onAppStart() {
    if(this.isLoggedIn()) {
      this.updateStatus();
    }
  }

  isLoaded() {
    return this.status !== undefined;
  }

  updateStatus() {
    this.fireUpdate();

    this.loadingStatus = client.adminApi(this.adminToken(), "/status")
      .then((response) => {
        this.status = response.data;
        this.timeDelta = DateTime.local().diff(DateTime.fromHTTP(response.headers['date']));
        delete this.loadingStatus;
        delete this.error;
        this.fireUpdate();
      })
      .catch((response) => {
        console.error(response);
        this.error = response;
        delete this.loadingStatus;
        if (this.isLoggedIn()) this.logout();
        this.fireUpdate();
        return Promise.reject(response);
      });

    return this.usersPromise = new ObservablePromise(
      this.loadingStatus.then(() => client.adminApi(this.adminToken(), "/user_list"))
    );
  }

  login(token) {
    if(this.isLoggedIn()) throw Error();
    this.cookies.set(Session.cookieName, token);
    this.fireUpdate();
    return this.updateStatus();
  }

  logout() {
    if(!this.isLoggedIn()) throw Error("logout() should be called only if logged in");
    this.cookies.remove(Session.cookieName);
    delete this.status;
    this.fireUpdate();
  }

  startContest() {
    if (!this.isLoaded()) throw Error();
    return client.adminApi(this.adminToken(), "/start")
      .then(response => this.updateStatus())
      .catch(response => {
        console.error(response);
        this.error = response.response.data.message;
        this.fireUpdate();
      });
  }

  setExtraTime(extraTime, token) {
    if (!this.isLoaded()) throw Error();
    const options = { extra_time: extraTime };
    if (token) options.token = token;
    return client.adminApi(this.adminToken(), "/set_extra_time", options)
      .then(response => this.updateStatus())
      .catch(response => {
        console.error(response);
        this.error = response.response.data.message;
        this.fireUpdate();
        return Promise.reject(response);
      });
  }

  extraTimeMinutes() {
    if (!this.isLoaded()) throw Error();
    return Math.round(this.status.extra_time / 60)
  }

}
