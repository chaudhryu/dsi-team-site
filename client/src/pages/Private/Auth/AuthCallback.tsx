// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError, InteractionStatus } from "@azure/msal-browser";   // ✅ correct import
import Swal from "sweetalert2";
import {fetchEmployeeDetails} from '../../../Data/actions/EmployeeAction';
import { getMsGraphMe } from "../../../Data/api/graphApi";
import { useLogin } from '../../../context/LoginContext';
var loginEmployee = {
  badge: '',
  firstName: '',
  lastName: '',
  emailAddress: '',
  department: '',
  costCenter: '',
  phoneNumber: '',
  position: '',
  role: 'User', // default role, either User, or Admin
  isManager: false,
  isSsLsr: false,
  isCs: false,
  managerBadge: '',
  managerFisrtName: '',
  managerLastName: '',
  managerEmailAddress: '',
  managerPhoneNumber: '',
  vendorId: '', //  vendorId property
}
export default function AuthCallback() {
  const { inProgress,instance,accounts } = useMsal();
  const navigate = useNavigate();
  const loginContext = useLogin();
  const initializeSession = loginContext?.initializeSession;
  const request = {
    scopes: ['user.read'],
    account: accounts[0],
  }
  const requestUserProfileData = async () => {
    instance
      .acquireTokenSilent(request)
      .then((response) => {       
        getMsGraphMe(response.accessToken).then((data: { officeLocation: any; }) => {
          // get officeLocation which is employee badge

          fetchEmployeeInfo(data?.officeLocation)
        })
      })
      .catch((error) => {
        if (
          error instanceof InteractionRequiredAuthError ||
          error.errorCode === 'monitor_window_timeout'
        ) {
          Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Your session has expired. Please sign in again.',
            confirmButtonText: 'Re-login',
            allowOutsideClick: false,
          }).then(() => {
            instance.logoutRedirect() // or acquireTokenRedirect() if you prefer
          })
        } else {
          console.error('Unexpected MSAL error:', error)
        }
      })
  }
  
  const fetchEmployeeInfo = async (badgeNumber:string) => {
    try {
      const response = await fetchEmployeeDetails(badgeNumber)

      if (response.status === 200) {
        const empData = response.data
        console.log(empData)

        loginEmployee.badge = badgeNumber
        loginEmployee.firstName = empData.employeeFirstName || ''
        loginEmployee.lastName = empData.employeeLastName
        loginEmployee.emailAddress = empData.employeeEmailAddress
        loginEmployee.department = empData.department
        loginEmployee.position = empData.jobClassTitle
        loginEmployee.costCenter = empData.costCenter
        loginEmployee.phoneNumber = empData.employeeWorkPhone
        loginEmployee.managerBadge = empData.managerBadgeNumber
        loginEmployee.managerFisrtName = empData.managerFirstName
        loginEmployee.managerLastName = empData.managerLastName
        loginEmployee.managerEmailAddress = empData.managerEmailAddress
        loginEmployee.managerPhoneNumber = empData.managerWorkPhone      
      }
    } catch (error) {
      // A login user is not found in user_profile database.
      // This user's role is "User" as default.
      // DO NOTHING
    }finally{
      // Initialize session with the loginEmployee object
      if (initializeSession) {
        initializeSession(loginEmployee);
      }
      // Redirect to home page after successful login
      navigate("/", { replace: true });
    }
  }
  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      const fetchData = async () => {
        await requestUserProfileData()
      }
      fetchData()
    }
  }, [inProgress, navigate]);

  return null;
}
