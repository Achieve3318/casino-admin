import { Table } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { TruncateMiddle } from "../../../utility/address";
import { getFilterColumns } from "../../../utility/table";
import { dateFormat } from "../../../utility/date";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const pageSizeOptions = [10, 20, 50, 100, 500];

const Subscription = () => {
  const [data, setData] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

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
  const { logout , sitemode } = useAuth();
  const columns = getFilterColumns([
    {
      title: "ID",
      dataIndex: "id",
      width: "17em",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
    },
    {
      title: "Type",
      dataIndex: "type",
      sorter: true,
      align: "center",
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "Attribute",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      children: [
        {
          title: "Address",
          dataIndex: "attr",
          key: "address",
          sorter: true,
          isFilter: true,
          className: "text-xs sm:text-sm md:text-base",
          align: "center",
          render: (v) => (
            <TruncateMiddle
              text={v.address}
              maxLength={16}
              showTooltip={true}
            />
          ),
        },
        {
          title: "Chain",
          dataIndex: "attr",
          key: "chain",
          sorter: true,
          className: "text-xs sm:text-sm md:text-base",
          align: "center",
          render: (v) => v.chain,
        },
        {
          title: "Address",
          dataIndex: "attr",
          sorter: true,
          className: "text-xs sm:text-sm md:text-base",
          align: "center",
          render: (v) => v.url,
        },
      ],
      // render: v => JSON.stringify(v)
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      sorter: true,
      align: "center",
      render: (value) => dateFormat(value),
    }
  ]);
  const fetchDataCount = () => {
    postUrl2Pro(
      "/api/transactions/subscription/get/count",
      {
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (res) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: res },
        }),

      logout,
    );
  };
  const fetchData = () => {
    setData(null);
    postUrl2Pro(
      "/api/transactions/subscription/get",
      {
        page: tableParams.pagination.current - 1,
        pageSize: tableParams.pagination.pageSize,
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (data) => setData(data),
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
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  return (
    <>
      <Table
        className="mt-4"
        size="small"
        bordered
        columns={columns}
        rowSelection={rowSelection}
        scroll={{ x: "auto" }}
        rowKey={(record) => record._id}
        dataSource={data}
        loading={data === null}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
      />
    </>
  );
};

export default Subscription;
