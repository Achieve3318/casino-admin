import {
  LeftOutlined,
  MoreOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Dropdown,
  Input,
  List,
  Modal,
  Skeleton,
  Spin,
  Tooltip,
} from "antd";
import axios from "axios";
import moment from "moment";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import MessageInput from "../../components/common/MessageInput";
import { USER_ROLE } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/socketProvider";
import { postUrl, SUB_SITE } from "../../utility";
import { dateFormat } from "../../utility/date";
import { error } from "../../utility/notification";
import { useSound } from "use-sound";

const tailwindColors = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "gray",
  "stone",
];


const ChatGroupsView = ({ groups = null, selected, onSelect = (f) => f }) => {
  const [filter, setFilter] = useState("");
  
  return (
    <div className="w-full h-full bg-slate-50 py-3 shadow-inner">
      <p className="text-black font-semibold font-sans text-2xl mb-2 ml-5">
        Chats
      </p>
      <p className="p-2">
        <Input
          placeholder="Search users"
          addonBefore={<SearchOutlined />}
          onChange={(e) => setFilter(e.target.value)}
        />
      </p>
      <div className="relative w-full h-[calc(100%-50px)]">
        <List
          className="overflow-y-scroll overflow-hidden h-full"
          loading={groups === null}
          itemLayout="horizontal"
          dataSource={groups ? groups.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) : []}
          renderItem={(group, key) =>
            group.description
              .replace("Private Chat with Support Team for ", "")
              .indexOf(filter) !== -1 ? (
              <div
                className={`transition-all m-2 px-3 rounded-md cursor-pointer hover:bg-slate-200 ${
                  selected === group._id ? "bg-slate-200" : "bg-slate-50"
                }`}
              >
                <List.Item onClick={() => onSelect(group._id, key)}>
                  <Skeleton
                    avatar
                    title={false}
                    loading={groups === null}
                    active
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          className={`bg-${tailwindColors[key % tailwindColors.length]}-200`}
                          src={
                            <UserOutlined
                              className={`text-${tailwindColors[key % tailwindColors.length]}-600`}
                            />
                          }
                        />
                      }
                      title={group.description.replace("Support Team for ", "")}
                      description={
                        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                          {group?.message?.message}
                        </p>
                      }
                    />
                    {group.unRead && (
                      <p className="bg-pink-300 rounded-full text-pink-700 w-8 h-6 flex justify-center items-center text-xs">
                        {Number(group.unRead) < 10
                          ? "0" + group.unRead
                          : group.unRead}
                      </p>
                    )}
                  </Skeleton>
                </List.Item>
              </div>
            ) : (
              ""
            )
          }
        />
      </div>
    </div>
  );
};
const ChatSupport = ({
  messages = null,
  groupInfo = {},
  color = "teal",
  onSend = (f) => f,
  onBack = null,
  disabled = false,
  size = { width: 0, height: 0 },
  offset = { bottom: 0 },
  setRefresh = (f) => f,
}) => {
  const { logout , sitemode } = useAuth();
  const [dropData, setDropData] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (!messages || !messages.length) return;
    // Scroll to the bottom of the chat window
    if (messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // This will run whenever the messages array changes

  const lastMsgs = useMemo(() => {
    if (messages === null) return [];
    const lasts = [];

    messages.forEach((record, id) => {
      if (!lasts.length) {
        lasts.push({ ...record, id });
        return;
      }

      if (
        lasts[lasts.length - 1].user.displayName === record.user.displayName
      ) {
        if (lasts[lasts.length - 1].id === id - 1) {
          lasts.pop();
          lasts.push({ ...record, id });
        }
      } else {
        lasts.push({ ...record, id });
      }
    });

    return lasts.map((msg) => msg._id);
  }, [messages]);

  const handleMenuClick = async ({ key, domEvent }) => {
    if (!dropData) return;
    domEvent.preventDefault();
    if (key === "copy") await navigator.clipboard.writeText(dropData.message);
    else if (key === "delete")
      Modal.confirm({
        title: "Delete message",
        content: "Are you sure you want to delete this message?",
        onOk: () => {
          postUrl(sitemode,
            "/api/chat/deleteMessage",
            { id: dropData._id },
            (data) => {
              if (data.message === "success") {
                setRefresh();
              }
            },
            logout,
          );
        },
        onCancel: () => {},
      });

    setDropData(null);
    // if (key === 'copy')
  };

  const items = [
    { label: "Copy", key: "copy", icon: <i className="fa fa-clone" /> },
    // { label: 'Save', key: 'save', icon: <i className="fa fa-save" />, },
    // { label: 'Reply', key: 'reply', icon: <i className="fa fa-reply" />, },
    { label: "Delete", key: "delete", icon: <i className="fa fa-trash" /> },
  ];
  const menuProps = {
    items,
    onClick: handleMenuClick,
  };
  const menuProps1 = {
    items: items.slice(0, 1),
    onClick: handleMenuClick,
  };

  return (
    <div className="relative w-full h-full">
      <div className="py-2">
        {onBack ? (
          <Button
            icon={<LeftOutlined />}
            onClick={onBack}
            className="border-none shadow-inner hover:shadow-sm"
          ></Button>
        ) : (
          <div className="w-[40px]"></div>
        )}

        <Avatar
          size={"large"}
          className={`ml-5 bg-${color}-200`}
          src={<UserOutlined className={`text-${color}-600`} />}
        />
        <span className="ml-5">
          {(groupInfo.description || "").replace(
            "Private Chat with Support Team for ",
            ""
          )}
        </span>
      </div>

      <div className="relative w-full h-[calc(100%-120px)] border border-solid border-l-0 border-r-0 border-gray-300">
        {messages === null ? (
          <Spin />
        ) : (
          <>
            <div className="overflow-y-scroll overflow-hidden h-full">
              {messages.map((record, index) =>
                record.user.role === USER_ROLE.COMMON ? (
                  <div key={index} className="w-full flex justify-start">
                    <div className="flex items-end">
                      {lastMsgs.indexOf(record._id) !== -1 ? (
                        <div className="w-[60px] flex justify-end">
                          <Avatar
                            size={"large"}
                            className={`bg-${color}-200`}
                            src={
                              <UserOutlined className={`text-${color}-600`} />
                            }
                          />
                        </div>
                      ) : (
                        <div className="w-[60px] h-[10px]"></div>
                      )}
                      <div className="flex items-start m-3">
                        <div className="bg-sky-600 text-white px-5 py-2 rounded-md">
                          {record.deleted === false ? (
                            <p>{record.message}</p>
                          ) : (
                            <p className="font-mono text-gray-400">
                              Deleted Message
                            </p>
                          )}
                          <p className="text-gray-200 text-xs mt-1 flex justify-end items-baseline">
                            <i className="fa fa-clock-o mr-2" />
                            <Tooltip title={dateFormat(record.updatedAt)}>
                              {moment(record.updatedAt).format("hh:mm A")}
                            </Tooltip>
                          </p>
                        </div>
                        {record.deleted === false && (
                          <div className="text-gray-800 hover:bg-gray-100 rounded-md cursor-pointer ml-1 py-1">
                            <Dropdown
                              menu={menuProps1}
                              onClick={() => setDropData(record)}
                              trigger={["click"]}
                            >
                              <MoreOutlined />
                            </Dropdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={index} className="justify-end flex w-full">
                    <div className="flex items-end">
                      <div className="flex items-start m-3">
                        {record.deleted === false && (
                          <div className="text-gray-800 hover:bg-gray-100 rounded-md cursor-pointer ml-1 py-1">
                            <Dropdown
                              menu={menuProps}
                              onClick={() => setDropData(record)}
                              trigger={["click"]}
                            >
                              <MoreOutlined />
                            </Dropdown>
                          </div>
                        )}
                        <div className="bg-slate-50 text-gray-700 px-5 py-2 rounded-md">
                          {record.deleted === false ? (
                            <p>{record.message}</p>
                          ) : (
                            <p className="font-mono text-gray-400">
                              Deleted Message
                            </p>
                          )}
                          <p className="text-gray-400 text-xs mt-1 flex justify-end items-baseline">
                            <i className="fa fa-clock-o mr-2" />
                            <Tooltip title={dateFormat(record.updatedAt)}>
                              {moment(record.updatedAt).format("hh:mm A")}
                            </Tooltip>
                          </p>
                        </div>
                      </div>
                      {lastMsgs.indexOf(record._id) !== -1 ? (
                        <div className="w-[60px] flex justify-start">
                          <Avatar
                            size={"large"}
                            className="mr-5 bg-sky-200"
                            src={<UserOutlined style={{ color: "#075985" }} />}
                          />
                        </div>
                      ) : (
                        <div className="w-[60px] h-[10px]"></div>
                      )}
                    </div>
                  </div>
                ),
              )}
              <div ref={messagesEndRef} />
              <div className="mt-4" />
            </div>
            <button
              className="fixed flex justify-center px-4 py-3 ml-2 hover:bg-black/10 rounded-lg  transition-all z-50"
              style={{
                bottom: `${offset.bottom + size.height - 55}px`,
              }}
              onClick={onBack}
            >
              <i className="fa fa-angle-left" />
            </button>
          </>
        )}
      </div>
      <div className="w-full p-2">
        <div className="flex justify-center bg-gradient-to-t">
          <MessageInput disabled={disabled} onSend={onSend} />
        </div>
      </div>
    </div>
  );
};

export default function LiveSupport() {
  const { socketChat: socket } = useSocket();
  const [groups, setGroups] = useState(null);
  const [selGroupId, setSelGroupId] = useState(-1); // -1 : group view
  const [messageRecords, setMessageRecords] = useState([]);
  const [newMessage, setNewMessage] = useState(null);
  const { logout , sitemode } = useAuth();
  const [refresh, setRefresh] = useReducer((f) => !f);
  const [selGroupColor, setGroupColor] = useState("");
  const [messageSound] = useSound("/message.mp3", {
    preload: true
  });
 

  useEffect(() => {
    if (!socket) return;
    socket.on("receiveGroupChat", (message) => setNewMessage(message));
    socket.on("newSupportGroup", onNewGroup);

    socket.connect();
  }, [socket]);

  useEffect(() => {
    if (selGroupId === -1) {
      axios
        .post(`${SUB_SITE[sitemode]}/api/chat/supportGroups`)
        .then((res) => setGroups(res.data))
        .catch((err) => {
          if ((err.response || {}).status === 401) logout();
          else error(err);
        });
      setMessageRecords(null);
    } else {
      setGroups((gr) =>
        gr.map(({ unRead, _id, ...other }) =>
          _id === selGroupId ? { _id, ...other } : { _id, unRead, ...other },
        ),
      );
      axios
        .post(`${SUB_SITE[sitemode]}/api/chat/groupMessages`, {
          count: 1000,
          start: 0,
          chatId: selGroupId,
        })
        .then((res) => setMessageRecords(res.data))
        .catch((err) => {
          if ((err.response || {}).status === 401) logout();
          else error(err);
        });
    }
  }, [selGroupId, refresh]);

  useEffect(() => {
    if (newMessage) {
      if(newMessage.user.role === "common") messageSound();
      if (selGroupId === newMessage.chatId) {
        setMessageRecords((prev) => [...prev, newMessage]);
      } else {
        setGroups((grs) =>
          grs.map((group) =>
            group._id === newMessage.chatId
              ? { ...group, unRead: Number(group.unRead || 0) + 1 }
              : group,
          ),
        );
      }
      setNewMessage(null);
    }
  }, [newMessage]);

  const onNewGroup = (group) => {
    setGroups((prev) => [...prev, group]);
  };

  const onSend2Group = (message) =>
    socket && socket.emit("sendSupportChat", { message, chatId: selGroupId });

  const handleSelectGroup = (groupid, key) => {
    setSelGroupId(groupid === selGroupId ? -1 : groupid);
    setGroupColor(tailwindColors[key % tailwindColors.length]);
  };

  return (
    <div className="w-full h-[95vh] relative" style={{ padding: "-1rem" }}>
      <div className="hidden md:flex flex-row w-full h-full">
        <div className="w-[30%]">
          <ChatGroupsView
            groups={groups}
            onSelect={handleSelectGroup}
            selected={selGroupId}
          />
        </div>
        {selGroupId !== -1 && (
          <div className="flex-[0.9] transition-all w-full h-full">
            <ChatSupport
              messages={messageRecords}
              onSend={onSend2Group}
              setRefresh={setRefresh}
              color={selGroupColor}
            />
          </div>
        )}
      </div>
      <div className="md:hidden h-full w-full">
        {selGroupId === -1 ? (
          <ChatGroupsView
            groups={groups}
            onSelect={handleSelectGroup}
            selected={selGroupId}
          />
        ) : (
          <ChatSupport
            messages={messageRecords}
            onSend={onSend2Group}
            groupInfo={groups.filter((group) => group._id === selGroupId)[0]}
            onBack={() => setSelGroupId(-1)}
            color={selGroupColor}
            setRefresh={setRefresh}
          />
        )}
      </div>
    </div>
  );
}
