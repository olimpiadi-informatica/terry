module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "airbnb",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2021,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "import", "jsx-a11y", "react"],
  rules: {
    // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-module-boundary-types.md
    "@typescript-eslint/explicit-module-boundary-types": "off",

    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-default-export.md
    "import/no-default-export": "warn",
    "import/prefer-default-export": "off",

    // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-empty-function.md
    "no-empty-function": "off",
    "@typescript-eslint/no-empty-function": "off",

    // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-shadow.md
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": ["error"],

    // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": "error",

    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/extensions.md
    "import/extensions": ["error", "never"],

    // https://eslint.org/docs/rules/indent
    indent: ["error", 2],

    // https://eslint.org/docs/rules/max-len
    "max-len": [
      "warn",
      120,
      2,
      {
        ignoreUrls: true,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],

    // https://eslint.org/docs/rules/no-multi-spaces
    "no-multi-spaces": "error",

    // https://eslint.org/docs/rules/no-underscore-dangle
    "no-underscore-dangle": [
      "error",
      {
        allowAfterThis: true,
      },
    ],

    // https://eslint.org/docs/rules/quotes
    quotes: [
      "error",
      "double",
      {
        allowTemplateLiterals: true,
      },
    ],

    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-filename-extension.md
    "react/jsx-filename-extension": [1, { extensions: [".jsx", ".tsx"] }],

    // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/label-has-associated-control.md
    "jsx-a11y/label-has-associated-control": [
      "error",
      {
        required: {
          some: ["nesting", "id"],
        },
      },
    ],

    // https://eslint.org/docs/rules/semi
    semi: ["error", "always"],

    // https://eslint.org/docs/rules/no-restricted-imports
    "no-restricted-imports": [
      "warn",
      {
        patterns: ["../*"],
      },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
    "import/resolver": {
      typescript: {
        // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
        alwaysTryTypes: true,
      },
    },
  },
};
