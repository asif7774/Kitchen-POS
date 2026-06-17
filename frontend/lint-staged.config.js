export default {
  "*.{ts,tsx,css}": ["prettier --write"],
  "*.{ts,tsx}": [
    "eslint --cache --fix",
    () => "npm run tsc",
    "vitest related --run",
  ],
};
