module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2020,
    "sourceType": "module",
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "max-len": ["warn", {"code": 150, "ignoreUrls": true, "ignoreStrings": true}],
    "object-curly-spacing": ["error", "never"],
    "linebreak-style": "off",
    "no-trailing-spaces": "warn",
    "valid-jsdoc": "off",
    "indent": ["warn", 2],
    "comma-dangle": ["warn", "always-multiline"],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};

