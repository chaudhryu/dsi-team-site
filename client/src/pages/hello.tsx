// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";   // ✅ correct import

export default function AuthCallback() {
  const { inProgress } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      navigate("/", { replace: true });
    }
  }, [inProgress, navigate]);

  return null;
}
