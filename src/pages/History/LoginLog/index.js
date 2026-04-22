import { Table, Tag } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { USER_ROLE } from "../../../constants";
import { useAuth } from "../../../context/AuthContext";
import { blockedEmail, postUrl } from "../../../utility";
import { dateFormat } from "../../../utility/date";
import { getFilterColumns } from "../../../utility/table";
import HiddenUsername from "../../../utility/hiddenEmail";

const pageSizeOptions = [10, 20, 50, 100, 500];



const UserLoginLog = () => {
  const [data, setData] = useState(null);
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
    filters: {},
    sorter: {
      field: "createdAt",
      order: "descend",
    },
  });
  const { logout, auth, blockLists , sitemode } = useAuth();



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
      title: "User",
      dataIndex: "user",
      sorter: true,
      className: "text-xs sm: text-sm md:text-base",
      align: "center",
      render: (user) => user.displayName,
    },
    {
      title: "Username",
      dataIndex: "username",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      render: (text) =>
        blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      className: "text-xs sm:text-sm md:text-base",
      render: (data) => dateFormat(data),
      sorter: true,
      align: "center",
    },
    {
      title: "IP",
      dataIndex: "ip",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      render: (ip) => ip.split(":")[ip.split(":").length - 1],
    },
    {
      title: "Near",
      dataIndex: "geo",
      className: "text-xs sm:text-sm md:text-base",
      render: (geo) => (geo ? geo.country + ", " + geo.city : ""),
      align: "center",
    },
    {
      title: "Type",
      dataIndex: "client",
      className: "text-xs sm:text-sm md:text-base",
      render: ({ type }) => type,
      align: "center",
    },
    {
      title: "Browser",
      dataIndex: "client",
      className: "text-xs sm:text-sm md:text-base",
      render: ({ name }) => name,
      align: "center",
    },
    {
      title: "Device",
      dataIndex: "device",
      className: "text-xs sm:text-sm md:text-base",
      render: ({ type }) => type,
      align: "center",
    },
    {
      title: "OS",
      dataIndex: "_",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, row) => (
        <div>{row.os.name + " " + row.os.version + " " + row.os.platform}</div>
      ),
      align: "center",
    },
    
    {

      title: "Mannual",
      dataIndex: "mn",
      isFilter: true,
      className: "text-xs sm:text-sm md:text-base",
      render: (mn, record) =>
        mn === 'Mannual' ?
          <Tag color="cyan">Mannual</Tag> : <></>,
      align: "center",
    }
  ]);

  const fetchDataCount = () => {
    postUrl(sitemode,"/api/userLogin/getLoginPagiCount", {
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
    setData(null);
    postUrl(sitemode,"/api/userLogin/getLoginPagiList", {
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
        filters,
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
};

const AdminLoginLog = () => {
  const [data, setData] = useState(null);
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
    filters: {},
    sorter: {
      field: "createdAt",
      order: "descend",
    },
  });
  const { logout, auth, blockLists , sitemode } = useAuth();


  const columns1 = getFilterColumns([
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
      title: "User",
      dataIndex: "user",
      sorter: true,
      className: "text-xs sm: text-sm md:text-base",
      align: "center",
      render: (user) => user.displayName,
    },
    {
      title: "Username",
      dataIndex: "username",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      className: "text-xs sm:text-sm md:text-base",
      render: (data) => dateFormat(data),
      sorter: true,
      align: "center",
    },
    {
      title: "IP",
      dataIndex: "ip",
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      render: (ip) => ip.split(":")[ip.split(":").length - 1],
    },
    {
      title: "Code",
      dataIndex: "code",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      isFilter: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      filters: [
        { text: "Success", value: true },
        { text: "Expired", value: false },
      ],
      render: (status, row) =>
        status === true ? (
          <Tag color="cyan">success</Tag>
        ) : row.expired === true ? (
          <Tag color="red">expired</Tag>
        ) : (
          ""
        ),
    },
    {
      title: "Near",
      dataIndex: "geo",
      className: "text-xs sm:text-sm md:text-base",
      render: (geo) => (geo ? geo.country + ", " + geo.city : ""),
      align: "center",
    },
    {
      title: "Device",
      dataIndex: "device",
      isFilter: true,
      className: "text-xs sm:text-sm md:text-base",
      render: (_, record) =>
        `${record.client.name} ${record.device.type} ${record.os.name} ${record.os.version} ${record.os.platform}`,
      align: "center",
    }
  ]);

  const fetchDataCount = () => {
    postUrl(sitemode,"/api/userLogin/admin/getLoginPagiCount", {
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
    setData(null);
    postUrl(sitemode,"/api/userLogin/admin/getLoginPagiList", {
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
        filters,
        sorter: { field: sorter.field, order: sorter.order },
      });
    }, 300),
    [tableParams]
  );

  return (
    <Table
      size="small"
      bordered
      columns={columns1}
      scroll={{ x: "auto" }}
      rowKey={(record) => record._id}
      dataSource={data}
      loading={data === null}
      pagination={tableParams.pagination}
      onChange={handleTableChange}
    />
  );
};

const LoginLog = () => {
  const { auth , sitemode } = useAuth();

  if (auth.user.role === USER_ROLE.ADMIN)
    return (
      <div className="mt-4">
        <UserLoginLog />
        <AdminLoginLog />
      </div>
    );
  return (
    <>
      <UserLoginLog />
    </>
  );
};

export default LoginLog;
