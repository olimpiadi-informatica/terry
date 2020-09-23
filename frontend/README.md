# terry frontend

## How to run the frontend

First of all you need to install all the dependencies of this project: `npm install`

1. Setup the backend, see its readme for a quick start guide
2. Start a simple webserver (port 1235) in the `contest/files` folder in the backend. You may want to run `python3 -m http.server 1235`.
3. Run `npm start` to start a simple proxy that links everything together.
4. Go to http://localhost:5050/

Remember to start the contest! For example you can issue
```
curl -X POST -F admin_token=secret  http://localhost:1234/admin/start
```
where `secret` is the admin token you have chosen.


## How to build the production version

Take a look at https://github.com/algorithm-ninja/terry#setup-a-production-like-environment for the complete guide.

## Internet connectivity detection and reporting

Build/start the front-end with the following environment variable:

```
REACT_APP_DETECT_INTERNET_TEST_ENDPOINT="http://gstatic.com/generate_204"
```

## Translation workflow

1. Write your text in English wrapping it in the `<Trans>` component
2. Run `yarn extract` for updating the `.po` files inside `src/locales`. It will show you how many translations are still missing
3. Make your translations in the `.po` files
4. Compile the new translations with `yarn compile`

If you want to support a new language:
1. Run `yarn add-locale <locale>`
2. Write your translations in the `.po` file
3. Compile the translation with `yarn compile`
4. Add your language to the catalog and to the language list in `src/i18n.tsx`
