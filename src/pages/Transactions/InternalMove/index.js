import { Table } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { TruncateMiddle } from "../../../utility/address";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const pageSizeOptions = [10, 20, 50, 100, 500];

const InternalMove = () => {
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
      title: "From",
      dataIndex: "fromaddress",
      sorter: true,
      width: "14em",
      align: "center",
      isFilter: true,
      className: "text-xs sm:text-sm md:text-base",
      render: (value, record) => {
        if (record?.from?.username) return record?.from?.username;
        return <TruncateMiddle text={record?.from?.address} maxLength={20} showTooltip={true} />
      }, // Adjust if 'from' object structure differs
    },
    {
      title: "To",
      dataIndex: "toaddress",
      sorter: true,
      width: "14em",
      align: "center",
      isFilter: true,
      className: "text-xs sm:text-sm md:text-base",
      render: (value, record) => {
        if (record?.to?.username) return record?.to?.username;
        return <TruncateMiddle text={record?.to?.address} maxLength={20} showTooltip={true} />
      }, // Adjust if 'to' object structure differs
    },
    {
      title: "TxId",
      dataIndex: "txId",
      sorter: true,
      width: "14em",
      align: "center",
      isFilter: true,

      className: "text-xs sm:text-sm md:text-base",
      render: (to) => (
        <TruncateMiddle text={to} maxLength={20} showTooltip={true} />
      ), // Adjust if 'to' object structure differs
    },
    {
      title: "Amount",
      dataIndex: "amount",
      sorter: true,
      width: "8em",
      align: "center",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        (value * 1).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 8,
          useGrouping: true,
        }),
    },
    {
      title: "Currency",
      dataIndex: "asset",
      sorter: true,
      width: "8em",
      align: "center",
      isFilter: true,
      className: "text-xs sm:text-sm md:text-base",
      render: (currency) => (
        <>
          <img src={coins[currency]} className="w-[1em] mr-2" />
          {currency}{" "}
        </>
      ),
    },

    {
      title: "Network",
      dataIndex: "network",
      sorter: true,
      isFilter: true,
      align: "center",
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
    },

  ]);

  const fetchDataCount = () => {
    postUrl2Pro(
      "/api/transactions/internalmove/get/count",
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
      "/api/transactions/internalmove/get",
      {
        page: tableParams.pagination.current - 1,
        pageSize: tableParams.pagination.pageSize,
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (data) => setData(data),
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

export default InternalMove;
