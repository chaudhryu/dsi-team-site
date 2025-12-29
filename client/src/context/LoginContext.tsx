import React, { createContext, useContext, useEffect, useState } from "react";

interface LoginContextType {
  loginEmployee: any;
  //isAdmin: boolean | undefined;
  initializeSession: (user: any) => void;
  logout: () => void;
}
const STORAGE_KEY = "loginEmployee";
const LoginContext = createContext<LoginContextType | null>(null);

export const LoginProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loginEmployee, setLoginEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  //const [isAdmin, setIsAdmin] = useState(undefined)
  // ✅ rehydrate on refresh
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY); // or localStorage
      if (stored) setLoginEmployee(JSON.parse(stored));
    } finally {
      setIsLoading(false);
    }
  }, []);
  const initializeSession = (user: any) => {
    sessionStorage.setItem("loginEmployee", JSON.stringify(user));
    setLoginEmployee(user);
  };
  const logout = () => {
    sessionStorage.removeItem("loginEmployee");
    setLoginEmployee(null);
  };

  return <LoginContext.Provider value={{ loginEmployee, initializeSession, logout }}>{children}</LoginContext.Provider>;
};

export const useLogin = (): LoginContextType => {
  const context = useContext(LoginContext);
  if (!context) {
    throw new Error("useLogin must be used within a LoginProvider");
  }
  return context;
};
