import { Table } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { TruncateMiddle } from "../../../utility/address";
import { dateFormat } from "../../../utility/date";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const pageSizeOptions = [10, 20, 50, 100, 500];

const Transaction = () => {
  const [data, setData] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
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
    sorter: {
      field: "createdAt",
      order: "descend",
    },
  });

  const { logout, coins, auth , sitemode } = useAuth();
  const columns = getFilterColumns([
    ...(auth?.user?.role === USER_ROLE.ADMIN
      ? [
        {
          title: "ID",
          dataIndex: "_id",
          width: "10em",
          align: "center",
        },
      ]
      : []),
    {
      title: "Transaction ID",
      dataIndex: "txId",
      sorter: true,
      width: "14em",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      isFilter: "true",
      render: (v) => (
        <TruncateMiddle text={v} maxLength={16} showTooltip={true} />
      ),
    },
    {
      title: "From",
      dataIndex: "from",
      sorter: true,
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      isFilter: "true",
      render: (v) => (
        <TruncateMiddle text={v} maxLength={16} showTooltip={true} />
      ),
    },
    {
      title: "To",
      dataIndex: "to",
      sorter: true,
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      isFilter: "true",
      render: (v) => (
        <TruncateMiddle text={v} maxLength={16} showTooltip={true} />
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      sorter: true,
      align: "center",
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        value.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 8,
          useGrouping: true,
        }),
    },

    {
      title: "Currency",
      dataIndex: "currency",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (currency) => (
        <>
          <img
            src={coins[currency?.currency]}
            className="w-[1em] mr-2"
            alt="currency"
          />
          {currency?.currency}{" "}
        </>
      ),
      align: "center",
    },
    {
      title: "Chain",
      dataIndex: "chain",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      sorter: true,
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      render: (v) => dateFormat(v),
    },
  ]);
  const fetchDataCount = () => {
    postUrl2Pro(
      "/api/transactions/get/count",
      {
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (res) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: res },
        }),

      logout,
    );
  };
  const fetchData = () => {
    setData(null);
    postUrl2Pro(
      "/api/transactions/get",
      {
        page: tableParams.pagination.current - 1,
        pageSize: tableParams.pagination.pageSize,
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (res) => setData(res),
      logout,
    );
  };
  useEffect(fetchDataCount, [tableParams.changed]);
  useEffect(
    fetchData,
    [
      tableParams.changed,
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
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  return (
    <>
      <Table
        className="mt-4"
        size="small"
        bordered
        columns={columns}
        rowSelection={rowSelection}
        scroll={{ x: "auto" }}
        rowKey={(record) => record._id}
        dataSource={data}
        loading={data === null}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
      />
    </>
  );
};

export default Transaction;
