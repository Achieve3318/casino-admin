import { Table, Tooltip } from "antd";
import axios from "axios";
import { debounce } from "lodash";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { error } from "../../../../utility/notification";
import { getFilterColumns } from "../../../../utility/table";
import { dateFormat } from "../../../../utility/date";
import { USER_ROLE } from "../../../../constants";
import { SUB_SITE } from "../../../../utility";

const pageSizeOptions = [10, 20, 50, 100, 500];

export default function WithdrawLog({ username = "" }) {
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
    filters: { username: [username] },
    sorter: {
      field: "createdAt",
      order: "descend",
    },
  });
  const { logout, coins, auth , sitemode, siteCurrency, prices } = useAuth();

  const columns = getFilterColumns([
    ...(auth?.user?.role === USER_ROLE.ADMIN
      ? [
        {
          title: "ID",
          dataIndex: "_id",
          width: "15em",
          align: "center",
        },
      ]
      : []),
    {
      title: "Date",
      dataIndex: "createdAt",
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
      render: (data) => dateFormat(data),
      align: "center",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base text-right",
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
      title: (siteCurrency?siteCurrency:"USD") + " Amount",
      dataIndex: "usdAmount",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base text-right",
      render: (value) =>
        ((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
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
      className: "text-xs sm:text-sm md:text-base text-right",
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
      title: "Balance After",
      dataIndex: "balanceAfter",
      width: "12em",
      className: "text-xs sm:text-sm md:text-base text-right",
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
    // {
    //   title: "Reference",
    //   dataIndex: "reference",
    //   width: '12em',
    //   className: "text-xs sm:text-sm md:text-base cursor-pointer",
    //   render: (data) => <div className="max-w-28 overflow-x-hidden overflow-wrap-keep text-ellipsis">{JSON.stringify(data).replace(/"/g, "")}</div>,
    // },
    {
      title: "Description",
      dataIndex: "description",
      width: "19em",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
    },
  ]);

  const fetchDataCount = useCallback(() => {
    axios
      .post(
        SUB_SITE[sitemode] + "/api/ballance/getBallanceLogCount",
        {
          filters: {
            type: ["withdrawal"],
            ...tableParams.filters,
          },
          sorter: tableParams.sorter,
        },
      )
      .then((res) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: res.data },
        }),
      )
      .catch((err) => {
        if ((err.response || {}).status === 401) logout();
        else error(err);
      });
  }, [tableParams.changed]);
  const fetchData = useCallback(() => {

    setData(null);
    axios
      .post(
        SUB_SITE[sitemode]+ "/api/ballance/getBallanceLog",
        {
          filters: {
            type: ["withdrawal"],
            ...tableParams.filters,
          },
          sorter: tableParams.sorter,
          page: tableParams.pagination.current - 1,
          pageSize: tableParams.pagination.pageSize,
        },
      )
      .then((res) => setData(res.data))
      .catch((err) => {
        if ((err.response || {}).status === 401) logout();
        else error(err);
      });
  }, [tableParams.changed]);
  useEffect(() => fetchDataCount(), [fetchDataCount]);
  useEffect(
    () => fetchData(),
    [fetchData],
  );
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
  );
}
