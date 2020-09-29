import axios from "axios";

class Client {
  apiBaseURI = process.env.REACT_APP_API_BASE_URI || "/api/";

  filesBaseURI = process.env.REACT_APP_FILES_BASE_URI || "/files/";

  statementsBaseURI = process.env.REACT_APP_STATEMENTS_BASE_URI || "/files/";

  communicationsBaseURI = process.env.REACT_APP_COMMUNICATIONS_BASE_URI || null;

  api = axios.create({ baseURL: this.apiBaseURI });

  files = axios.create({ baseURL: this.filesBaseURI });

  statements = axios.create({ baseURL: this.statementsBaseURI });

  communications = this.communicationsBaseURI ? axios.create({ baseURL: this.communicationsBaseURI }) : null;

  adminApi(token: string, path: string, options: { [key: string]: string | undefined } = {}) {
    const data = new FormData();
    Object.entries(options).forEach(([key, value]) => {
      if (value) data.set(key, value);
    });
    data.set("admin_token", token);

    return this.api.post(`/admin/${path}`, data);
  }
}

export const client = new Client();
