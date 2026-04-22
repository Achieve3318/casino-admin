import { Button, Modal, Table, Tag } from "antd";
import { debounce } from "lodash";
import moment from "moment";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { blockedEmail, postUrl } from "../../../utility";
import { error, success, warning } from "../../../utility/notification";
import { getFilterColumns } from "../../../utility/table";
import HiddenUsername from "../../../utility/hiddenEmail";
import { USER_ROLE } from "../../../constants";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const pageSizeOptions = [10, 20, 50, 100];
const { confirm } = Modal;

const DepositBalanceMng = () => {
  const [refresh, setRefresh] = useReducer((f) => !f);
  const { auth, blockLists , logout, sitemode } = useAuth();
  console.log(auth);

  const [dataSource, setDataSource] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const columns = getFilterColumns([
    ...(auth?.user?.role === USER_ROLE.ADMIN
      ? [
        {
          title: "ID",
          dataIndex: "_id",
          sorter: true,
          width: "6em",
          align: "center",
          className: "text-xs",
        },
      ]
      : []),
    {
      title: "Username",
      dataIndex: "username",
      sorter: true,
      className: "text-xs",
      align: "center",
      isFilter: true,
      render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },
    {
      title: "Address",
      dataIndex: "address",
      className: "text-xs",
      align: "center",
      isFilter: true,
    },
    {
      title: "Derivation Key",
      dataIndex: "derivationKey",
      sorter: true,
      className: "text-xs",
      align: "center",
    },
    {
      title: "isLocked",
      dataIndex: "virtualAccount.isLocked",
      className: "text-xs",
      align: "center",
      render: (value, all) =>
        !all.virtualAccount || all.virtualAccount.currency ? (
          ""
        ) : all.virtualAccount.isLocked ? (
          <Tag color="red">Locked</Tag>
        ) : (
          <Tag color="cyan">UnLocked</Tag>
        ),
    },
    {
      title: "isActivated",
      dataIndex: "virtualAccount.isActivated",
      className: "text-xs",
      align: "center",
      render: (value, all) =>
        !all.virtualAccount || all.virtualAccount.currency ? (
          ""
        ) : all.virtualAccount.isActivated ? (
          <>
            {all.virtualAccount.isLocked ? (
              <span className="text-cyan-900">
                {moment(all.virtualAccount.activatedTime).fromNow()}
                <br />
              </span>
            ) : (
              ""
            )}
            <Tag color="cyan">Activated</Tag>
          </>
        ) : (
          <Tag color="red">Not</Tag>
        ),
    },
    {
      title: "Network",
      dataIndex: "network",
      sorter: true,
      className: "text-xs",
      align: "center",
      isFilter: true,
    },
  ]);

  const [tableParams, setTableParams] = useState({
    pagination: {
      size: "default",
      current: 1,
      pageSize: pageSizeOptions[1],
      total: 0,
      pageSizeOptions,
      showQuickJumper: true,
      showSizeChanger: true,
    },
    changed: false,
    filters: {},
    sorter: {},
  });

  const fetchDataCount = () => {
    postUrl2Pro(
      "/api/wallet/deposit/get/count",
      {
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (data) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: data },
        }),
      logout,
      err=>{
        error(err);
      }
    );
  };
  const fetchData = () => {
    setDataSource(null);
    postUrl2Pro(
      "/api/wallet/deposit/get",
      {
        page: tableParams.pagination.current - 1,
        pageSize: tableParams.pagination.pageSize,
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (data) => {
        setDataSource(data);
      },
      logout,
      err=>{
        error(err);
      }
    );
  };

  useEffect(fetchDataCount, [tableParams.changed, refresh]);
  useEffect(
    fetchData,
    [
      tableParams.changed, refresh
    ],
  );
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

  const handleUnLockWallet = () => {
    if (selectedRowKeys.length === 0) {
      warning("Select Deposit Wallets");
      return;
    }
    confirm({
      title: "Do you want to unlock these wallets?",
      content: "Once unlock, these wallets cannot be returned.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        const wallets = selectedRowKeys.map((id) => {
          const record = (dataSource || []).filter(({ _id }) => _id === id);
          if (record.length === 0) return {};
          return {
            network: record[0].network,
            username: record[0].username,
          };
        });

        postUrl(sitemode,
          "/api/crypto/unlock",
          { wallets },
          (data) => {
            success(data.message);
            setRefresh();
            setSelectedRowKeys([]);
          },
          logout,
          (err) => {
            error(err);
            setRefresh();
            setSelectedRowKeys([]);
          },
        );
      },
      onCancel() { },
    });
  };

  const handleActivateWallet = () => {
    if (selectedRowKeys.length === 0) {
      warning("Select Deposit Wallets");
      return;
    }

    confirm({
      title: "Do you want to activate these wallets?",
      content:
        "Once activate, these wallets cannot be used for client side for a while.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        const wallets = selectedRowKeys.map((id) => {
          const record = (dataSource || []).filter(({ _id }) => _id === id);
          if (record.length === 0) return {};
          return {
            network: record[0].network,
            username: record[0].username,
          };
        });

        postUrl(sitemode,
          "/api/crypto/activate",
          { wallets },
          (data) => {
            success(data.message);
            setRefresh();
            setSelectedRowKeys([]);
          },
          logout,
          (err) => {
            error(err);
            setRefresh();
            setSelectedRowKeys([]);
          },
        );
      },
      onCancel() { },
    });
  };

  return (
    <>
      <div className="flex items-center gap-3 mt-3">
        <p className="text-[2em]  font-extrabold ">Wallet Management</p>
        <Button shape="circle" onClick={() => setRefresh()}>
          <i className="fa fa-refresh"></i>
        </Button>
        <div className="grow"></div>
        <Button.Group>
          <Button
            color="danger"
            variant="filled"
            onClick={handleActivateWallet}
          >
            Activate
          </Button>
          <Button color="primary" variant="filled" onClick={handleUnLockWallet}>
            UnLock
          </Button>
        </Button.Group>
      </div>
      <Table
        className="mt-3 w-full"
        bordered
        size="small"
        scroll={{ x: "auto" }}
        columns={columns}
        rowKey={(record) => record._id}
        dataSource={dataSource}
        loading={dataSource === null}
        pagination={tableParams.pagination}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record) => ({
            disabled:
              !record.virtualAccount ||
              record.virtualAccount.currency ||
              (record.virtualAccount.isLocked === false &&
                record.virtualAccount.isActivated === true),
          }),
        }}
        onChange={handleTableChange}
      />
    </>
  );
};

export default DepositBalanceMng;
