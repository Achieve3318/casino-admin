import React from "react";
import { RouterProvider } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/socketProvider";
import router from "./routes/router";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router}></RouterProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
