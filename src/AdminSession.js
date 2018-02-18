import client from './TerryClient';
import Cookies from 'universal-cookie';
import Observable from './Observable';
import { DateTime } from "luxon";
import ObservablePromise from './ObservablePromise';
import AdminStatus from './AdminStatus';

export default class AdminSession extends Observable {
  static cookieName = "adminToken";

  constructor() {
    super();

    this.cookies = new Cookies();
  }

  adminToken() {
    return this.cookies.get(AdminSession.cookieName);
  }

  isLoggedIn() {
    return this.adminToken() !== undefined;
  }

  onAppStart() {
    if(this.isLoggedIn()) {
      this.updateStatus();
    }
  }

  updateStatus() {
    this.fireUpdate();
    this.statusPromise = new ObservablePromise(
      client.adminApi(this.adminToken(), "/status")
      .then((response) => {
        this.timeDelta = DateTime.local().diff(DateTime.fromHTTP(response.headers['date']));
        return new AdminStatus(response.data);
      })
      .catch((response) => {
        this.logout();
        return Promise.reject(response);
      })
    );

    return this.usersPromise = new ObservablePromise(
      this.statusPromise.then(() => client.adminApi(this.adminToken(), "/user_list"))
    );
  }

  login(token) {
    if(this.isLoggedIn()) throw Error();
    this.cookies.set(AdminSession.cookieName, token);
    return this.updateStatus();
  }

  logout() {
    if(!this.isLoggedIn()) throw Error("logout() should be called only if logged in");
    this.cookies.remove(AdminSession.cookieName);
    delete this.statusPromise;
    this.fireUpdate();
  }

  startContest() {
    return client.adminApi(this.adminToken(), "/start")
      .then(response => this.updateStatus())
      .catch(response => {
        console.error(response);
        this.error = response.response.data.message;
        this.fireUpdate();
      });
  }

  setExtraTime(extraTime, token) {
    if (!this.isLoggedIn()) throw Error();
    const options = {
      extra_time: extraTime,
    };
    if (token) options.token = token;
    return client.adminApi(this.adminToken(), "/set_extra_time", options)
      .then(response => this.updateStatus())
      .catch(response => {
        console.error(response);
        this.error = response.response.data.message;
        this.fireUpdate();
        return Promise.reject(response);
      })
    ;
  }

  loadLogs(options) {
    return new ObservablePromise(client.adminApi(this.adminToken(), "/log", options).then((response) => response.data));
  }

}
