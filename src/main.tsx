import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PublicClientApplication } from "@azure/msal-browser";
import {MsalProvider} from "@azure/msal-react"
import { msalConfig } from "./config/authConfig.ts";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";

const msalInstance = new PublicClientApplication(msalConfig);


createRoot(document.getElementById("root")!).render(
<StrictMode>
    <MsalProvider instance={msalInstance}>      {/* NEW */}
      <ThemeProvider>
        <AppWrapper>
          <App />
        </AppWrapper>
      </ThemeProvider>
    </MsalProvider>
  </StrictMode>,
);
