import axios from 'axios';

class Client {
  constructor() {
    this.apiBaseURI = process.env.REACT_APP_API_BASE_URI || "/api/";
    this.api = axios.create({
      baseURL: this.apiBaseURI,
    });

    this.adminApi = (token, path, options={}) => {
      options.admin_token = token;
      const data = new FormData();
      for (const key in options)
        data.append(key, options[key]);
      return this.api.post("/admin/" + path, data);
    };

    this.filesBaseURI = process.env.REACT_APP_FILES_BASE_URI || "/files/";
    this.files = axios.create({
      baseURL: this.filesBaseURI,
    });

    this.statementsBaseURI = process.env.REACT_APP_STATEMENTS_BASE_URI || "/files/";
    this.statements = axios.create({
      baseURL: this.statementsBaseURI,
    });
  }
}

export default new Client();
