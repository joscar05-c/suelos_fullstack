// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  firebase: {
    apiKey: "AIzaSyADmuX8iJ4uVa0ZY5iUmGAxuw_HAEB-m8Y",
    authDomain: "analisis-suelos-7b055.firebaseapp.com",
    projectId: "analisis-suelos-7b055",
    storageBucket: "analisis-suelos-7b055.firebasestorage.app",
    messagingSenderId: "161685258270",
    appId: "1:161685258270:web:ec912480411a739c70ae0f"
  },
  supabase: {
    url: "https://etkvtknuqzwjjraayram.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3Z0a251cXp3ampyYWF5cmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjA5NjksImV4cCI6MjEwODY5Njk2OX0.D7ev4saxIzBfZ7703aWRC0VU4p_vLLPjfocnNL79SaM"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
