import axios from "axios";

class Client {
  apiBaseURI = process.env.REACT_APP_API_BASE_URI || "/api/";

  filesBaseURI = process.env.REACT_APP_FILES_BASE_URI || "/files/";

  statementsBaseURI = process.env.REACT_APP_STATEMENTS_BASE_URI || "/statements/";

  communicationsBaseURI = process.env.REACT_APP_COMMUNICATIONS_BASE_URI || null;

  api = axios.create({ baseURL: this.apiBaseURI, withCredentials: true });

  files = axios.create({ baseURL: this.filesBaseURI, withCredentials: true });

  statements = axios.create({
    baseURL: this.statementsBaseURI,
    withCredentials: true,
  });

  communications = axios.create({
    baseURL: this.communicationsBaseURI || this.apiBaseURI,
    withCredentials: true,
  });

  userRole: string | null = null;

  adminApi(path: string, options: { [key: string]: unknown } = {}) {
    if (Object.keys(options).length === 0) {
      return this.api.get(`/admin/${path}`);
    }
    return this.api.post(`/admin/${path}`, options);
  }
}

export const client = new Client();
