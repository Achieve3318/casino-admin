import { Table, Tag, Tooltip, DatePicker, Space } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { GAMES } from "../../../constants/games";
import { useAuth } from "../../../context/AuthContext";
import { postUrl } from "../../../utility";
import { dateFormat, getTimezoneForSiteMode } from "../../../utility/date";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";
import { blockedEmail } from "../../../utility";
import HiddenUsername from "../../../utility/hiddenEmail";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const pageSizeOptions = [10, 20, 50, 100];
const { RangePicker } = DatePicker;

export default function TotalGameLog() {
  const [data, setData] = useState(null);
  const { coins, logout, auth, blockLists , sitemode } = useAuth();
  const [dateRange, setDateRange] = useState(null);
  const [totals, setTotals] = useState({ totalBetAmount: 0, totalWinAmount: 0 });
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

  const columns = getFilterColumns([
    ...(auth?.user?.role === USER_ROLE.ADMIN
      ? [
        {
          title: "ID",
          dataIndex: "_id",
          width: "8em",
          align: "center",
        },
      ]
      : []),
    {
      title: "Username",
      dataIndex: "username",
      sorter: true,
      isFilter: true,
      width: "7em",
      align: "center",
      className: "text-xs sm:text-sm md:text-base",
      render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },
    {
      title: "Game",
      dataIndex: "game",
      sorter: true,
      width: "7em",
      align: "center",
      className: "text-xs sm:text-sm md:text-base",
      filters: [...Object.keys(GAMES)].map((v) => ({ text: v, value: v })),
    },
    {
      title: "Result",
      dataIndex: "win",
      sorter: true,
      width: "6em",
      align: "center",
      className: "text-xs sm:text-sm md:text-base ",
      render: (data, row) =>
        <div className="cursor-pointer" onClick={() => {
          window.open(`${process.env.REACT_APP_REDIRECT_URL}/en/detailPage/${row._id}`, "_blank");
        }}>
          {data ? <Tag color="green">Win</Tag> : <Tag color="red">Lose</Tag>}
        </div>,
      filters: [
        { text: "Win", value: true },
        { text: "Lose", value: false },
      ],
    },
    {
      title: "BetAmount",
      dataIndex: "betAmount",
      width: "6em",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      align: "right",
      render: (value, all) => (
        <>
          {(value || 0).toLocaleString("en-US", {
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
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "WinAmount",
      dataIndex: "winAmount",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, all) => (
        <>
          {(value || 0).toLocaleString("en-US", {
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
      title: "Multiply",
      dataIndex: "multiply",
      sorter: true,
      width: "4em",
      render: (data) => Number(data || 0).toFixed(2),
      className: "text-xs sm:text-sm md:text-base",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      sorter: true,
      width: "10em",
      render: (data) => dateFormat(data),
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
    },
  ]);

  const fetchDataCount = () => {
    setData(null);
    const filters = { ...tableParams.filters };

    injectDateFilters(filters);

    postUrl(sitemode,"/api/history/get/count", {
      filters: filters,
    },
      (res) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: res },
        })
      , logout
    )
  };
  const fetchData = () => {
    const filters = { ...tableParams.filters };

    injectDateFilters(filters);

    postUrl(sitemode,"/api/history/get", {
      page: tableParams.pagination.current - 1,
      pageSize: tableParams.pagination.pageSize,
      filters: filters,
      sorter: tableParams.sorter,
    },
      (res) => setData(res)
      , logout
    )
  };

  const fetchTotals = () => {
    const filters = { ...tableParams.filters };

    injectDateFilters(filters);

    postUrl(sitemode,"/api/history/get/totals", {
      filters: filters,
      sorter: tableParams.sorter,
    },
      (res) => {
        if (res && typeof res === 'object') {
          setTotals({
            totalBetAmount: Number(res.totalBetAmount) || 0,
            totalWinAmount: Number(res.totalWinAmount) || 0,
          });
        } else {
          setTotals({ totalBetAmount: 0, totalWinAmount: 0 });
        }
      }
      , logout
    )
  };

  useEffect(fetchDataCount, [tableParams.changed, dateRange, siteTimezone]);
  useEffect(
    fetchData,
    [
      tableParams.changed,
      dateRange,
      siteTimezone
    ],
  );
  useEffect(fetchTotals, [tableParams.changed, dateRange, siteTimezone]);
  const handleTableChange = useCallback(
    debounce((pagination, filters, sorter) => {
      setTableParams({
        ...tableParams,
        changed: !tableParams.changed,
        pagination,
        filters: { ...tableParams.filters, ...filters },
        sorter,
      });
    }, 300),
    [tableParams]
  );

  return (
    <>
      <div className="w-full flex justify-start items-center mt-3">
        <Space direction="vertical" size={2}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates || null)}
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
          />
        </Space>
      </div>  
      <Table
        className="mt-3 w-full"
        bordered
        size="small"
        scroll={{ x: "auto" }}
        columns={columns}
        rowKey={(record) => record._id}
        dataSource={data}
        loading={data === null}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
        summary={(pageData) => {
          return (
            <Table.Summary fixed>
              <Table.Summary.Row>
                {columns.map((col, index) => {
                  if (col.dataIndex === 'betAmount') {
                    return (
                      <Table.Summary.Cell index={index} key={col.dataIndex} align="right">
                        <strong>
                          {totals.totalBetAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                            useGrouping: true,
                          })}
                        </strong>
                      </Table.Summary.Cell>
                    );
                  } else if (col.dataIndex === 'winAmount') {
                    return (
                      <Table.Summary.Cell index={index} key={col.dataIndex} align="right">
                        <strong>
                          {totals.totalWinAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                            useGrouping: true,
                          })}
                        </strong>
                      </Table.Summary.Cell>
                    );
                  } else if (index === 0) {
                    return (
                      <Table.Summary.Cell index={index} key={col.dataIndex}>
                        <strong>Total</strong>
                      </Table.Summary.Cell>
                    );
                  } else {
                    return <Table.Summary.Cell index={index} key={col.dataIndex} />;
                  }
                })}
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </>
  );
}
