import { Table, Tooltip, DatePicker, Space } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { postUrl } from "../../../utility";
import { dateFormat } from "../../../utility/date";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;
const pageSizeOptions = [10, 20, 50, 100, 500];

export default function DetailBalance({dateRange, username = "", pageSize = pageSizeOptions[1] }) {
  const [data, setData] = useState(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      size: "default",
      current: 1,
      pageSize: pageSize,
      total: 0,
      pageSizeOptions,
      showQuickJumper: true,
      showSizeChanger: true,
    },
    changed: false,
    filters: { username: [username] },
    sorter: {
      field: "createdAt",
      order: "descend",
    },
  });
  const { coins, logout, auth, sitemode, prices, siteCurrency } = useAuth();

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
      title: "Type",
      dataIndex: "type",
      sorter: true,
      width: "7em",
      align: "center",
      className: "text-xs sm:text-sm md:text-base",
      filters: [
        { text: "Bet", value: "bet" },
        { text: "Bonus", value: "bonus" },
        { text: "Deposit", value: "deposit" },
        { text: "Referral", value: "referral" },
        { text: "Withdrawal", value: "withdrawal" },
        { text: "Adjustment", value: "adjustment" },
        { text: 'Deduct', value: 'deduct' },
        { text: "Swap", value: "swap" },
      ],
      render: (data) => <div>{data}</div>,
      // isFilter: true,
    },
    {
      title: "SubType",
      width: "7em",
      dataIndex: "subType",
      filters: [
        { text: "wager", value: "wager" },
        { text: "loss", value: "loss" },
        { text: "VIP", value: "VIP" },
        { text: "manual", value: "manual" },
        { text: 'email', value: 'email' },
        { text: 'phone', value: 'phone' },
        { text: "signin", value: "signin" },
        { text: "card", value: "card" },
        { text: "bet", value: "bet" },
        { text: 'request', value: 'request' },
        { text: 'reject', value: 'reject' },
        { text: "win", value: "win" },
        { text: "continuously", value: "continuously" },
        { text: "cattea", value: "cattea" },
        { text: "ranking", value: "ranking" },
        { text: "spin", value: "spin" },
      ],
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, all) => (
        <>
          {value.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
            useGrouping: true,
          })}
          <Tooltip title={all.currency}>
            <img
              src={coins[all.currency]}
              className="w-[1em] ml-2 cursor-pointer"
            />
          </Tooltip>
        </>
      ),

      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: (siteCurrency ? siteCurrency : "USD") + " Amount",
      dataIndex: "usdAmount",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        ((value || 0) / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: true,
        }) + " " + (prices[siteCurrency] ? siteCurrency : "USD"),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Balance Before",
      width: "12em",
      dataIndex: "balanceBefore",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, all) => (
        <>
          {value.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
            useGrouping: true,
          })}
          <Tooltip title={all.currency}>
            <img
              alt=""
              src={coins[all.currency]}
              className="w-[1em] ml-2 cursor-pointer"
            />
          </Tooltip>
        </>
      ),

      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Balance After",
      dataIndex: "balanceAfter",
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value, all) => (
        <>
          {value.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
            useGrouping: true,
          })}
          <Tooltip title={all.currency}>
            <img
              alt=""
              src={coins[all.currency]}
              className="w-[1em] ml-2 cursor-pointer"
            />
          </Tooltip>
        </>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      width: "13em",
      align: "center",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      render: (data) => dateFormat(data),
    },
    // {
    //   title: "Reference",
    //   dataIndex: "reference",
    //   width: "12em",
    //   align: "center",
    //   className: "text-xs sm:text-sm md:text-base cursor-pointer",
    //   render: (data) => JSON.stringify(data).replace(/"/g, ""),
    // },
    // {
    //   title: "Description",
    //   dataIndex: "description",
    //   width: "19em",
    //   className: "text-xs sm:text-sm md:text-base",
    // },
  ]);

  const getDateRangeFilter = (range) => {
    if (!range || !range[0] || !range[1]) return null;
    return {
      startDate: dayjs(range[0]).toISOString(),
      endDate: dayjs(range[1]).toISOString(),
    };
  };

  const fetchDataCount = useCallback(() => {
    console.log(username);
    const filters = { ...tableParams.filters, username: [username] };
    
    // Add date filter if selected - format as ISO strings in MongoDB query format
    const appliedRange = getDateRangeFilter(dateRange);
    if (appliedRange) {
      filters.createdAt = {
        $gte: appliedRange.startDate,
        $lte: appliedRange.endDate,
      };
    }
    
    postUrl(sitemode,
      "/api/ballance/getBallanceLogCount",
      {
        filters: filters,
        sorter: tableParams.sorter,
      },
      (res) => setTableParams({ ...tableParams, pagination: { ...tableParams.pagination, total: res } }), logout)
  }, [tableParams.changed, username, tableParams.filters, tableParams.sorter, dateRange, sitemode, logout]);
  const fetchData = useCallback(() => {
    setData(null);
    const filters = { ...tableParams.filters, username: [username] };
    
    // Add date filter if selected - format as ISO strings in MongoDB query format
    const appliedRange = getDateRangeFilter(dateRange);
    if (appliedRange) {
      filters.createdAt = {
        $gte: appliedRange.startDate,
        $lte: appliedRange.endDate,
      };
    }
    
      postUrl(sitemode,
        "/api/ballance/getBallanceLog",
        {
          page: tableParams.pagination.current - 1,
          pageSize: tableParams.pagination.pageSize,
          filters: filters,
          sorter: tableParams.sorter,
        },
        (res) => setData(res),
        logout
      )
  }, [tableParams.changed, username, tableParams.filters, tableParams.sorter, tableParams.pagination.current, tableParams.pagination.pageSize, dateRange, sitemode, logout]);
  useEffect(() => fetchDataCount(), [fetchDataCount]);
  useEffect(() => fetchData(), [fetchData]);
  const handleTableChange = useCallback(
    debounce((pagination, filters, sorter) => {
      setTableParams({
        ...tableParams,
        changed: !tableParams.changed,
        pagination,
        filters: { ...tableParams.filters, ...filters },
        sorter: { field: sorter.field, order: sorter.order },
      });
    }, 300),
    [tableParams]
  );

  return (
    <div className="flex flex-col gap-4">
      
      <Table
        size="small"
        bordered
        columns={columns}

        scroll={{ x: "auto" }}
        rowKey={(record) => record._id}
        dataSource={data}
        loading={data === null}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
      />
    </div>
  );
}
