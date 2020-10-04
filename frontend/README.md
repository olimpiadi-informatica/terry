# terry frontend

## How to run the frontend

1. First of all you need to install all the dependencies of this project: `npx yarn install`

2. Build the docker image for the backend: `docker build -t terry ./docker/`

3. Start the backend: `docker run -p 2000:80 terry`

4. Start the frontend: `npx yarn start`

5. Point your browser to http://localhost:9000/admin

6. Upload a contest pack. You can find a sample in https://github.com/algorithm-ninja/terry-sample-contest

7. Start the contest by clicking on the button.

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

The translations are handled by the `shared` package, inside `packages/shared` you can use the locale-specific commands described below.

1. Write your text in English wrapping it in the `<Trans>` component
2. Run `yarn extract` in `packages/shared` for updating the `.po` files inside `packages/shared/src/locales`. It will show you how many translations are still missing
3. Make your translations in the `.po` files
4. Compile the new translations with `yarn compile` in `packages/shared`

If you want to support a new language:
1. Run `yarn add-locale <locale>` in `packages/shared`
2. Write your translations in the `.po` file
3. Compile the translation with `yarn compile` in `packages/shared`
4. Add your language to the catalog and to the language list in `packages/shared/src/i18n.tsx` and `packages/shared/src/i18n.css`

## Monorepo

This folder contains all the frontend code managed as a lerna monorepo.
The terry-frontend specific code should be placed in the `packages/frontend` directory.
The code shared between frontends should be placed in `packages/shared`.

The scripts listed in this `package.json` orchestrate all the packages, for package-specific scripts look at the corresponding subfolders.
Note that running a particular frontend may require to build the dependencies beforehand. If possible use the scripts listed here.

Unfortunately, due to some limitations of tsc, create-react-app and other JS-related components, some hacks are required:

- Importing `@terry/shared` requires you to use the full path, including `_` (e.g. `import { Loading } from "@terry/shared/_/Loading"`).
   - You cannot import from `src` because webpack cannot load typescript files outside the package
   - You cannot import using a path relative to `src` (i.e. without `_`), because it's not in the import paths
- Inside `@terry/shared` you should only use relative imports (e.g. `../components/Modal`) for the code
   - i.e. you cannot simply set `baseUrl` in `tsconfig.json` and include from `src` because when importing the module it doesn't resolve to the correct path
- Inside `@terry/shared` you should only use absolute imports (e.g. `@terry/shared/src/i18n.css`) for non-js/ts code
   - tsc won't copy those files in `_`, therefore relative imports do not work
   - For the same reason you should use `src` and not `_`
   - And yes, even inside the shared package you should import from the same package, ignoring `import/no-extraneous-dependencies`