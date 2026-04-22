import { Button, Table } from "antd";
import React, { useState, useReducer } from "react";
import { getFilterColumns } from "../../../utility/table";
import { postUrl } from "../../../utility";
import { useAuth } from "../../../context/AuthContext";
import { useCallback, useEffect } from "react";
import { debounce } from "lodash";

const pageSizeOptions = [10, 20, 50, 100];

export default function BlackList() {
  const [selectedUnblocked, setSelectedUnblocked] = useState([]);
  const [selectedBlocked, setSelectedBlocked] = useState([]);
  const columns = getFilterColumns([
    {
      title: "Username",
      dataIndex: "username",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      width: "5em",
    },
    {
      title: "Name",
      dataIndex: "displayName",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      width: "5em",
    },
  ]);
  const { logout , sitemode } = useAuth();
  const [unblocked, setUnblocked] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [refreshUnblocked, setRefreshUnblocked] = useReducer((f) => !f, false);
  const [refreshBlocked, setRefreshBlocked] = useReducer((f) => !f, false);
  const [loading, setLoading] = useState(false);
  const [tableBlockedParams, setTableBlockedParams] = useState({
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
  const [tableUnblockedParams, setTableUnblockedParams] = useState({
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

  const fetchUnblockedDataCount = useCallback(() => {
    postUrl(sitemode,
      "/api/user/unblocked/count",
      {
        filters: tableUnblockedParams.filters,
        sorter: tableUnblockedParams.sorter,
      },
      (res) =>
        setTableUnblockedParams((prev) => ({
          ...prev,
          pagination: { ...prev.pagination, total: res },
        })),
      logout
    );
  }, [tableUnblockedParams.changed]);

  const fetchUnblockedData = useCallback(() => {
    setUnblocked(null);
    postUrl(sitemode,
      "/api/user/unblocked/list",
      {
        page: tableUnblockedParams.pagination.current - 1,
        pageSize: tableUnblockedParams.pagination.pageSize,
        filters: tableUnblockedParams.filters,
        sorter: tableUnblockedParams.sorter,
      },
      (res) => setUnblocked(res),
      logout
    );
  }, [tableUnblockedParams.changed]);

  const fetchBlockedDataCount = useCallback(() => {
    postUrl(sitemode,
      "/api/user/blocked/count",
      {
        filters: tableBlockedParams.filters,
        sorter: tableBlockedParams.sorter,
      },
      (res) =>
        setTableBlockedParams((prev) => ({
          ...prev,
          pagination: { ...prev.pagination, total: res },
        })),
      logout
    );
  }, [tableBlockedParams.changed]);

  const fetchBlockedData = useCallback(() => {
    setBlocked(null);
    postUrl(sitemode,
      "/api/user/blocked/list",
      {
        page: tableBlockedParams.pagination.current - 1,
        pageSize: tableBlockedParams.pagination.pageSize,
        filters: tableBlockedParams.filters,
        sorter: tableBlockedParams.sorter,
      },
      (res) => setBlocked(res),
      logout
    );
  }, [tableBlockedParams.changed]);

  const handleTableUnblockedChange = useCallback(
    debounce((pagination, filters, sorter) => {
      setTableUnblockedParams({
        ...tableUnblockedParams,
        changed: !tableUnblockedParams.changed,
        pagination,
        filters,
        sorter,
      });
    }, 300),
    [tableUnblockedParams]
  );

  const handleTableBlockedChange = useCallback(
    debounce((pagination, filters, sorter) => {
      setTableBlockedParams({
        ...tableBlockedParams,
        changed: !tableBlockedParams.changed,
        pagination,
        filters,
        sorter,
      });
    }, 300),
    [tableBlockedParams]
  );

  useEffect(() => {
    fetchUnblockedDataCount();
  }, [fetchUnblockedDataCount]);

  useEffect(() => {
    fetchUnblockedData();
  }, [fetchUnblockedData, refreshUnblocked]);

  useEffect(() => {
    fetchBlockedDataCount();
  }, [fetchBlockedDataCount]);

  useEffect(() => {
    fetchBlockedData();
  }, [fetchBlockedData, refreshBlocked]);

  const handleSetBlocked = () => {
    setLoading(true);
    postUrl(sitemode,"/api/user/block", { ids: selectedUnblocked }, (res) => {
      if (res.message === "NOTIFICATIONS.success.WithdrawBlocked") {
        setRefreshBlocked();
        setRefreshUnblocked();
        setLoading(false);
      }
    }, logout)

  }

  const handleSetUnblocked = () => {
    setLoading(true);
    postUrl(sitemode,"/api/user/unblock", { ids: selectedBlocked }, (res) => {
      if (res.message === "NOTIFICATIONS.success.WithdrawUnBlocked") {
        setRefreshBlocked();
        setRefreshUnblocked();
        setLoading(false);
      }
    }, logout,
      err=>{
        setLoading(false);
      }
    )

  }

  return (
    <div className="flex gap-2 w-full mt-3 mb-2 items-start h-auto p-2 border-2 border-solid border-[#000] rounded-md">
      <Table size="small" columns={columns} dataSource={unblocked} className="w-1/2"
        rowKey="_id"
        rowSelection={{
          selectedUnblocked,
          onChange: setSelectedUnblocked,
        }}
        loading={unblocked === null}
        pagination={tableUnblockedParams.pagination}
        onChange={handleTableUnblockedChange}
        title={() => <span className="text-[1.2em] font-bold">Unblocked List</span>}
      ></Table>
      <div className="h-full flex flex-col justify-center mt-[5rem]">
        <Button type="primary" className="mb-2" onClick={handleSetBlocked} loading={loading}>&gt;&gt;</Button>
        <Button type="default" onClick={handleSetUnblocked} loading={loading}>&lt;&lt;</Button>
      </div>
      <Table size="small" columns={columns} dataSource={blocked} className="w-1/2"
        rowKey="_id"
        rowSelection={{
          selectedBlocked,
          onChange: setSelectedBlocked,
        }}
        loading={blocked === null}
        pagination={tableBlockedParams.pagination}
        onChange={handleTableBlockedChange}
        title={() => <span className="text-[1.2em] font-bold">Blocked List</span>}

      ></Table>
    </div>
  );
}
