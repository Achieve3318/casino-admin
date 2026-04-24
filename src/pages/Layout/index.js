import {
  UsergroupAddOutlined,
  AimOutlined,
  ApiOutlined,
  AppleOutlined,
  AreaChartOutlined,
  BankOutlined,
  BellOutlined,
  CompressOutlined,
  DeploymentUnitOutlined,
  DollarCircleOutlined,
  EllipsisOutlined,
  FileDoneOutlined,
  GlobalOutlined,
  HddOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MessageOutlined,
  MutedOutlined,
  NotificationFilled,
  SearchOutlined,
  SettingOutlined,
  UserAddOutlined,
  UserOutlined,
  WalletOutlined,
  ExceptionOutlined,
  ControlOutlined,
  TagsOutlined,
  GoogleOutlined,
  BoldOutlined,
  UserSwitchOutlined,
  TransactionOutlined,
  BookOutlined,
  DownloadOutlined,
  InteractionOutlined,
  CreditCardOutlined,
  PartitionOutlined,
  DollarCircleFilled,
  SplitCellsOutlined,
  GiftOutlined,
  TagsFilled,
  CrownFilled,
  RocketOutlined
} from "@ant-design/icons";
import { Badge, Menu } from "antd";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useSocket } from "../../context/socketProvider";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { USER_ROLE } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import useSound from "use-sound";
import DisplayTime from "../DisplayTime";

