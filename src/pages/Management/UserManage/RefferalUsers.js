import { useAuth } from "../../../context/AuthContext";
import { useReducer } from "react";
import { blockedEmail, postUrl } from "../../../utility";
import { debounce } from "lodash";
import { getFilterColumns } from "../../../utility/table";
import { useEffect, useCallback } from "react";
import { useState } from "react";
import { Modal } from "antd";
import { Table } from "antd";
import DetailBalance from "../../History/BalanceLog/DetailBalance";
import DoubleDescription from "../../../components/common/DoubleDescription";
import HiddenEmail from "../../../utility/hiddenEmail";
import { USER_ROLE } from "../../../constants";
import React from "react";

const pageSizeOptions = [10, 20, 50, 100];

const RefferalUsers = ({ ids = [] }) => {
  const [data, setData] = useState(null);
  const [refresh, setRefresh] = useReducer((f) => !f, false);
  const [selectedUsername, setSelectedUsername] = useState(null);
  const { blockLists, auth , sitemode, logout, siteCurrency, prices } = useAuth();
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

  const columns = getFilterColumns([
    {
      title: 'Referrer',
      dataIndex: 'referrer',
      key: 'referrer',
      align: 'center',
      width: '10em',
      className: 'text-xs sm:text-sm md:text-base',
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "useremail",
      align: "center",
      width: 150,
      className: 'text-xs sm:text-sm md:text-base',
      isFilter: true,
      render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenEmail(text), blockLists),
    },
    {
      title: "Total Deposits",
      dataIndex: "deposit",
      key: "deposit",
      align: "center",
      width: 100,
      className: 'text-xs sm:text-sm md:text-base',
      render: (data) => (data/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true,
      }) + " " + (prices[siteCurrency]?siteCurrency:"USD"),
    },

    {
      title: "Todal Bet Amount",
      dataIndex: "betAmount",
      key: "bet",
      align: "center",
      width: 100,
      className: 'text-xs sm:text-sm md:text-base',
      render: (data) => (data/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true,
      }) + " " + (prices[siteCurrency]?siteCurrency:"USD"),
    },
    {
      title: "Total Win Amount",
      dataIndex: "winAmount",
      key: "winAmount",
      align: "center",
      width: 100,
      className: 'text-xs sm:text-sm md:text-base',
      render: (data) => (data/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true,
      }) + " " + (prices[siteCurrency]?siteCurrency:"USD"),
    },
  ]);

  const fetchDataCount = useCallback(() => {
    postUrl(sitemode,
      "/api/user/getReferralsCount",
      {
        ids,
        sorter: tableParams.sorter,
      },
      (res) =>
        setTableParams((prev) => ({
          ...prev,
          pagination: { ...prev.pagination, total: res },
        })),
      logout
    );
  }, [tableParams.changed, ids]);

  const fetchData = useCallback(() => {
    setData(null);
    postUrl(sitemode,
      "/api/user/getReferrals",
      {
        ids,
        page: tableParams.pagination.current - 1,
        pageSize: tableParams.pagination.pageSize,
        sorter: tableParams.sorter,
      },
      (res) => setData(res),
      logout
    );
  }, [tableParams.changed, ids]);

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

  return (
    <>
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
        onRow={(record) => ({
          onDoubleClick: () => setSelectedUsername(record.username),
        })}
      />
      <DoubleDescription />
      <Modal
        width="90%"
        title={selectedUsername || ""}
        open={selectedUsername !== null}
        onCancel={() => setSelectedUsername(null)}
        footer={null}
      >
        <DetailBalance username={selectedUsername} />
      </Modal>
    </>
  );
};

export default RefferalUsers;
