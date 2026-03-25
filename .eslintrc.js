module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    'wechat-miniprogram': true
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'prettier/prettier': 'error'
  }
};