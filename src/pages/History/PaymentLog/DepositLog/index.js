import { Table, Tooltip } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { postUrl } from "../../../../utility";
import { dateFormat } from "../../../../utility/date";
import { getFilterColumns } from "../../../../utility/table";
import { USER_ROLE } from "../../../../constants";

const pageSizeOptions = [10, 20, 50, 100, 500];
const DEFAULT_SORTER = { field: "createdAt", order: "descend" };

export default function DepositLog({ username = "" }) {
  const [coinData, setCoinData] = useState(null);
  const [coinParams, setCoinParams] = useState({
    pagination: {
      size: "default",
      current: 1,
      pageSize: pageSizeOptions[1],
      total: 0,
      pageSizeOptions,
      showQuickJumper: true,
      showSizeChanger: true,
    },
    filters: { username: [username] },
    sorter: DEFAULT_SORTER,
  });
  const { coins, logout, auth, sitemode, prices, siteCurrency } = useAuth();

  const coinColumns = useMemo(
    () =>
      getFilterColumns([
        ...(auth?.user?.role === USER_ROLE.ADMIN
          ? [
              {
                title: "ID",
                dataIndex: "_id",
                width: "15em",
                align: "center",
                isFilter: true,
              },
            ]
          : []),
        {
          title: "Date",
          dataIndex: "createdAt",
          width: "12em",
          align: "center",
          className: "text-xs sm:text-sm md:text-base",
          render: (data) => dateFormat(data),
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
          title: (siteCurrency ? siteCurrency : "USD") + " Amount",
          dataIndex: "usdAmount",
          sorter: true,
          width: "10em",
          className: "text-xs sm:text-sm md:text-base text-right",
          render: (value) =>
            (
              (value || 0) /
              (prices[siteCurrency] ? prices[siteCurrency] : 1)
            ).toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
              useGrouping: true,
            }) +
            " " +
            (prices[siteCurrency] ? siteCurrency : "USD"),
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
        {
          title: "Description",
          dataIndex: "description",
          width: "19em",
          align: "center",
          className: "text-xs sm:text-sm md:text-base",
        },
      ]),
    [auth?.user?.role, coins, prices, siteCurrency]
  );

  const fetchCoinCount = useCallback(() => {
    postUrl(
      sitemode,
      "/api/ballance/getBallanceLogCount",
      {
        filters: {
          type: ["deposit"],
          ...coinParams.filters,
        },
        sorter: coinParams.sorter,
      },
      (res) =>
        setCoinParams((prev) => ({
          ...prev,
          pagination: { ...prev.pagination, total: res || 0 },
        })),
      logout
    );
  }, [sitemode, coinParams.filters, coinParams.sorter, logout]);

  const fetchCoinData = useCallback(() => {
    setCoinData(null);
    postUrl(
      sitemode,
      "/api/ballance/getBallanceLog",
      {
        filters: {
          type: ["deposit"],
          ...coinParams.filters,
        },
        sorter: coinParams.sorter,
        page: coinParams.pagination.current - 1,
        pageSize: coinParams.pagination.pageSize,
      },
      (res) => setCoinData(res),
      logout
    );
  }, [
    sitemode,
    coinParams.filters,
    coinParams.sorter,
    coinParams.pagination.current,
    coinParams.pagination.pageSize,
    logout,
  ]);

  useEffect(() => fetchCoinCount(), [fetchCoinCount]);
  useEffect(() => fetchCoinData(), [fetchCoinData]);

  const handleCoinChange = useCallback(
    debounce((pagination, filters, sorter) => {
      setCoinParams({
        ...coinParams,
        pagination,
        filters: { ...coinParams.filters, ...filters },
        sorter: { field: sorter.field, order: sorter.order },
      });
    }, 300),
    [coinParams]
  );

  return (
    <div className="flex flex-col gap-8">
        <Table
          size="small"
          bordered
          columns={coinColumns}
          scroll={{ x: "auto" }}
          rowKey={(record) => record._id}
          dataSource={coinData || []}
          loading={coinData === null}
          pagination={coinParams.pagination}
          onChange={handleCoinChange}
        />
    </div>
  );
}
