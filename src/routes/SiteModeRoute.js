import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SiteModeRoute = ({ children, allowedModes }) => {
  const { sitemode } = useAuth();
  
  if (!allowedModes.includes(sitemode)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default SiteModeRoute;

