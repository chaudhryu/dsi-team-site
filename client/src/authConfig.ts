/**
 * MSAL/Entra ID configuration
 * Replace the placeholders with your real Azure values.
 */
import { LogLevel, Configuration } from "@azure/msal-browser";





const currentHostname = window.location.hostname;

let determinedRedirectUri;

switch (currentHostname) {
    // --- Production Environment ---
    case 'prr.metro.net':
        determinedRedirectUri = 'https://dsi.metro.net/auth-response'; 
        break;

    case 'webappprodtest.metro.net':
        determinedRedirectUri = 'https://webappprodtest.metro.net/auth-response';
        break;
        
    // --- Development Environment ---
    case 'prrdev.metro.net': 
        determinedRedirectUri = 'https://dsidev.metro.net/auth-response'; 
        break;

    // --- Local Development Environment ---
    case 'localhost':
        determinedRedirectUri = 'http://localhost:5173/auth-response'; 
        break;

    // --- Default/Fallback Case ---
    default:
        console.warn(`MSAL config: Unrecognized hostname "${currentHostname}", defaulting redirectUri to localhost.`);
        determinedRedirectUri = 'http://localhost:5173/auth-response';
}


export const msalConfig: Configuration = {
  auth: {
    clientId: "d9e7775f-277f-40a2-8120-c485a7b5413a",              // << App Registration – Application (client) ID
    authority:
      "https://login.microsoftonline.com/ab57129b-dbfd-4cac-aa77-fc74c40364af", // or B2C authority
    redirectUri:  determinedRedirectUri,     // http://localhost:3000 for local dev
    postLogoutRedirectUri: "/",     
    navigateToLoginRequestUrl: false,    // 👈 NEW
    // Back to home after logout
  },
  cache: {
    cacheLocation: "sessionStorage",         // "localStorage" if you need SSO across tabs
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback(level, message, containsPii) {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
        }
      },
    },
  },
};

/** Scopes you want when the user signs in */
export const loginRequest = {
  scopes: ["User.Read"], // Add API scopes here
};
