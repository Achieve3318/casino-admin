import React from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import ErrorPage from "../Error";
import Layout from "../pages/Layout";
import Login from "../pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import SiteModeRoute from "./SiteModeRoute";

import { BalanceLog, BonusLog, GameLog, LoginLog, PaymentLog, LotteryBettingHistory, MelateBettingHistory, MelateRetroBettingHistory, ChispazoBettingHistory, Melate1MinBettingHistory, Melate5MinBettingHistory, BichoBettingHistory } from '../pages/History';
import LiveSupport from "../pages/LiveSupport";
import { UserManage } from '../pages/Management';
import { Advertise as ResAds, Coin as ResCoins, Description as ResDesc, SEO as ResSEO, Carousel as ResCarousel, Invite as ResInvite, DashboardPopup as ResDashboardPopup } from "../pages/Resources";
import { BetBonus, LossBonus, LuckyControl, ReferralBonus, VIP } from '../pages/Settings';
import { InternalMove, Subscription, Transaction, Withdrawal } from '../pages/Transactions';

import APILog from '../pages/Apilog';
import ErrorLog from "../pages/Apilog/ErrorLog.js";
import DepositBalanceMng from "../pages/Balance/DepositBalMng/index.js";
import DepositsBalance from "../pages/Balance/Deposits";
import MasterBalance from "../pages/Balance/Master";
import WithdrawalManage from "../pages/Management/WithdrawalManage/index.js";
import Notification from "../pages/Notification";
import PlayingUsers from "../pages/Resources/PlayingUsers/index.js";
import Statistic from "../pages/Statistic";
import Game from "../pages/TGGame/Game/index.js";
import Setting from "../pages/TGGame/Settings/index.js";
import TGStatistic from "../pages/TGGame/Statistic/index.js";
import User from "../pages/TGGame/User/index.js";
import Cattea from "../pages/TGGame/Cattea/index.js";
import TotalBalanceLog from "../pages/History/TotalBalanceLog/index.js";
import TotalGameLog from "../pages/History/TotalGameLog/index.js";
import LiveChatSystem from "../pages/Management/LiveChatSystem/index.js";
import BonusDetail from "../pages/Resources/BonusDetail/index.js";
import BonusCard from "../pages/Management/BonusCard/index.js";
import ReferVIP from "../pages/Settings/ReferralBonus/ReferVIP.js";
import LiveSlots from "../pages/Resources/LiveSlots/index.js";
import LotteryManage from "../pages/Management/LotteryManage/index.js";
import MelateManage from "../pages/Management/MelateManage/index.js";
import MelateRetroManage from "../pages/Management/MelateRetroManage/index.js";
import ChispazoManage from "../pages/Management/ChispazoManage/index.js";
import Melate1MinManage from "../pages/Management/Melate1MinManage/index.js";
import Melate5MinManage from "../pages/Management/Melate5MinManage/index.js";
import BichoManage from "../pages/Management/BichoManage/index.js";
import LotteryHolidays from "../pages/Management/LotteryHolidays/index.js";
import FiatDepositLog from "../pages/History/FiatDepositLog/index.js";
import BonusSetting from "../pages/Settings/BonusSetting/index.js";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Navigate to="/login" />,
      },
      {
        path: "login",
        element: <Login />,
      },
      // {
      //   path: "register",
      //   element: <Register />,
      // },
      {
        path: "",
        element: <Layout />,
        children: [
          {
            path: "livesupport",
            element: (
              <ProtectedRoute>
                <LiveSupport />
              </ProtectedRoute>
            ),
          },
          {
            path: "notification",
            element: (
              <ProtectedRoute>
                <Notification />
              </ProtectedRoute>
            ),
          },
          {
            path: "statistic",
            element: (
              <ProtectedRoute>
                <Statistic />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "settings",
        element: <Layout />,
        children: [
          {
            path: "lucky",
            element: (
              <ProtectedRoute>
                <LuckyControl />
              </ProtectedRoute>
            ),
          },
          {
            path: "referral",
            element: (
              <ProtectedRoute>
                <ReferralBonus />
              </ProtectedRoute>
            ),
          },
          {
            path: "referral-vip",
            element: (
              <ProtectedRoute>
                <ReferVIP />
              </ProtectedRoute>
            ),
          },
          {
            path: "loss",
            element: (
              <ProtectedRoute>
                <LossBonus />
              </ProtectedRoute>
            ),
          },
          {
            path: "bet",
            element: (
              <ProtectedRoute>
                <BetBonus />
              </ProtectedRoute>
            ),
          },
          {
            path: "vip",
            element: (
              <ProtectedRoute>
                <VIP />
              </ProtectedRoute>
            ),
          },
          {
            path: "lottery",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <LotteryManage />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
          {
            path: "bicho",
            element: (
              <ProtectedRoute>
                <BichoManage />
              </ProtectedRoute>
            ),
          },
          {
            path: "bonus",
            element: (
              <ProtectedRoute>
                <BonusSetting />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "/wallet",
        element: (
          <Layout />
        ),
        children: [
          {
            path: "master",
            element: (
              <ProtectedRoute>
                <MasterBalance />
              </ProtectedRoute>
            ),
          },
          {
            path: "deposits",
            element: (
              <ProtectedRoute>
                <DepositsBalance />
              </ProtectedRoute>
            ),
          },
          {
            path: "transaction",
            element: (
              <ProtectedRoute>
                <Transaction />
              </ProtectedRoute>
            ),
          },
          {
            path: "subscription",
            element: (
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            ),
          },
          {
            path: "withdrawal",
            element: (
              <ProtectedRoute>
                <Withdrawal />
              </ProtectedRoute>
            ),
          },
          {
            path: "internal-move",
            element: (
              <ProtectedRoute>
                <InternalMove />
              </ProtectedRoute>
            ),
          },
        ]
      },
      {
        path: "history",
        element: <Layout />,
        children: [
          {
            path: "total-game",
            element: (
              <ProtectedRoute>
                <TotalGameLog />
              </ProtectedRoute>
            ),
          },
          {
            path: "game",
            element: (
              <ProtectedRoute>
                <GameLog />
              </ProtectedRoute>
            ),
          },
          {
            path: "total-balance",
            element: (
              <ProtectedRoute>
                <TotalBalanceLog />
              </ProtectedRoute>
            ),
          },
          {
            path: "balance",
            element: (
              <ProtectedRoute>
                <BalanceLog />
              </ProtectedRoute>
            ),
          },
          {
            path: "bonus",
            element: (
              <ProtectedRoute>
                <BonusLog />
              </ProtectedRoute>
            ),
          },
          {
            path: "payment",
            element: (
              <ProtectedRoute>
                <PaymentLog />
              </ProtectedRoute>
            ),
          },
          {
            path: "fiat-deposit",
            element: (
              <ProtectedRoute>
                <FiatDepositLog />
              </ProtectedRoute>
            ),
          },
          {
            path: "login",
            element: (
              <ProtectedRoute>
                <LoginLog />
              </ProtectedRoute>
            ),
          },
          {
            path: "apilog",
            element: (<ProtectedRoute><APILog /></ProtectedRoute>)
          },
          {
            path: "error",
            element: (<ProtectedRoute><ErrorLog /></ProtectedRoute>)
          },
          {
            path: "lottery-betting",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <LotteryBettingHistory />
                </ProtectedRoute>
              </SiteModeRoute>
            )
          },
          {
            path: "melate-betting",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <MelateBettingHistory />
                </ProtectedRoute>
              </SiteModeRoute>
            )
          },
          {
            path: "melate-retro-betting",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <MelateRetroBettingHistory />
                </ProtectedRoute>
              </SiteModeRoute>
            )
          },
          {
            path: "chispazo-betting",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <ChispazoBettingHistory />
                </ProtectedRoute>
              </SiteModeRoute>
            )
          },
          {
            path: "melate-1min-betting",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <Melate1MinBettingHistory />
                </ProtectedRoute>
              </SiteModeRoute>
            )
          },
          {
            path: "melate-5min-betting",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <Melate5MinBettingHistory />
                </ProtectedRoute>
              </SiteModeRoute>
            )
          },
          {
            path: "bicho-betting",
            element: (
              <ProtectedRoute>
                <BichoBettingHistory />
              </ProtectedRoute>
            )
          }
        ],
      },
      {
        path: "management",
        element: <Layout />,
        children: [
          {
            path: "user",
            element: (
              <ProtectedRoute>
                <UserManage />
              </ProtectedRoute>
            ),
          },
          {
            path: "card",
            element: (
              <ProtectedRoute>
                <BonusCard />
              </ProtectedRoute>
            ),
          },
          {
            path: "wallet",
            element: (
              <ProtectedRoute>
                <DepositBalanceMng />
              </ProtectedRoute>
            ),
          },
          {
            path: "withdrawal",
            element: (
              <ProtectedRoute>
                <WithdrawalManage />
              </ProtectedRoute>
            ),
          },
          {
            path: "livechat",
            element: (
              <ProtectedRoute>
                <LiveChatSystem />
              </ProtectedRoute>
            ),
          },
          {
            path: "lottery",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <LotteryManage />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
          {
            path: "bicho",
            element: (
              <ProtectedRoute>
                <BichoManage />
              </ProtectedRoute>
            ),
          },
          {
            path: "lottery-holidays",
            element: (
              <ProtectedRoute>
                <LotteryHolidays />
              </ProtectedRoute>
            ),
          },
          {
            path: "melate",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <MelateManage />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
          {
            path: "melate-retro",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <MelateRetroManage />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
          {
            path: "chispazo",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <ChispazoManage />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
          {
            path: "melate-1min",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <Melate1MinManage />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
          {
            path: "melate-5min",
            element: (
              <SiteModeRoute allowedModes={["mx","cop"]}>
                <ProtectedRoute>
                  <Melate5MinManage />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
        ],
      },
      {
        path: "resources",
        element: <Layout />,
        children: [
          {
            path: "description",
            element: (
              <ProtectedRoute>
                <ResDesc />
              </ProtectedRoute>
            ),
          },
          {
            path: "seo",
            element: (
              <ProtectedRoute>
                <ResSEO />
              </ProtectedRoute>
            ),
          },
          {
            path: "carousel",
            element: (
              <ProtectedRoute>
                <ResCarousel />
              </ProtectedRoute>
            ),
          },
          {
            path: "advertise",
            element: (
              <ProtectedRoute>
                <ResAds />
              </ProtectedRoute>
            ),
          },
          {
            path: "invite",
            element: (
              <ProtectedRoute>
                <ResInvite />
              </ProtectedRoute>
            ),
          },
          {
            path: "dashboard-popup",
            element: (
              <ProtectedRoute>
                <ResDashboardPopup />
              </ProtectedRoute>
            ),
          },
          {
            path: "bonus-detail",
            element: (
              <ProtectedRoute>
                <BonusDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: "coin",
            element: (
              <ProtectedRoute>
                <ResCoins />
              </ProtectedRoute>
            ),
          },
          {
            path: "playing-users",
            element: (
              <ProtectedRoute><PlayingUsers /></ProtectedRoute>
            ),
          },
          {
            path: "liveslot",
            element: (
              <ProtectedRoute><LiveSlots /></ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "tg-game",
        element: <Layout />,
        children: [
          {
            path: "user",
            element: (
              <SiteModeRoute allowedModes={["betwallet"]}>
                <ProtectedRoute>
                  <User />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
          {
            path: "game",
            element: (
              <SiteModeRoute allowedModes={["betwallet"]}>
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
          {
            path: "game-setting",
            element: (
              <SiteModeRoute allowedModes={["betwallet"]}>
                <ProtectedRoute>
                  <Setting />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
          {
            path: "statistic",
            element: (
              <SiteModeRoute allowedModes={["betwallet"]}>
                <ProtectedRoute>
                  <TGStatistic />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
          {
            path: "cattea",
            element: (
              <SiteModeRoute allowedModes={["betwallet"]}>
                <ProtectedRoute>
                  <Cattea />
                </ProtectedRoute>
              </SiteModeRoute>
            ),
          },
        ],
      },
    ],
  },
]);

export default router;