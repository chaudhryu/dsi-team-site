/**
 * MSAL/Entra ID configuration
 * Replace the placeholders with your real Azure values.
 */
import { LogLevel, Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "YOUR_CLIENT_ID",              // << App Registration – Application (client) ID
    authority:
      "https://login.microsoftonline.com/YOUR_TENANT_ID", // or B2C authority
    redirectUri: window.location.origin,     // http://localhost:3000 for local dev
    postLogoutRedirectUri: "/",              // Back to home after logout
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
