import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom';
import './App.css';
import Router from './router';
import GlobalNav from './components/GlobalNav/GlobalNav';
import { LoginContext } from './index';
//create a context that can be accessed and modified globally without needing to be passed as a prop
//https://dmitripavlutin.com/react-context-and-usecontext/

function App() {
  const LoginCtx = useContext(LoginContext)
  const [sessionToken, setSessionToken] = useState(LoginCtx.sessionToken)
  const [sessionRole, setSessionRole] = useState(LoginCtx.sessionRole)
  const [sessionId, setSessionId] = useState(LoginCtx.sessionId)
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem("token")) {
      setSessionToken(localStorage.getItem("token"))
    } else {
      setSessionToken(undefined)
    }
    if (localStorage.getItem("role")) {
      setSessionRole(localStorage.getItem("role"))
    } else {
      setSessionRole(undefined)
    }
    if (localStorage.getItem("userId")) {
      setSessionId(localStorage.getItem("userId"))
    } else {
      setSessionId(undefined)
    }
  })

  const updateLocalStorageToken = newToken => {
    localStorage.setItem("token", newToken)
    setSessionToken(newToken)
  }

  const updateLocalStorageRole = newRoleId => {
    localStorage.setItem("role", newRoleId)
    setSessionRole(newRoleId)
  }
  const updateLocalStorageId = newUserId => {
    localStorage.setItem("userId", newUserId )
    setSessionId(newUserId)
  }

  const logoutAndClearSession = () => {
    localStorage.clear()
    setSessionRole(undefined)
    setSessionToken(undefined)
    setSessionId(undefined)
  }
  return (
    /*
        This is where we define our Context values. We are providing the user's
        session token, session role (a number 1-4), the functions to update
        the token and the role by modifying localStorage, which *should* trigger
        the useEffect() and change the state values for token and role,
        and a function that logs out, clears local storage values, and boots the
        user to the homepage (login)
     */
    <LoginContext.Provider value={{
      sessionToken,
      sessionRole,
      sessionId,
      updateLocalStorageToken,
      updateLocalStorageRole,
      updateLocalStorageId,
      logoutAndClearSession
    }}> 
      <GlobalNav />
      <Router />
    </LoginContext.Provider>
  );
}

export default App;
