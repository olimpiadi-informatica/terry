import axios from "axios";

class Client {
  apiBaseURI = process.env.REACT_APP_API_BASE_URI || "/api/";

  filesBaseURI = process.env.REACT_APP_FILES_BASE_URI || "/files/";

  statementsBaseURI = process.env.REACT_APP_STATEMENTS_BASE_URI || "/files/";

  api = axios.create({ baseURL: this.apiBaseURI });

  files = axios.create({ baseURL: this.filesBaseURI });

  statements = axios.create({ baseURL: this.statementsBaseURI });

  adminApi(token: string, path: string, options: any = {}) {
    options.admin_token = token;
    const data = new FormData();
    for (const key in options) data.append(key, options[key]);
    return this.api.post(`/admin/${path}`, data);
  }
}

export default new Client();
