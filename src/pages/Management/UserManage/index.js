import React, {
  Button,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  notification,
} from "antd";
import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import AddUserModal from "../../../components/AddUserModal";
import BalanceModal from "../../../components/BalanceModal";
import EditRoleModal from "../../../components/RoleEditModal";
import { USER_ROLE } from "../../../constants";
import { useAuth } from "../../../context/AuthContext";
import { postUrl } from "../../../utility";
import { dateFormat } from "../../../utility/date";
import { error, success, warning } from "../../../utility/notification";
import { getFilterColumns } from "../../../utility/table";
import RefferalUsers from "./RefferalUsers";
import BlackList from "./BlackList";

const { confirm } = Modal;

const pageSizeOptions = [10, 20, 50, 100];


const UserManage = () => {
  const [refresh, setRefresh] = useReducer((f) => !f, false);
  const [editRoleModal, setEditRoleModal] = useState({
    open: false,
    data: null,
  });
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [balanceModal, setBalanceModal] = useState({ open: false });
  const [data, setData] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [role, setRole] = useState(null);
  const [whiteVisible, setWhiteVisible] = useState(false);
  const [editWhiteData, setEditWhiteData] = useState([""]);
  const [editInfoVisible, setEditInfoVisible] = useState(false);
  const [editInfoUserId, setEditInfoUserId] = useState(null);
  const [editInfoForm, setEditInfoForm] = useState({
    displayName: "",
    username: "",
    email: "",
    phone: "",
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const { logout, blockLists, sitemode } = useAuth();

  const _columns = getFilterColumns([
    {
      title: "Email",
      dataIndex: "email",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      width: "5em",
      render: (v, record) => (
        <>
          {!record.isVerified ? (
            <span className="text-red-500">{record.email}</span>
          ) : (
            <span>{record.email}</span>
          )}
        </>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      width: "6em",
      render: (v, record) => (
        <>
          {!record.isPhoneVerified ? (
            <span className="text-red-500">{record.phone}</span>
          ) : (
            <span>{record.phone}</span>
          )}
        </>
      ),
    },
    {
      title: "Display",
      dataIndex: "displayName",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      width: "8em",
    },
    {
      title: "Username",
      dataIndex: "username",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      render: (v, record) => (
        <>
          {blockLists.find((item) => item.username === record.username) ? (
            <span className="text-red-500">{record.username}</span>
          ) : (
            <span>{record.username}</span>
          )}
        </>
      ),
      width: "8em",
    },
    {
      title: "IP",
      dataIndex: "ip",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      width: "8em",
    },
    {
      title: "Near",
      dataIndex: "geo",
      className: "text-xs sm:text-sm md:text-base",
      render: (geo) => (geo ? geo.country + ", " + geo.city : ""),
      align: "center",
    },
    {
      title: "Role",
      dataIndex: "role",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base capitalize",
      filters: [
        { text: "Administrator", value: "admin" },
        { text: "Support", value: "support" },
        { text: "User", value: "common" },
        { text: "Chat Support", value: "chatsupport" },
      ],
      width: "10em",
    },
    {
      title: "Balance",
      dataIndex: "balance",
      width: "7em",
      className: "text-xs sm:text-sm md:text-base text-right",
      align: "center",
    },
    {
      title: " WhiteList IP",
      dataIndex: "whitelistedIPs",
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",

      render: (v) => (
        <>
          {v?.map((item, index) => {
            if (index < 3) {
              return <div key={index}>{item === "***" ? "Any" : item}</div>;
            }
            return "";
          })}
          {v?.length > 3 && <div>...</div>}
        </>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      className: "text-xs sm:text-sm md:text-base text-right",
      render: (data) => dateFormat(data),
      align: "center",
      width: "12em",
    },
    {
      title: "Disable",
      dataIndex: "disabled",
      className: "text-xs sm:text-sm md:text-base text-right",
      render: (data) => (data ? <Tag color="red">Restricted</Tag> : ""),
      align: "center",
      width: "6em",
    },
    {
      title: "New User Boost",
      dataIndex: "hasReceivedNewUserBoost",
      className: "text-xs sm:text-sm md:text-base text-right",
      render: (data) => (
        data ? (
          <Tag color="orange">Received</Tag>
        ) : (
          <Tag color="green">Eligible</Tag>
        )
      ),
      align: "center",
      width: "8em",
    },
  ]);

  const [tableParams, setTableParams] = useState({
    pagination: {
      size: "default",
      current: 1,
      pageSize: pageSizeOptions[0],
      total: 0,
      pageSizeOptions,
      showQuickJumper: true,
      showSizeChanger: true,
    },
    changed: false,
    filters: {},
    sorter: {},
  });

  const fetchDataCount = useCallback(() => {
    postUrl(sitemode,
      "/api/user/getUsersPagiCount",
      {
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (res) =>
        setTableParams((prev) => ({
          ...prev,
          pagination: { ...prev.pagination, total: res },
        })),
      logout
    );
  }, [tableParams.changed]);

  const fetchData = useCallback(() => {
    setData(null);
    postUrl(sitemode,
      "/api/user/getUsersPagi",
      {
        page: tableParams.pagination.current - 1,
        pageSize: tableParams.pagination.pageSize,
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (res) => setData(res),
      logout
    );
  }, [tableParams.changed]);

  useEffect(() => {
    fetchDataCount();
  }, [fetchDataCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refresh]);

  const handleTableChange = useCallback(
    debounce((pagination, filters, sorter) => {
      setTableParams({
        ...tableParams,
        changed: !tableParams.changed,
        pagination,
        filters,
        sorter,
      });
    }, 300),
    [tableParams]
  );

  const openBalances = (username) => setBalanceModal({ username, open: true });
  const closeBalances = () => setBalanceModal({ open: false });
  const closeEditRoleModal = () => setEditRoleModal({ open: false });
  const onChangeWhiteList = () => {
    postUrl(sitemode,
      "/api/user/update",
      {
        id: selectedId,
        whitelistedIPs: editWhiteData.slice(0, editWhiteData.length - 1),
      },
      (data) => {
        if (data?.message !== "success") return;
        notification.success({
          message: "Success",
          description: "Operation Successfully proceed",
        });
        setRefresh();
        setWhiteVisible(false);
        setEditWhiteData([""]);
      },
      logout
    );
  };
  const onChangeRole = () => {
    postUrl(sitemode,
      "/api/user/update",
      {
        id: editId,
        role,
      },
      (data) => {
        if (data?.message !== "success") return;
        notification.success({
          message: "Success",
          description: "Operation Successfully proceed",
        });
        setRefresh();
      },
      logout
    );
  };

  const columns = useMemo(
    () =>
      _columns.map((col) =>
        col.dataIndex === "role"
          ? {
            ...col,
            render: (item, data) => (
              <div className="flex justify-between px-2">
                {editId === data._id ? (
                  <>
                    <Select
                      className="w-[100px]"
                      value={role}
                      onChange={(e) => {
                        setRole(e);
                      }}
                    >
                      <Select.Option key="admin" value="admin">
                        Admin
                      </Select.Option>
                      <Select.Option key="support" value="support">
                        Support
                      </Select.Option>
                      <Select.Option key="common" value="common">
                        Common
                      </Select.Option>
                      <Select.Option key="chatSupport" value="chatSupport">
                        Chat Support
                      </Select.Option>
                    </Select>
                    <a
                      onClick={() => {
                        onChangeRole();
                        setEditId(null);
                      }}
                    >
                      <i className="fa fa-save" />
                    </a>
                  </>
                ) : (
                  <>
                    {item}
                    <a
                      onClick={() => {
                        setEditId(data._id);
                        setRole(item);
                      }}
                    >
                      <i className="fa fa-edit" />
                    </a>
                  </>
                )}
              </div>
            ),
          }
          : col.title === "Balance"
            ? {
              ...col,
              render: (_, all) => (
                <a onClick={() => openBalances(all.username)}>View</a>
              ),
            }
            : col.dataIndex === "whitelistedIPs"
              ? {
                ...col,
                onCell: (record, rowIndex) => {
                  return {
                    onClick: (event) => {
                      if (
                        record.role === USER_ROLE.ADMIN ||
                        record.role === USER_ROLE.SUPPORT
                      ) {
                        setSelectedId(record._id);
                        setEditWhiteData([...(record?.whitelistedIPs || []), ""]);
                        setWhiteVisible(true);
                      }
                    },
                  };
                },
              }
              : col
      ),
    [editId, role]
  );

  const handleAddUser = () => setAddModalVisible(true);

  const handleResetPassword = () => {
    if (selectedRowKeys.length === 0) return warning("You have to select user");
    if (selectedRowKeys.length > 1)
      return warning("You have to select one user");

    const records = (data || []).filter(
      ({ _id }) => _id === selectedRowKeys[0]
    );
    if (records.length)
      postUrl(sitemode,
        "/api/user/passwordReset",
        { username: records[0].username },
        (data) => {
          success(data.message);
        },
        logout,
        (err) => {
          error(err);
        }
      );
  };
  const handleResetWithdrawPassword = () => {
    if (selectedRowKeys.length === 0) return warning("You have to select user");
    if (selectedRowKeys.length > 1)
      return warning("You have to select one user");
    const records = (data || []).filter(
      ({ _id }) => _id === selectedRowKeys[0]
    );
    if (records.length)
      postUrl(sitemode,
        "/api/user/withdrawPasswordReset",
        { username: records[0].username },
        (data) => {
          success(data.message);
        },
        logout,
        (err) => {
          error(err);
        }
      );
  };
  const handleDisableUsers = (disabled = true) => {
    if (selectedRowKeys.length === 0)
      return warning("You have to select users");

    confirm({
      title: "Do you want to make disable these users?",
      content: "Once disabled, the items cannot be recovered.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        postUrl(sitemode,
          "/api/user/disableUsers",
          { ids: selectedRowKeys, disabled },
          (data) => {
            if (data.message === "success") {
              success("You make disabled " + selectedRowKeys.length + " users");
              setRefresh();
            }
          }
        );
      },
      onCancel() { },
    });
  };

  const resetBankNumber = () => {
    if (selectedRowKeys.length === 0) return warning("You have to select user");
    if (selectedRowKeys.length > 1)
      return warning("You have to select one user");
    const records = (data || []).filter(
      ({ _id }) => _id === selectedRowKeys[0]
    );
    if (records.length)
    postUrl(sitemode,
        "/api/transactions/withdrawal/resetBankNumber",
        { username: records[0].username },
        () => {
            success("Bank number reset successfully!");
            fetchDataCount()
            fetchData()
        }, logout);
}

  const handleDeleteUsers = () => {
    if (selectedRowKeys.length === 0)
      return warning("You have to select users");

    confirm({
      title: "Do you want to delete these items?",
      content: "Once deleted, the items cannot be recovered.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        postUrl(sitemode, "/api/user/deleteUsers", { ids: selectedRowKeys }, (data) => {
          if (data.message === "success") {
            success("You have deleted " + selectedRowKeys.length + "users");
            setRefresh();
          }
        });
      },
      onCancel() { },
    });
  };

  const handleEditUserInfo = () => {
    if (selectedRowKeys.length === 0) return warning("You have to select user");
    if (selectedRowKeys.length > 1)
      return warning("You have to select one user");

    const records = (data || []).filter(
      ({ _id }) => _id === selectedRowKeys[0]
    );

    if (!records.length) return;

    const user = records[0];

    setEditInfoUserId(user._id);
    setEditInfoForm({
      displayName: user.displayName || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setEditInfoVisible(true);
  };

  const handleSaveUserInfo = () => {
    if (!editInfoUserId) return;

    postUrl(
      sitemode,
      "/api/user/update",
      {
        id: editInfoUserId,
        displayName: editInfoForm.displayName,
        username: editInfoForm.username,
        email: editInfoForm.email,
        phone: editInfoForm.phone,
      },
      (data) => {
        if (data?.message !== "NOTIFICATIONS.success.Updated") return;
        notification.success({
          message: "Success",
          description: "User information updated successfully",
        });
        setEditInfoVisible(false);
        setEditInfoUserId(null);
        setRefresh();
      },
      logout
    );
  };

  return (
    <div className="mt-4">
      <div className="hidden md:flex md:justify-end mb-3 ">
        <Button.Group>
          <Button
            color="primary"
            variant="solid"
            icon={<i className="fa fa-plus"></i>}
            onClick={handleAddUser}
          >
            Add
          </Button>

          <Button
            color="default"
            variant="outlined"
            icon={<i className="fa fa-user-edit"></i>}
            onClick={handleEditUserInfo}
          >
            Update Info
          </Button>
          <Button
            color="purple"
            variant="solid"
            icon={<i className="fa fa-key"></i>}
            onClick={handleResetPassword}
          >
            Password Reset
          </Button>
          <Button
            color="orange"
            variant="outlined"
            icon={<i className="fa fa-key"></i>}
            onClick={handleResetWithdrawPassword}
          >
            Withdrawal Password Reset
          </Button>
          <Button
            color="primary"
            variant="outlined"
            icon={<i className="fa fa-refresh"></i>}
            onClick={() => resetBankNumber()}
          >
            Reset Bank Number
          </Button>
          <Button
            color="danger"
            variant="outlined"
            icon={<i className="fa fa-user-times"></i>}
            onClick={() => handleDisableUsers(true)}
          >
            Disable
          </Button>
          <Button
            color="green"
            variant="solid"
            icon={<i className="fa fa-user"></i>}
            onClick={() => handleDisableUsers(false)}
          >
            Enable
          </Button>
          <Button
            color="pink"
            variant="solid"
            icon={<i className="fa fa-trash"></i>}
            onClick={handleDeleteUsers}
          >
            Delete
          </Button>
        </Button.Group>
      </div>
      <div className="flex flex-col justify-end items-end gap-1 mb-3 md:hidden">
        <Button.Group>
          <Button
            color="primary"
            variant="solid"
            icon={<i className="fa fa-plus"></i>}
            onClick={handleAddUser}
          >
            Add
          </Button>
          <Button
            color="purple"
            variant="outlined"
            icon={<i className="fa fa-key"></i>}
            onClick={handleResetPassword}
          >
            Password Reset
          </Button>
          <Button
            color="default"
            variant="outlined"
            icon={<i className="fa fa-user-edit"></i>}
            onClick={handleEditUserInfo}
          >
            Update Info
          </Button>

        </Button.Group>
        <Button
          color="orange"
          variant="outlined"
          icon={<i className="fa fa-key"></i>}
          onClick={handleResetWithdrawPassword}
        >
          Withdrawal Password Reset
        </Button>
        <Button
          color="primary"
          variant="outlined"
          icon={<i className="fa fa-refresh"></i>}
          onClick={() => resetBankNumber()}
        >
          Reset Bank Number
        </Button>
        <Button.Group>
          <Button
            color="danger"
            variant="outlined"
            icon={<i className="fa fa-user-times"></i>}
            onClick={() => handleDisableUsers(true)}
          >
            Disable
          </Button>
          <Button
            color="green"
            variant="outlined"
            icon={<i className="fa fa-user"></i>}
            onClick={() => handleDisableUsers(false)}
          >
            Enable
          </Button>
          <Button
            color="pink"
            variant="outlined"
            icon={<i className="fa fa-trash"></i>}
            onClick={handleDeleteUsers}
          >
            Delete
          </Button>
        </Button.Group>
      </div>
      <Table
        size="small"
        scroll={{ x: "auto" }}
        bordered
        columns={columns}
        rowKey={(record) => record._id}
        dataSource={data}
        loading={data === null}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        onRow={(record) => ({
          onDoubleClick: () => setSelectedEmail(record.username),
        })}
      />
      <div className="text-center text-cyan-500 font-bold text-[1em] mt-5 mb-5">
        If you want to see Referrals of selected user, please click checkbox.
      </div>
      <RefferalUsers ids={selectedRowKeys} />
      <BlackList />
      <BalanceModal
        open={balanceModal.open}
        username={balanceModal.username}
        onClose={closeBalances}
      />
      <EditRoleModal
        open={editRoleModal.open}
        data={editRoleModal.data}
        onClose={closeEditRoleModal}
        setRefresh={setRefresh}
      />
      <AddUserModal
        open={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        setRefresh={setRefresh}
      />
      <Modal
        okText="Save"
        title="Update User Info"
        open={editInfoVisible}
        onOk={handleSaveUserInfo}
        onCancel={() => {
          setEditInfoVisible(false);
          setEditInfoUserId(null);
        }}
      >
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Display Name"
            value={editInfoForm.displayName}
            onChange={(e) =>
              setEditInfoForm((prev) => ({
                ...prev,
                displayName: e.target.value,
              }))
            }
          />
          <Input
            placeholder="Username"
            value={editInfoForm.username}
            onChange={(e) =>
              setEditInfoForm((prev) => ({
                ...prev,
                username: e.target.value,
              }))
            }
          />
          <Input
            placeholder="Email"
            value={editInfoForm.email}
            onChange={(e) =>
              setEditInfoForm((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
          />
          <Input
            placeholder="Phone"
            value={editInfoForm.phone}
            onChange={(e) =>
              setEditInfoForm((prev) => ({
                ...prev,
                phone: e.target.value,
              }))
            }
          />
        </div>
      </Modal>
      <Modal
        okText="Save"
        title="Edit WhiteList"
        open={whiteVisible}
        onOk={() => {
          onChangeWhiteList();
        }}
        onCancel={() => {
          setWhiteVisible(false);
          setSelectedId(null);
          setEditWhiteData([""]);
        }}
      >
        <div className="flex flex-col gap-2">
          {editWhiteData &&
            editWhiteData.map((item, i) => (
              <Input
                key={i}
                value={editWhiteData[i]}
                onChange={(e) => {
                  setEditWhiteData((prev) => {
                    if (i === editWhiteData.length - 1) {
                      const newData = [...prev, ""];
                      newData[i] = e.target.value;
                      return newData;
                    } else if (
                      i === editWhiteData.length - 2 &&
                      e.target.value === ""
                    ) {
                      const newData = [...prev.slice(0, prev.length - 2)];
                      newData[i] = e.target.value;
                      return newData;
                    } else {
                      const newData = [...prev];
                      newData[i] = e.target.value;
                      return newData;
                    }
                  });
                }}
              ></Input>
            ))}
        </div>
      </Modal>
    </div>
  );
};

export default UserManage;
