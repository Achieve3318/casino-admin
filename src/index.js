import React from "react";
import ReactDOM from "react-dom/client";
// import "@ant-design/v5-patch-for-react-19";
import { ConfigProvider } from "antd";
import "antd/dist/reset.css"; // Import Ant Design styles
import "font-awesome/css/font-awesome.min.css";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ConfigProvider
    theme={{
      components: {
        Menu: {
          colorBgContainer: "#2d7aff", // Menu background color
          itemSelectedBg: "#449aff", // Selected item background
          colorBgElevated: "#2d7aff", // Submenu background when collapsed

          itemHoverBg: "#449aff", // Hover background
          itemColor: "#ffffff", // Default text color
          itemHoverColor: "#ffffff",
          itemSelectedColor: "#ffffff",
        },
        Table: {
          headerBg: "#2d7aff", // Change header background color
          headerColor: "#ffffff", // Change header text color
          headerSortHoverBg: "#449aff",
          headerSortActiveBg: "#449aff",
        },
      },
    }}
  >
    <App />
  </ConfigProvider>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
