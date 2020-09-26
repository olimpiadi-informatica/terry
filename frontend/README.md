# terry frontend

## How to run the frontend

1. First of all you need to install all the dependencies of this project: `npx yarn install`

2. Build the docker image for the backend: `docker build -t terry ./docker/`

3. Start the backend: `docker run -p 2000:80 terry`

4. Start the frontend: `npx yarn start`

5. Finally, point your browser to http://localhost:9000

If for some weird reason you need to start the contest _without using a browser_ you can issue:
```
curl -X POST -F admin_token=secret  http://localhost:1234/admin/start
```
where `secret` is the admin token you have chosen.


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
