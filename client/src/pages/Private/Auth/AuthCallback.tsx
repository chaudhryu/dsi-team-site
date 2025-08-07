// src/pages/AuthPages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import {
  InteractionRequiredAuthError,
  InteractionStatus,
  AccountInfo,
} from "@azure/msal-browser";
import Swal from "sweetalert2";
import { fetchEmployeeDetails } from "../../../Data/actions/EmployeeAction";
import { getMsGraphMe } from "../../../Data/api/graphApi";
import { useLogin } from "../../../context/LoginContext";

/* ────────────────────────────────────────────────────────────────── */
/* 1. Type & initial object                                          */
/* ────────────────────────────────────────────────────────────────── */

interface EmployeeSession {
  badge: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  department: string;
  costCenter: string;
  phoneNumber: string;
  position: string;
  role: "User" | "Admin";
  isManager: boolean;
  isSsLsr: boolean;
  isCs: boolean;
  managerBadge: string;
  managerFisrtName: string;
  managerLastName: string;
  managerEmailAddress: string;
  managerPhoneNumber: string;
  vendorId?: string;
}

const loginEmployee: EmployeeSession = {
  badge: "",
  firstName: "",
  lastName: "",
  emailAddress: "",
  department: "",
  costCenter: "",
  phoneNumber: "",
  position: "",
  role: "User",
  isManager: false,
  isSsLsr: false,
  isCs: false,
  managerBadge: "",
  managerFisrtName: "",
  managerLastName: "",
  managerEmailAddress: "",
  managerPhoneNumber: "",
  vendorId: "",
};

/* ────────────────────────────────────────────────────────────────── */
/* 2. Component                                                      */
/* ────────────────────────────────────────────────────────────────── */

export default function AuthCallback() {
  const { instance, inProgress } = useMsal();
  const navigate = useNavigate();
  const { initializeSession } = useLogin() ?? {};

  /* ❶ Process the Entra redirect once */
  useEffect(() => {
    instance
      .handleRedirectPromise()
      .then((response) => {
        const account = response?.account || instance.getAllAccounts()[0];
        if (account) instance.setActiveAccount(account);
      })
      .catch((err) => console.error("handleRedirectPromise error:", err));
  }, []);

  /* ❷ When MSAL is idle, get user profile */
  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      const account = instance.getActiveAccount();
      if (account) {
        requestUserProfileData(account);
      } else {
        instance.loginRedirect({ scopes: ["User.Read"] });
      }
    }
  }, [inProgress]);

  /* ❸ Token → Graph → your back‑end */
  const requestUserProfileData = (account: AccountInfo) => {
    instance
      .acquireTokenSilent({ scopes: ["User.Read"], account })
      .then((token) => getMsGraphMe(token.accessToken))
      .then((graph) => fetchEmployeeInfo(graph.officeLocation))
      .catch((error) => {
        if (
          error instanceof InteractionRequiredAuthError ||
          error.errorCode === "monitor_window_timeout"
        ) {
          Swal.fire({
            icon: "warning",
            title: "Session Expired",
            text: "Please sign in again.",
            confirmButtonText: "Re‑login",
          }).then(() => instance.logoutRedirect());
        } else {
          console.error("Unexpected MSAL error:", error);
        }
      });
  };

  /* ❹ Call back‑end, populate session object, save & redirect */
  const fetchEmployeeInfo = async (badge: string) => {
    try {
      const response = await fetchEmployeeDetails(badge);

      if (response.status === 200) {
        const emp = response.data;

        loginEmployee.badge = badge;
        loginEmployee.firstName = emp.employeeFirstName ?? "";
        loginEmployee.lastName = emp.employeeLastName ?? "";
        loginEmployee.emailAddress = emp.employeeEmailAddress ?? "";
        loginEmployee.department = emp.department ?? "";
        loginEmployee.position = emp.jobClassTitle ?? "";
        loginEmployee.costCenter = emp.costCenter ?? "";
        loginEmployee.phoneNumber = emp.employeeWorkPhone ?? "";
        loginEmployee.managerBadge = emp.managerBadgeNumber ?? "";
        loginEmployee.managerFisrtName = emp.managerFirstName ?? "";
        loginEmployee.managerLastName = emp.managerLastName ?? "";
        loginEmployee.managerEmailAddress = emp.managerEmailAddress ?? "";
        loginEmployee.managerPhoneNumber = emp.managerWorkPhone ?? "";
        // role / flags can be set here as well
      }
    } catch (_) {
      /* user not found: keep defaults */
    } finally {
      if (initializeSession) initializeSession(loginEmployee);
      navigate("/", { replace: true });
    }
  };

  /* ❺ Friendly placeholder while all of the above runs */
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-lg">Signing you in…</p>
    </div>
  );
}
