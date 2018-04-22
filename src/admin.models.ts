import client from './TerryClient';
import Cookies from 'universal-cookie';
import Observable from './Observable';
import { DateTime } from "luxon";
import ObservablePromise from './ObservablePromise';
import { notifyError } from './utils';

type AdminStatusData = {
  extra_time: number
  token?: string
}

class AdminStatus {
  data: AdminStatusData;

  constructor(data: AdminStatusData) {
    this.data = data;
  }

  extraTimeMinutes() {
    return Math.round(this.data.extra_time / 60)
  }
}

export class AdminSession extends Observable {
  usersPromise?: ObservablePromise;
  statusPromise: any;
  timeDelta: any;
  cookies: any;

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
    if (this.isLoggedIn()) {
      this.updateStatus();
    }
  }

  serverTime() {
    return DateTime.local().minus(this.timeDelta || {});
  }

  setServerTime(time: DateTime) {
    this.timeDelta = DateTime.local().diff(time);
  }

  updateStatus() {
    this.fireUpdate();
    this.statusPromise = new ObservablePromise(
      client.adminApi(this.adminToken(), "/status")
        .then((response: any) => {
          this.setServerTime(DateTime.fromHTTP(response.headers['date']));
          return new AdminStatus(response.data);
        })
        .catch((response: any) => {
          notifyError(response)
          this.logout();
          return Promise.reject(response);
        })
    );
    this.statusPromise.pushObserver(this);

    return this.usersPromise = new ObservablePromise(
      this.statusPromise.delegate.then(() => client.adminApi(this.adminToken(), "/user_list"))
    );
  }

  login(token: string) {
    if (this.isLoggedIn()) throw Error();
    this.cookies.set(AdminSession.cookieName, token);
    return this.updateStatus();
  }

  logout() {
    if (!this.isLoggedIn()) throw Error("logout() should be called only if logged in");
    this.cookies.remove(AdminSession.cookieName);
    delete this.statusPromise;
    this.fireUpdate();
  }

  startContest() {
    return client.adminApi(this.adminToken(), "/start")
      .then(() => {
        this.updateStatus()
      })
      .catch((response: any) => {
        notifyError(response)
        this.fireUpdate();
      });
  }

  setExtraTime(extraTime: number, token?: string) {
    if (!this.isLoggedIn()) throw Error();
    const options: AdminStatusData = {
      extra_time: extraTime,
    };
    if (token) options.token = token;
    return client.adminApi(this.adminToken(), "/set_extra_time", options)
      .then(() => this.updateStatus())
      .catch((response: any) => {
        notifyError(response)
        this.fireUpdate();
        return Promise.reject(response);
      })
  }

  loadLogs(options: any) {
    return new ObservablePromise(client.adminApi(this.adminToken(), "/log", options).then((response: any) => response.data));
  }

}
