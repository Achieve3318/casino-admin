import { Modal, Table, Tag, Tooltip } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { blockedEmail } from "../../../utility";
import { TruncateMiddle } from "../../../utility/address";
import { dateFormat } from "../../../utility/date";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";
import HiddenUsername from "../../../utility/hiddenEmail";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const pageSizeOptions = [10, 20, 50, 100, 500];

const Withdrawal = () => {
  const [data, setData] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modal, setModal] = useState({ open: false, data: [] });

  const { coins, auth, logout, blockLists , sitemode } = useAuth();
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
      field: "updatedAt",
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
      title: "Username",
      dataIndex: "username",
      sorter: true,
      align: "center",
      width: "14em",
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },

    {
      title: "Amount",
      dataIndex: "amount",
      sorter: true,
      align: "right",
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        value.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 8,
          useGrouping: true,
        }),
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Fee",
      dataIndex: "fee",
      sorter: true,
      width: "8em",
      align: "right",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        value.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 8,
          useGrouping: true,
        }),
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Currency",
      dataIndex: "currency",
      sorter: true,
      width: "10em",
      align: "center",
      className: "text-xs sm:text-sm md:text-base",
      render: (v) => (
        <>
          <img src={coins[v]} className="w-[1em] mr-2" />
          {v}
        </>
      ),
      isFilter: true,
    },
    {
      title: "Network",
      dataIndex: "network",
      sorter: true,
      align: "center",
      isFilter: true,
      width: "9em",
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: true,
      align: "center",
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (v, all) =>
        v === "Completed" ? (
          <Tag color="green">{v}</Tag>
        ) : v === "Canceled" ? (
          <Tooltip title={all.cancelReason}><Tag color="red">{v}</Tag></Tooltip>
        ) : v === "Failed" ? (
          <Tag color="pink">{v}</Tag>
        ) : (
          <Tag color="default">{v}</Tag>
        ),
      filters: [
        { text: "Completed", value: "Completed" },
        { text: "Canceled", value: "Canceled" },
        { text: "Failed", value: "Failed" },
        { text: "InProgress", value: "InProgress" },
      ],
    },
    {
      title: "Confirm Type",
      dataIndex: "confirmType",
      sorter: true,
      align: "center",
      width: "13em",
      className: "text-xs sm:text-sm md:text-base",
      render: (v) =>
        v === "Manual" ? (
          <Tag color="cyan">{v}</Tag>
        ) : v === "Auto" ? (
          <Tag color="magenta">{v}</Tag>
        ) : (
          ""
        ),
      filters: [
        { text: "Manual", value: "Manual" },
        { text: "Auto", value: "Auto" },
      ],
    },
    {
      title: "Address",
      dataIndex: "address",
      sorter: true,
      align: "center",
      isFilter: true,
      width: "15em",
      className: "text-xs sm:text-sm md:text-base",
      render: (v) => (
        <TruncateMiddle text={v} maxLength={16} showTooltip={true} />
      ),
    },

    {
      title: "Reason/TxId",
      dataIndex: "reason",
      width: "12em",
      align: "center",
      className: "text-xs sm:text-sm md:text-base",
      render: (v, all) => <a onClick={() => {
        try {
          setModal({
            open: true,
            data: JSON.parse(v)
          })
        }
        catch (e) {
          setModal({
            open: true,
            data: all.status === "Completed" ? { txId: v } : { reason: v }
          })
        }
      }}
      >View</a>
    },
    {
      title: "Ip Address",
      dataIndex: "ipaddress",
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      sorter: true,
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
      render: v => dateFormat(v)
    },
    {
      title: "Confirmed",
      dataIndex: "updatedAt",
      sorter: true,
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
      render: v => dateFormat(v)
    },
  ]);
  const fetchDataCount = () => {
    postUrl2Pro(
      "/api/transactions/withdrawal/get/count",
      {
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      }
      ,
      (res) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: res },
        }),

      logout
    );
  };
  const fetchData = () => {
    setData(null);
    postUrl2Pro(
      "/api/transactions/withdrawal/get",
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

      <Modal
        title="Reason"
        open={modal.open}
        footer={null}
        onCancel={() => setModal({ open: false, data: [] })}
      >
        {Object.keys(modal.data).map((item) => (
          <div key={item} className="w-full flex">
            <div className="w-1/4">{item} : </div>
            <div className="w-3/4">{item === "txId" ? <TruncateMiddle text={modal.data[item]} maxLength={32} showTooltip={true} /> : JSON.stringify(modal.data[item])}</div>
          </div>
        ))}
      </Modal>
    </>
  );
};

export default Withdrawal;
