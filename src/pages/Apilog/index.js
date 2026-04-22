import { CaretRightOutlined } from "@ant-design/icons";
import { Button, Collapse, Form, Modal, Table, Tag } from "antd";
import { debounce } from "lodash";
import moment from "moment";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { postUrl } from "../../utility";
import { getFilterColumns } from "../../utility/table";
import "./customStyle.css";
import { USER_ROLE } from "../../constants";
import { dateFormat } from "../../utility/date";

const pageSizeOptions = [10, 20, 50, 100];

export default function APILog() {
  const [refresh, setRefresh] = useReducer((f) => !f);
  const [dataSource, setDataSource] = useState(null);
  const [modal, setModal] = useState({ open: false, data: [] });
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
      title: "Method",
      dataIndex: "method",
      sorter: true,
      className: "text-xs",
      align: "center",
      isFilter: true,
    },
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      className: "text-xs",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      isFilter: true,
      align: "left",
      sorter: true,
    },
    {
      title: "IP",
      dataIndex: "ip",
      isFilter: true,
      width: "7em",
      align: "center",
      sorter: true,
      render: (value) => value.split(":")[value.split(":").length - 1],
    },
    {
      title: "Status",
      dataIndex: "statusCode",
      align: "center",
      width: "5em",
      sorter: true,
      render: (status) =>
        Number(status) > 400 ? (
          <Tag color="red">{status}</Tag>
        ) : (
          <Tag color="green">{status}</Tag>
        ),
    },
    {
      title: "Headers",
      dataIndex: "headers",
      className: "text-xs overflow-hidden text-ellipsis whitespace-nowrap ",
      align: "left",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value) => (
        <div
          className="truncate text-xs cursor-pointer text-blue-900 hover:text-blue-400 w-48"
          onClick={() =>
            setModal({
              open: true,
              data: Array.isArray(value) ? value : [value],
            })
          }
        >
          {JSON.stringify(value || {})}
        </div>
      ),
    },
    {
      title: "Response",
      dataIndex: "responseBody",
      className: "text-xs overflow-hidden text-ellipsis whitespace-nowrap ",
      align: "left",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value) => (
        <div
          className="truncate text-xs cursor-pointer text-blue-900 hover:text-blue-400 w-48"
          onClick={() => {
            const data = JSON.parse(value || "[{}]");
            setModal({ open: true, data: Array.isArray(data) ? data : [data] });
          }}
        >
          {value}
        </div>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      className: "text-xs",
      sorter: true,
      align: "center",
      render: (value) => dateFormat(value),
    },
    {
      title: "duration",
      dataIndex: "duration",
      className: "text-xs",
      align: "center",
      render: (value) => value + "ms",
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
      "/api/apilog/get/count",
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
      "/api/apilog/get",
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

  useEffect(() => {
    fetchDataCount();
    fetchData();
  }, [refresh]);

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
        onCancel={() => setModal({ open: false, data: [] })}
      >
        {modal.data.length === 0 ? (
          ""
        ) : modal.data.length === 1 ? (
          <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            {Object.keys(modal.data[0]).map((key) => (
              <Form.Item label={key} key={key}>
                {JSON.stringify(modal.data[0][key])}
              </Form.Item>
            ))}
          </Form>
        ) : (
          <Collapse
            accordion
            defaultActiveKey={0}
            expandIcon={({ isActive }) => (
              <CaretRightOutlined rotate={isActive ? 90 : 0} />
            )}
            items={modal.data.map((row, key) => ({
              key,
              label: (
                <div className="text-xs overflow-hidden text-ellipsis whitespace-nowrap truncate">
                  {JSON.stringify(row)}
                </div>
              ),
              children: (
                <Form
                  labelCol={{ span: 8 }}
                  wrapperCol={{ span: 16 }}
                  size="small"
                >
                  {Object.keys(row).map((key) => (
                    <Form.Item key={key} label={key} className="mb-1 text-xs">
                      {JSON.stringify(row[key])}
                    </Form.Item>
                  ))}
                </Form>
              ),
              style: { width: "100%" },
            }))}
          />
        )}
      </Modal>
    </>
  );
}
