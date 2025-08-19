// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError, InteractionStatus } from "@azure/msal-browser";
import Swal from "sweetalert2";
import { fetchEmployeeDetails } from "../../../Data/actions/EmployeeAction";
import { getMsGraphMe } from "../../../Data/api/graphApi";
import { useLogin } from "../../../context/LoginContext";
import { envConfig } from "../../../config/envConfig";
type MinimalUser = {
  badge: number;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  role?: string;
};

const LOGIN_KEY = envConfig.loginEmpKey || "loginEmployee";

export default function AuthCallback() {
  const { inProgress, instance, accounts } = useMsal();
  const navigate = useNavigate();
  const loginContext = useLogin();
  const initializeSession = (loginContext as any)?.initializeSession; // optional

  const request = {
    scopes: ["user.read"],
    account: accounts[0],
  };

  const requestUserProfileData = async () => {
    instance
      .acquireTokenSilent(request)
      .then(async (response) => {
        const me = await getMsGraphMe(response.accessToken);
        await fetchEmployeeInfo(me?.officeLocation);
      })
      .catch((error) => {
        if (
          error instanceof InteractionRequiredAuthError ||
          (error as any)?.errorCode === "monitor_window_timeout"
        ) {
          Swal.fire({
            icon: "warning",
            title: "Session Expired",
            text: "Your session has expired. Please sign in again.",
            confirmButtonText: "Re-login",
            allowOutsideClick: false,
          }).then(() => {
            instance.logoutRedirect();
          });
        } else {
          console.error("Unexpected MSAL error:", error);
        }
      });
  };

  const fetchEmployeeInfo = async (badgeStr: string) => {
    let minimalUser: MinimalUser | null = null;
    const parsedBadge = Number(badgeStr);

    try {
      const response = await fetchEmployeeDetails(badgeStr);
      if (response.status === 200) {
        const emp = response.data;
        minimalUser = {
          badge: Number.isFinite(parsedBadge) ? parsedBadge : 0,
          firstName: emp.employeeFirstName || "",
          lastName: emp.employeeLastName || "",
          email: emp.employeeEmailAddress || "",
          position: emp.jobClassTitle || "",
          role: "User",
        };
      }
    } catch {
      // fallback minimal user if EMP lookup fails
      minimalUser = {
        badge: Number.isFinite(parsedBadge) ? parsedBadge : 0,
        firstName: "",
        lastName: "",
        email: "",
        position: "",
        role: "User",
      };
    } finally {
      if (minimalUser && minimalUser.badge) {
        // hydrate app state if your context supports it (optional)
        try {
          initializeSession?.(minimalUser);
        } catch {}
        // persist for pages that don’t use the context
        try {
          localStorage.setItem(LOGIN_KEY, JSON.stringify(minimalUser));
        } catch (e) {
          console.warn("Failed to write login user to localStorage", e);
        }
      } else {
        console.warn("No valid badge found; cannot initialize session.");
      }
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      requestUserProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress]);

  return null;
}
