import { Table, Tag, Tooltip } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { GAMES } from "../../../constants/games";
import { useAuth } from "../../../context/AuthContext";
import { postUrl } from "../../../utility";
import { dateFormat } from "../../../utility/date";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";

const pageSizeOptions = [10, 20, 50, 100];

export default function HistoryModal({ username = "" }) {
  const [data, setData] = useState(null);
  const { coins, logout, auth , sitemode } = useAuth();
  console.log(auth);


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
    filters: { username: [username] },
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
          width: "10em",
          align: "center",
        },
      ]
      : []),
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

      className: "text-xs sm:text-sm md:text-base",
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
      width: "10em",
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
      width: "6em",
      render: (data) => dateFormat(data),
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
    },
  ]);

  const fetchDataCount = () => {
    setData(null);
    postUrl(sitemode,"/api/history/get/count", {
      filters: tableParams.filters,
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
    postUrl(sitemode,"/api/history/get", {
      page: tableParams.pagination.current - 1,
      pageSize: tableParams.pagination.pageSize,
      filters: tableParams.filters,
      sorter: tableParams.sorter,
    },
      (res) => setData(res)
      , logout
    )
  };

  useEffect(fetchDataCount, [tableParams.changed]);
  useEffect(
    fetchData,
    [
      tableParams.changed
    ],
  );
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
      <div className="w-full flex justify-between"></div>
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
      />
    </>
  );
}
