// src/pages/AuthCallback.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError, InteractionStatus } from "@azure/msal-browser";
import Swal from "sweetalert2";
import { fetchEmployeeDetails, fetchEmployeeHierarchy } from "../../../Data/actions/EmployeeAction";
import { checkUserLoginAndSettingProfile } from "@/Data/actions/UserAction";
import { getMsGraphMe } from "../../../Data/api/graphApi";
import { useLogin } from "../../../context/LoginContext";
import { envConfig } from "../../../config/envConfig";
import { ErrorModal } from "@/components/modal/ErrorModal";
import { Card, CardContent } from "@/components/ui/card";
type MinimalUser = {
  badge: number;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  role?: string;
  costCenter?: number;
  reportToLevelOne?: number;
  reportToLevelTwo?: number;
};

const LOGIN_KEY = envConfig.loginEmpKey || "loginEmployee";

export default function AuthCallback() {
  const { inProgress, instance, accounts } = useMsal();
  const navigate = useNavigate();
  const loginContext = useLogin();
  const initializeSession = (loginContext as any)?.initializeSession; // optional
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  const request = {
    scopes: ["user.read"],
    account: accounts[0],
  };

  const requestUserProfileData = async () => {
    instance
      .acquireTokenSilent(request)
      .then(async (response) => {
        const me = await getMsGraphMe(response.accessToken);
        await checkAndSyncEmployeeInfo(me?.officeLocation);
      })
      .catch((error) => {
        if (error instanceof InteractionRequiredAuthError || (error as any)?.errorCode === "monitor_window_timeout") {
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

  const checkAndSyncEmployeeInfo = async (badgeStr: string) => {
    let minimalUser: MinimalUser | null = null;
    const parsedBadge = Number(badgeStr);
    debugger;
    try {
      // fetch employee details from FIS
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
          costCenter: Number(emp.costCenter) || undefined,
        };
        // next fetch hierachy info
        const hierarchyResponse = await fetchEmployeeHierarchy(badgeStr);
        if (hierarchyResponse.status === 200) {
          const hierarchyData = hierarchyResponse.data;
          if (Array.isArray(hierarchyData) && hierarchyData.length >= 2) {
            const extractBadge = (rec: any): number | undefined => {
              if (!rec || typeof rec !== "object") return undefined;
              const badge = Number(rec["employeeBadgeNumber"]);
              if (Number.isFinite(badge)) return badge;
              return undefined;
            };

            const second = hierarchyData[1]; // first level manager
            const third = hierarchyData[2]; // second level manager

            const secondBadge = extractBadge(second);
            if (secondBadge !== undefined) minimalUser!.reportToLevelOne = secondBadge;

            if (third) {
              const thirdBadge = extractBadge(third);
              if (thirdBadge !== undefined) minimalUser!.reportToLevelTwo = thirdBadge;
            }
          }
        }
        const checkResponse = await checkUserLoginAndSettingProfile(minimalUser);
        if (checkResponse.status !== 200 && checkResponse.status !== 201) {
          // alert and sign user our of SSO
          var errorMessage = "";
          if (checkResponse.data.reason) {
            switch (checkResponse.data.reason) {
              case "COSTCENTER_NOT_ALLOWED":
                errorMessage = "Your cost center is not enabled ";
                break;
              case "NO_MANAGER_FOR_COST_CENTER":
                errorMessage = "No manager assigned to your cost center.";
                break;
              case "USER_NOT_IN_MANAGER_TEAM":
                errorMessage = "You are not reporting to any assigned manager.";
                break;
              case "INTERNAL_ERROR":
                errorMessage = "An internal error occurred.";
                break;
              default:
                errorMessage = "You are not authorized to access this system.";
                break;
            }
            setError({
              title: "Access denied",
              message: errorMessage + " Please contact your manager or DSI admin for assistance.",
            });
            return;
          }
        }
        minimalUser.role = checkResponse.data.role || minimalUser.role; //assign role from server
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
      minimalUser && minimalUser.role == "high_manager"
        ? navigate("/high-manager-dashboard", { replace: true })
        : navigate("/dashboard", { replace: true });
    }
  };

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      requestUserProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, navigate, inProgress]);

  return (
    <>
      <Card>
        <CardContent className="p-6"> Authenticating User...</CardContent>
      </Card>
      <ErrorModal
        open={!!error}
        title={error?.title ?? ""}
        message={error?.message ?? ""}
        onCloseButtonLabel="Logout"
        onClose={() => instance.logoutRedirect}
      />
    </>
  );
}
