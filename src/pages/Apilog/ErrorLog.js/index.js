import { Button, Modal, Table } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { isEmpty, postUrl } from "../../../utility";
import { dateFormat } from "../../../utility/date";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";

const pageSizeOptions = [10, 20, 50, 100];

export default function ErrorLog() {
  const [refresh, setRefresh] = useReducer((f) => !f);
  const [dataSource, setDataSource] = useState(null);
  const [modal, setModal] = useState({ open: false, data: {} });
  const { logout, auth , sitemode } = useAuth();
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
      title: "Function Name",
      dataIndex: "functionName",
      sorter: true,
      className: "text-xs",
      width: "13em",
      align: "center",
      isFilter: true,
    },
    {
      title: "Message",
      dataIndex: "message",
      className: "text-xs",
      align: "center",
      sorter: true,
    },

    {
      title: "Params",
      dataIndex: "params",
      className: "text-xs overflow-hidden text-ellipsis whitespace-nowrap ",
      align: "left",
      width: "20em",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value) => (
        <div
          className="truncate text-xs cursor-pointer text-blue-900 hover:text-blue-400 w-48"
          onClick={() =>
            setModal({
              open: true,
              data: value,
            })
          }
        >
          {JSON.stringify(value || {})}
        </div>
      ),
    },
    {
      title: "Error",
      dataIndex: "error",
      className: "text-xs overflow-hidden text-ellipsis whitespace-nowrap ",
      align: "left",
      width: "20em",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value) => (
        <div
          className="truncate text-xs cursor-pointer text-blue-900 hover:text-blue-400 w-48"
          onClick={() => {
            value && setModal({ open: true, data: (value) });
          }}
        >
          {value && JSON.stringify(value)}
        </div>
      ),
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      className: "text-xs",
      align: "center",
      sorter: true,
      render: (value) => dateFormat(value),
    },
  ]);

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

  const fetchDataCount = () => {
    postUrl(sitemode,
      "/api/apilog/error/count",
      {
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (data) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: data },
        }),
      logout,
    );
  };
  const fetchData = () => {
    setDataSource(null);

    postUrl(sitemode,
      "/api/apilog/error",
      {
        page: tableParams.pagination.current - 1,
        pageSize: tableParams.pagination.pageSize,
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (data) => {
        setDataSource(data);
      },
      logout,
    );
  };

  useEffect(fetchDataCount, [tableParams.changed, refresh]);
  useEffect(
    fetchData,
    [
      tableParams.changed,
      refresh,
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

  return (
    <>
      <div className="flex justify-end mt-4">
        <Button shape="circle" onClick={() => setRefresh()}>
          <i className="fa fa-refresh" />
        </Button>
      </div>
      <Table
        className="mt-3 w-full"
        bordered
        size="small"
        scroll={{ x: "auto" }}
        columns={columns}
        rowKey={(record) => record._id}
        dataSource={dataSource}
        loading={dataSource === null}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
      />
      <Modal
        title="Data"
        open={modal.open}
        footer={null}
        onCancel={() => setModal({ open: false, data: {} })}
      >
        {isEmpty(modal.data) ? <div>No data</div> : Object.keys(modal.data).map((item) => (
          <div className="w-full flex" key={item}>
            <div className="w-1/4">{item} : </div>
            <div className="w-3/4">{JSON.stringify(modal.data[item])}</div>
          </div>
        ))}
      </Modal>
    </>
  );
}