const getMenus = (sitemode) => [
  {
    label: "Management",
    icon: <GlobalOutlined />,
    link: "/management",
    role: USER_ROLE.SUPPORT,
    children: [
      {
        label: "User Manage",
        icon: <UsergroupAddOutlined />,
        link: "/management/user",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "Wallet Management",
        icon: <CreditCardOutlined />,
        link: "/management/wallet",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Withdrawal Management",
        icon: <ExceptionOutlined />,
        link: "/management/withdrawal",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "Bonus Card Management",
        icon: <WalletOutlined />,
        link: "/management/card",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "LiveChat System",
        icon: <MessageOutlined />,
        link: "/management/livechat",
        role: USER_ROLE.ADMIN,
      },
      ...(sitemode === "mx" || sitemode === "cop" ? [
        {
          label: "Lottery Management",
          icon: <RocketOutlined />,
          link: "/management/lottery",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Melate Management",
          icon: <RocketOutlined />,
          link: "/management/melate",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Melate Retro Management",
          icon: <RocketOutlined />,
          link: "/management/melate-retro",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Chispazo Management",
          icon: <RocketOutlined />,
          link: "/management/chispazo",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Melate 1min Management",
          icon: <RocketOutlined />,
          link: "/management/melate-1min",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Melate 5min Management",
          icon: <RocketOutlined />,
          link: "/management/melate-5min",
          role: USER_ROLE.ADMIN,
        },

      ] : []),
      ...(sitemode === "brazil" || sitemode === "grupo25" ? [
        {
          label: "Bicho Management",
          icon: <RocketOutlined />,
          link: "/management/bicho",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Lottery Holidays (Quina & Seninha)",
          icon: <RocketOutlined />,
          link: "/management/lottery-holidays",
          role: USER_ROLE.ADMIN,
        }
      ] : []),
    ],
  },
  {
    label: "Resources",
    icon: <HddOutlined />,
    link: "/resources",
    role: USER_ROLE.SUPPORT,
    children: [
      {
        label: "Description",
        icon: <FileDoneOutlined />,
        link: "/resources/description",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "SEO",
        icon: <SearchOutlined />,
        link: "/resources/seo",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Carousel",
        icon: <SplitCellsOutlined />,
        link: "/resources/carousel",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Advertise",
        icon: <MutedOutlined />,
        link: "/resources/advertise",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Dashboard Popup",
        icon: <MutedOutlined />,
        link: "/resources/dashboard-popup",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Invite",
        icon: <UserOutlined />,
        link: "/resources/invite",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Bonus Detail",
        icon: <GiftOutlined />,
        link: "/resources/bonus-detail",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Coin",
        icon: <i className="fa fa-bitcoin" />,
        link: "/resources/coin",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "Notification",
        icon: <NotificationFilled />,
        link: "/notification",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Playing Users",
        icon: <UserOutlined />,
        link: "/resources/playing-users",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "Live & Slots",
        icon: <CrownFilled />,
        link: "/resources/liveslot",
        role: USER_ROLE.ADMIN
      }
    ],
  },
  // {
  //   label: "Live Support",
  //   icon: <MessageOutlined />,
  //   link: "/livesupport",
  //   role: USER_ROLE.SUPPORT,
  // },
  {
    label: "Game Settings",
    icon: <ControlOutlined />,
    link: "/settings",
    role: USER_ROLE.SUPPORT,
    children: [
      {
        label: "Lucky Control",
        icon: <SettingOutlined />,
        link: "/settings/lucky",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "Referral",
        icon: <DeploymentUnitOutlined />,
        link: "/settings/referral",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Referral-VIP",
        icon: <TagsFilled />,
        link: "/settings/referral-vip",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Loss",
        icon: <BellOutlined />,
        link: "/settings/loss",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Bet",
        icon: <CompressOutlined />,
        link: "/settings/bet",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "VIP",
        icon: <TagsOutlined />,
        link: "/settings/vip",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Bonus Setting",
        icon: <GiftOutlined />,
        link: "/settings/bonus",
        role: USER_ROLE.SUPPORT,
      }
    ],
  },
  {
    label: "Logs",
    icon: <HistoryOutlined />,
    link: "/history",
    role: USER_ROLE.SUPPORT,
    children: [
      {
        label: "Total Game Log",
        icon: <GoogleOutlined />,
        link: "/history/total-game",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Game Log",
        icon: <GoogleOutlined />,
        link: "/history/game",
        role: USER_ROLE.SUPPORT,
      },
      ...(sitemode === "mx" ? [
        {
          label: "Lottery Betting History",
          icon: <RocketOutlined />,
          link: "/history/lottery-betting",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Melate Betting History",
          icon: <RocketOutlined />,
          link: "/history/melate-betting",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Melate Retro Betting History",
          icon: <RocketOutlined />,
          link: "/history/melate-retro-betting",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Melate 1min Betting History",
          icon: <RocketOutlined />,
          link: "/history/melate-1min-betting",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Melate 5min Betting History",
          icon: <RocketOutlined />,
          link: "/history/melate-5min-betting",
          role: USER_ROLE.ADMIN,
        },
        {
          label: "Chispazo Betting History",
          icon: <RocketOutlined />,
          link: "/history/chispazo-betting",
          role: USER_ROLE.ADMIN,
        }
      ] : []),
      ...(sitemode === "brazil" || sitemode === "grupo25" ? [
        {
          label: "Bicho Betting History",
          icon: <RocketOutlined />,
          link: "/history/bicho-betting",
          role: USER_ROLE.ADMIN,
        }
      ] : []),
      {
        label: "Total Balance Log",
        icon: <DollarCircleFilled />,
        link: "/history/total-balance",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Balance Log",
        icon: <DollarCircleOutlined />,
        link: "/history/balance",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Bonus Log",
        icon: <BoldOutlined />,
        link: "/history/bonus",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "Payment Log",
        icon: <BankOutlined />,
        link: "/history/payment",
        role: USER_ROLE.SUPPORT,
      },
      ...(sitemode !== "betwallet" ? [{
        label: "Fiat Deposit Log",
        icon: <BankOutlined />,
        link: "/history/fiat-deposit",
        role: USER_ROLE.SUPPORT,
      }] : []),
      {
        label: "Login Log",
        icon: <UserSwitchOutlined />,
        link: "/history/login",
        role: USER_ROLE.SUPPORT,
      },
      {
        label: "API Log",
        icon: <ApiOutlined />,
        link: "/history/apilog",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "Error Log",
        icon: <AimOutlined />,
        link: "/history/error",
        role: USER_ROLE.ADMIN,
      },

    ],
  },
  {
    label: "Statistic",
    icon: <AreaChartOutlined />,
    link: "/statistic",
    role: USER_ROLE.ADMIN,
  },
  ...(sitemode === "betwallet" ? [{
    label: "TG Games",
    icon: <i className="fa fa-telegram" />,
    link: "/tg-game",
    role: USER_ROLE.ADMIN,
    children: [
      {
        label: "HashBet Users",
        icon: <UserOutlined />,
        link: "/tg-game/user",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "HashBet Setting",
        icon: <i className="fa fa-cog" />,
        link: "/tg-game/game-setting",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "HashBet",
        icon: <i className="fa fa-gamepad" />,
        link: "/tg-game/game",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "HashBet Statistic",
        icon: <i className="fa fa-bar-chart" />,
        link: "/tg-game/statistic",
        role: USER_ROLE.ADMIN,
      },
      {
        label: "WagerCat",
        icon: <i className="fa fa-coffee" />,
        link: "/tg-game/cattea",
        role: USER_ROLE.ADMIN,
      },
    ],
  }] : []),
];

