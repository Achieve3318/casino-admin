import { LogoutOutlined } from "@ant-design/icons";
import { Badge, Layout, Menu } from "antd";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { USER_ROLE } from "../constants";
import { useAuth } from "../context/AuthContext";
const { Sider } = Layout;

const Navbar = ({ menus = [], isRead, setIsRead }) => {
  const { auth, logout, sitemode } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    // Function to handle window resize
    const handleResize = () => {
      setCollapsed(window.innerWidth < 1150); // Collapse sider if window width is less than 768px
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call the function initially to set the correct state
    handleResize();

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  if (!auth.user) return "";
  return (
    <>
      <Sider
        width={200}
        collapsed={collapsed}
        className="h-full"
        style={{ backgroundColor: "#5995ff"}}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="overflow-y-auto">
            <div className=" text-[2em] text-white p-4 text-center font-bold">
              {collapsed ? (sitemode === "brazil" ? "B" : "G") : (sitemode === "brazil" ? "BICHO" : "GRUPO25")}
            </div>
            <Menu mode="inline" selectedKeys={[location.pathname]}>
              {menus.map(({ label, icon, link, children, role }) => {
                if (
                  auth.user?.role &&
                  role === USER_ROLE.ADMIN &&
                  role !== auth.user.role
                )
                  return "";
                if (children) {
                  return (
                    <Menu.SubMenu key={label} icon={icon} title={label}>
                      {children.map((child, index) =>
                        auth.user?.role &&
                        child.role === USER_ROLE.ADMIN &&
                        child.role !== auth.user.role ? (
                          ""
                        ) : (
                          <Menu.Item
                            key={child.link?child.link:index}
                            icon={child.icon}
                            onClick={() => {
                              navigate(child.link);
                              if(child.label === "Live Support") setIsRead(0);
                            }}
                          >
                            {child.label === "Live Support" && isRead > 0 ? (
                              <Badge size="small" count={isRead} offset={[10,0]} className="text-white">
                                {child.label}
                              </Badge>
                            ) : (
                              child.label
                            )}
                          </Menu.Item>
                        )
                      )}
                    </Menu.SubMenu>
                  );
                }

                return (
                  <Menu.Item
                    key={link}
                    icon={icon}
                    onClick={() => {
                      navigate(link);
                      if(label === "Live Support") setIsRead(0);
                    }}
                  >
                    {label === "Live Support" && isRead > 0 ? (
                      <Badge size="small" count={isRead} offset={[10,0]} className="text-white">
                        {label}
                      </Badge>
                    ) : (
                      label
                    )}
                  </Menu.Item>
                );
              })}
            </Menu>
          </div>
          <div
            className=" cursor-pointer  text-white hover:bg-[#449ff4] pb-5 pt-3 pl-7"
            onClick={() => logout()}
          >
            <LogoutOutlined className="mr-2" />
            {collapsed ? "" : "Logout"}
          </div>
        </div>
      </Sider>
    </>
  );
};

export default Navbar;
