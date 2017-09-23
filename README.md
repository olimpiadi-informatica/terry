# terry

**terry** is a Google-Code-Jam-like programming contest environment designed for the territorial phase of the Italian Olympiad in Informatics (OII, _Olimpiadi Italiane di Informatica_).

## Setup a production-like environment

1. Clone recursively this repo `git clone --recursive https://github.com/algorithm-ninja/terry`
2. Follow the instructions in `territoriali-backend/`
3. Place the zip of the contest in the folder set in the backend config file
4. Setup the frontend
 - Inside `territoriali-frontend/`
 - export some frontend variables: `REACT_APP_API_BASE_URI` `REACT_APP_FILES_BASE_URI` `REACT_APP_STATEMENTS_BASE_URI`
 - `npm install`
 - `npm run build`
5. Setup the reverse proxy (or some form of frontend server), consider using the `nginx-example.conf` file as a template.
6. Start the backend running `terr-server`
7. Start the proxy

The provided nginx configuration file assumes:
- `REACT_APP_API_BASE_URI=`http://localhost/api/
- `REACT_APP_FILES_BASE_URI=`http://localhost/files/
- `REACT_APP_STATEMENTS_BASE_URI=`http://localhost/statements/

You have put this repo inside `/app` directory in the server. The backend is configured to use the default port 1234.
Remember to configure the backend with (at least this changes):
```yaml
address: 127.0.0.1
admin_token: SOMETHING DIFFERENT FROM THE DEFAULT
num_proxy: 1
```