const Layout = () => {
  const { auth, logout, sitemode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRead, setIsRead] = useState(0);
  const { socketChat: socket } = useSocket();
  const [messageSound] = useSound("/message.mp3", {
    preload: true,
  });
  useEffect(() => {
    if (!socket) return;
    socket.on("receiveGroupChat", (message) => {
      if (message.user.role === "common") {
        setIsRead((prev) => prev + 1);
      }
    });

    socket.connect();

    return () => {
      socket.off("receiveGroupChat");
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (isRead > 0) {
      console.log(isRead);
      console.log(messageSound);

      messageSound();
    }
  }, [isRead])

  const menus = getMenus(sitemode);

  return (
    <div className="h-[100vh] overflow-hidden flex w-full ">
      <div className="md:block hidden">
        <Navbar menus={menus} isRead={isRead} setIsRead={setIsRead} />
      </div>
      <div className="w-full px-3 md:h-[100vh] h-[95vh] overflow-y-auto">
        <DisplayTime />
        <Outlet />
      </div>
      <Menu
        selectedKeys={[location.pathname]}
        mode="horizontal"
        className="absolute bottom-0 w-full md:hidden flex justify-center"
        overflowedIndicator={<EllipsisOutlined />}
      >
        {menus.map(({ label, icon, link, children, role }) => {
          if (
            auth.user?.role &&
            role === USER_ROLE.ADMIN &&
            role !== auth.user.role
          )
            return "";
          if (children) {
            return (
              <Menu.SubMenu key={label} icon={icon}>
                {children.map((child, index) =>
                  auth.user?.role &&
                    child.role === USER_ROLE.ADMIN &&
                    child.role !== auth.user.role ? (
                    ""
                  ) : (
                    <Menu.Item
                      key={child.link}
                      icon={child.icon}
                      onClick={() => navigate(child.link)}
                    >
                      {child.label}
                    </Menu.Item>
                  )
                )}
              </Menu.SubMenu>
            );
          }

          return (
            <Menu.Item key={link} icon={icon} onClick={() => {
              navigate(link);
              setIsRead(0);
            }}>
              {label === "Live Support" && isRead > 0 ? (
                <Badge
                  size="small"
                  count={isRead}
                  className="text-white absolute"
                  offset={[-10, 0]}
                ></Badge>
              ) : (
                ""
              )}
            </Menu.Item>
          );
        })}
        <Menu.Item
          onClick={() => {
            logout();
          }}
        >
          <LogoutOutlined />
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default Layout;
