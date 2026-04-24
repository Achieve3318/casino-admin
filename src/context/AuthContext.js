import axios from "axios";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";
import { isEmpty, postUrl, SUB_SITE } from "../utility";
import postUrl2Pro from "../utility/postUrl2Pro";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
  });
  const [blockLists, setBlockLists] = useState([]);
  const [coins, setCoins] = useState({});
  const [fiat, setFiat] = useState([]);
  const [prices, setPrices] = useState({});
  const [sitemode, setSiteMode] = useState("betwallet")
  const [siteCurrency, setSiteCurrency] = useState("USD")


  useEffect(() => {
    setSiteMode(process.env.REACT_APP_SITE_MODE)
    setSiteCurrency(process.env.REACT_APP_SITE_CURRENCY)
    postUrl2Pro(
      "/api/coin/list",
      {},
      (data) => {
        setFiat(data.filter(item => isEmpty(item.networks)))
        let a = data.reduce((acc, item) => {
          acc[item._id] = item.image
            ? SUB_SITE[sitemode] + "/" + item.image
            : "/coins/DEMO.svg";
          return acc;
        }, {});
        let b = data.reduce((acc, item) => {
          acc[item._id] = item.price;
          return acc;
        }, {});
        setCoins(a);
        console.log(b);
        
        setPrices({ ...b, USD: 1 });
      },
      logout,
    );
    let token = window.localStorage.getItem("token");
    if (!token) {
      delete axios.defaults.headers.common["Authorization"];
      delete axios.defaults.headers.common["Frontend-URL"];
      return;
    }
    try {
      let user = jwtDecode(token);
      console.log(user);

      if (user.timestamp + user.exp > Date.now()) {
        setAuth({
          isAuthenticated: true,
          user,
        });
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        axios.defaults.headers.common["Frontend-URL"] =
          `${window.location.origin}`;
        postUrl(sitemode,
          "/api/user/blocked/list",
          {},
          (data) => {
            setBlockLists(data);

          },
          logout,
        );
      } else {
        logout();
      }
    } catch (err) {
      logout();
    }

  }, []);


  const logout = () => {
    setAuth({
      isAuthenticated: false,
      user: null,
    });
    window.localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common["Frontend-URL"];
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, coins, prices, fiat, logout, blockLists, sitemode, setSiteMode, siteCurrency, setSiteCurrency }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
