# terry frontend

This is the React-based frontend for the `terry` contest environment.

For full setup and production build instructions, please refer to the [root README.md](../README.md).

## Development Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start the development server:
   ```bash
   yarn start
   ```
   This will start the frontend on `http://localhost:3000` and proxy API requests to the backend (configured in `proxy.ts`).

3. Point your browser to `http://localhost:3000/`.

## Internet connectivity detection and reporting

The frontend can detect and report internet connectivity issues. You can configure the test endpoint using the following environment variable:

```
REACT_APP_DETECT_INTERNET_TEST_ENDPOINT="https://gstatic.com/generate_204"
```

## Translation workflow

`terry` uses [LinguiJS](https://lingui.js.org/) for internationalization.

1. Write your text in English wrapping it in the `<Trans>` component or using the `t` macro.
2. Run `yarn extract` to update the `.po` files inside `src/locales`.
3. Make your translations in the `.po` files.
4. Compile the new translations:
   ```bash
   yarn compile
   ```

If you want to support a new language:
1. Run `yarn add-locale <locale>`
2. Write your translations in the `.po` file.
3. Compile the translation with `yarn compile`.
4. Add your language to the catalog and to the language list in `src/i18n.tsx`.
