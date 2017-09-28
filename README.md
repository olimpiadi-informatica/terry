# territoriali-frontend

This is the frontend part of [Terry](https://github.com/algorithm-ninja/terry). If you are looking for the backend please go to the [correct repo](https://github.com/algorithm-ninja/territoriali-backend).

## How to run the frontend

First of all you need to install all the dependencies of this project: `npm install`

1. Setup the backend, see its readme for a quick start guide
2. Start a simple webserver (port 1235) in the `contest/files` folder in the backend. You may want to run `python3 -m http.server 1235`.
3. Run `npm start` to start a simple proxy that links everything together.
4. Go to http://localhost:5050/

Remember to start the contest! For example you can issue
```
curl -X POST -F admin_token=password  http://localhost:1234/admin/start
```
where `secret` is the admin token you have chosen.


## How to build the production version

Take a look at https://github.com/algorithm-ninja/terry#setup-a-production-like-environment for the complete guide.