// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,

  firebaseConfig: {
    apiKey: "AIzaSyBYLKl0XVX8i9iF5T8PmdEPXXupGIylvqo",
    authDomain: "lioncabs-fc588.firebaseapp.com",
    databaseURL: "https://lioncabs-fc588.firebaseio.com",
    projectId: "lioncabs-fc588",
    storageBucket: "lioncabs-fc588.appspot.com",
    messagingSenderId: "768358335569"
  },

  mapbox: {
    accessToken: 'pk.eyJ1IjoidGhlY3JhYiIsImEiOiJWbFpnaDBzIn0.ucrweW4ZDtEFHZlxRYpUug'
  }
};
