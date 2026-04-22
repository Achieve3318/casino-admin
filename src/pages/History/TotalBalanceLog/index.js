import { Table, Tooltip, Button, Modal, Input, Select, DatePicker, Space } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { postUrl } from "../../../utility";
import { dateFormat, getTimezoneForSiteMode } from "../../../utility/date";
import { getFilterColumns } from "../../../utility/table";
import { error, success } from "../../../utility/notification";
import { USER_ROLE } from "../../../constants";
import { blockedEmail } from "../../../utility";
import HiddenUsername from "../../../utility/hiddenEmail";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
const pageSizeOptions = [10, 20, 50, 100, 500];
const { RangePicker } = DatePicker;

export default function TotalBalanceLog() {
  const [data, setData] = useState(null);
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
    sorter: {
      field: "createdAt",
      order: "descend",
    },
  });
  const { coins, logout, auth, blockLists , sitemode, prices, siteCurrency } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [type, setType] = useState("deposit");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const siteTimezone = useMemo(() => getTimezoneForSiteMode(sitemode), [sitemode]);

  const injectDateFilters = (filters) => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dayjs
        .tz(dayjs(dateRange[0]).format("YYYY-MM-DD HH:mm:ss"), siteTimezone)
        .startOf("second")
        .toISOString();
      const endDate = dayjs
        .tz(dayjs(dateRange[1]).format("YYYY-MM-DD HH:mm:ss"), siteTimezone)
        .endOf("second")
        .toISOString();

      filters.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }
  };

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
      title: "Username",
      dataIndex: "username",
      width: "12em",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      isFilter: true,
      render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },
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
        { text: "Referral", value: 'referral' },
        { text: "Deposit", value: "deposit" },
        { text: "Withdrawal", value: "withdrawal" },
        { text: "Adjustment", value: "adjustment" },
      ],
      // isFilter: true,
    },
    {
      title: "SubType",
      width: "7em",
      dataIndex: "subType",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      filters: [
        { text: "wager", value: "wager" },
        { text: "loss", value: "loss" },
        { text: "VIP", value: "VIP" },
        { text: "signup", value: "signup" },
        { text: "manual", value: "manual" },
        { text: "email", value: "email" },
        { text: "phone", value: "phone" },
        { text: "signin", value: "signin" },
        { text: "card", value: "card" },
        { text: "bet", value: "bet" },
        { text: "win", value: "win" },
        { text: "continuously", value: "continuously" },
        { text: "cattea", value: "cattea" },
        { text: "ranking", value: "ranking" },
        { text: "spin", value: "spin" },
      ],
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
      title: (siteCurrency?siteCurrency:"USD" )+ " Amount",
      dataIndex: "usdAmount",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        (value/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: true,
        }) + " " + (prices[siteCurrency]?siteCurrency:"USD"),
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
      className: "text-xs sm:text-sm md:text-base",
      sorter: true,
      render: (data) => dateFormat(data),
    },
  ]);

  const fetchDataCount = useCallback(() => {
    const filters = { ...tableParams.filters };

    injectDateFilters(filters);

    postUrl(sitemode,
      "/api/ballance/getBallanceLogCount",
      {
        filters: filters,
        sorter: tableParams.sorter,
      },

      (res) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: res },
        }),
      logout
    );
  }, [tableParams.changed, dateRange, siteTimezone]);
  const fetchData = useCallback(() => {
    setData(null);
    const filters = { ...tableParams.filters };

    injectDateFilters(filters);

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
    );
  }, [tableParams.changed, dateRange, siteTimezone]);
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

  const handleDeposit = () => {
    setLoading(true);
    postUrl(sitemode,"/api/tester/depositBalance", {
      username,
      currency,
      amount,
      type
    },
      (data) => {
        success(data.message);
        setModalVisible(false);
        fetchData();
        fetchDataCount();
        setLoading(false);
      },
      logout,
      err=>{
        error(err);
        setLoading(false);
      }
    )
  }

  return (
    <>
      <div className="w-full flex justify-between items-center mt-3 gap-2">
        <Space direction="vertical" size={2}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates || null)}
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
          />
        </Space>
        <div className="flex gap-2">
          <Button
            color="danger"
            variant="outlined"
            size="large"
            onClick={() => {
              setType("deduct");
              setModalVisible(true);
            }}
          >
            Deduct Ballance
          </Button>
          <Button
            color="primary"
            variant="solid"
            size="large"
            onClick={() => {
              setType("deposit");
              setModalVisible(true);
            }}
          >
            Manual Deposit
          </Button>
        </div>
      </div>
      <Table
        size="small"
        className="pt-2"
        bordered
        columns={columns}
        scroll={{ x: "auto" }}
        rowKey={(record) => record._id}
        dataSource={data}
        loading={data === null}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
      />
      <Modal
        title={type === "deduct" ? "Deduct Ballance" : "Manual Deposit"}
        open={modalVisible}
        onOk={handleDeposit}
        onCancel={() => setModalVisible(false)}
        okText={type === "deduct" ? "Deduct" : "Deposit"}
        okType={type === "deduct" ? "danger" : "primary"}
        confirmLoading={loading}
      >
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Select
          placeholder="Currency"
          value={currency}
          className="mt-2 w-full"
          onChange={(e) => setCurrency(e)}
        >
          {Object.keys(coins).map((coin) => (
            <Select.Option key={coin} value={coin}>
              <img src={coins[coin]} className="w-[1em] mr-2 cursor-pointer" />
              {coin}
            </Select.Option>
          ))}
        </Select>
        <Input
          placeholder="Amount"
          className="mt-2 w-full"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {type === "deduct" && <Input
          placeholder="Reason"
          className="mt-2 w-full"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />}
      </Modal>
    </>
  );
}
