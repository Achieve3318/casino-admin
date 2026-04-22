// src/context/SocketContext.js

import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { SUB_SITE } from "../utility";

// Create a Socket Context
const SocketContext = createContext({
  socketBetLog: null,
  socketDeposit: null,
  socketLogin: null,
  socketChat: null,
  socketAdmin: null,
});

// Hook to use socket
export const useSocket = () => {
  return useContext(SocketContext);
};

// Socket Provider Component
export const SocketProvider = ({ children }) => {
  const [socketDeposit, setSocketDeposit] = useState(null);
  const [socketBetLog, setSocketBetLog] = useState(null);
  const [socketLogin, setSocketLogin] = useState(null);
  const [socketChat, setSocketChat] = useState(null);
  const [socketAdmin, setSocketAdmin] = useState(null);

  const { auth , sitemode } = useAuth();
  const [token, setToken] = useState(null);

  useEffect(() => setToken(localStorage.getItem("token")), [auth]);

  useEffect(() => {
    // Connect to the socket server
    const socketInstance = io( SUB_SITE[sitemode]+ "/betlog"); // Your backend URL

    // Optional: listen for connection success
    socketInstance.on("connect", () => {
      console.log("Connected to socket server");
    });
    setSocketBetLog(socketInstance);
    // Clean up the socket connection when the component unmounts
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // useEffect(() => {
  //     // Connect to the socket server
  //     const socketInstance = io(process.env.SUB_SITE[sitemode] + "/login"); // Your backend URL

  //     // Optional: listen for connection success
  //     socketInstance.on('connect', () => {
  //     });

  //     setSocketLogin(socketInstance)
  //     socketInstance.disconnect();
  //     // Clean up the socket connection when the component unmounts
  //     return () => {
  //         socketInstance.off('connect');
  //         socketInstance.disconnect();
  //     };

  // }, []);

  // useEffect(() => {
  //     // Connect to the socket server
  //     const socketInstance = io(process.env.SUB_SITE[sitemode] + "/deposit"); // Your backend URL

  //     // Optional: listen for connection success
  //     socketInstance.on('connect', () => {
  //     });

  //     setSocketDeposit(socketInstance);
  //     socketInstance.disconnect();
  //     // Clean up the socket connection when the component unmounts
  //     return () => {
  //         socketInstance.off('connect');
  //         socketInstance.disconnect();
  //     };
  // }, []);

  useEffect(() => {
    if (!token) return;
    // Connect to the socket server
    const socketInstanceChat = io(SUB_SITE[sitemode] + "/chat", {
      auth: { token },
    }); // Your backend URL

    // Optional: listen for connection success
    socketInstanceChat.on("connect", () => {});

    socketInstanceChat.on("connect_error", (error) => {
      console.error("Chat socket connection error:", error.message);
    });

    setSocketChat(socketInstanceChat);
    socketInstanceChat.disconnect();
    // Clean up the socket connection when the component unmounts
    return () => {
      socketInstanceChat.off("connect");
      socketInstanceChat.off("connect_error");
      socketInstanceChat.disconnect();
    };
  }, [token]);

  useEffect(() => {
    // Connect to admin socket for withdrawal notifications (no auth required)
    const socketInstanceAdmin = io(SUB_SITE[sitemode] + "/admin");

    socketInstanceAdmin.on("connect", () => {
      console.log("Admin socket connected");
    });

    socketInstanceAdmin.on("connect_error", (error) => {
      console.error("Admin socket connection error:", error.message);
    });

    setSocketAdmin(socketInstanceAdmin);
    
    // Clean up the socket connection when the component unmounts
    return () => {
      socketInstanceAdmin.off("connect");
      socketInstanceAdmin.off("connect_error");
      socketInstanceAdmin.disconnect();
    };
  }, [sitemode]);

  return (
    <SocketContext.Provider
      value={{ socketBetLog, socketLogin, socketDeposit, socketChat, socketAdmin }}
    >
      {children}
    </SocketContext.Provider>
  );
};
