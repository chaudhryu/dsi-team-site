import React, { createContext, useContext, useState, useEffect } from 'react'


interface LoginContextType {
  loginEmployee: any;
  isAdmin: boolean | undefined;
  initializeSession: (user: any) => void;
}

const LoginContext = createContext<LoginContextType | null>(null)

export const LoginProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loginEmployee, setLoginEmployee] = useState(null)
  const [isAdmin, setIsAdmin] = useState(undefined)

 
  const initializeSession = (user:any) => {
    sessionStorage.setItem('loginEmployee', JSON.stringify(user))
    setLoginEmployee(user)
  }
 

  return (
    <LoginContext.Provider value={{ loginEmployee, isAdmin, initializeSession }}>
      {children}
    </LoginContext.Provider>
  )
}

export const useLogin = () => useContext(LoginContext)


