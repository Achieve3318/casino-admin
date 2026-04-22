import { Button, Table } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { postUrl } from "../../../utility";
import { getFilterColumns } from "../../../utility/table";
import DepositLog from "./DepositLog";
import WithdrawLog from "./WithdrawLog";
import { USER_ROLE } from "../../../constants";
import HiddenUsername from "../../../utility/hiddenEmail";
import { blockedEmail } from "../../../utility";
const pageSizeOptions = [10, 20, 50, 100, 500];

export default function Payment() {
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
    filters: {},
    sorter: {},
  });
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedCol, setSelectedCol] = useState("");

  const { logout, auth, blockLists , sitemode , prices , siteCurrency } = useAuth();
  const columns = getFilterColumns([
    {
      title: "Username",
      dataIndex: "username",
      sorter: true,
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      render: (text) =>
        blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },

    {
      title: "Deposit",
      dataIndex: "deposit",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (v, all) => (
        v === 0 ? "" : 
        <div className="cursor-pointer text-blue-500 underline">
          {((v || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          }) + " " + (prices[siteCurrency]?siteCurrency:"USD")}
        </div>
      ),
      onCell: (record, index) => ({
        onClick: (event) => {
          setSelectedEmail(record);
          setSelectedCol("Deposit");
        },
      }),
    },

    {
      title: "Withdrawal",
      dataIndex: "withdrawal",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base ",

      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (v, all) => (
        v === 0 ? "" : 
        <div className="cursor-pointer text-blue-500 underline">
          {((v || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          }) + " " + (prices[siteCurrency]?siteCurrency:"USD")}
        </div>
      ),
      onCell: (record, index) => ({
        onClick: (event) => {
          if (record.withdrawal === 0) return;
          setSelectedEmail(record);
          setSelectedCol("Withdrawal");
        },
      }),
    },

    {
      title: "Summarize",
      dataIndex: "summarize",
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, all) =>
        (((all.deposit + all.withdrawal || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: true,
        }) + " " + (prices[siteCurrency]?siteCurrency:"USD")),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
  ]);
  const fetchDataCount = useCallback(() => {
    postUrl(sitemode,"/api/ballance/getBallanceSummarizeCount", {
      filters: tableParams.filters,
    },
      (res) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: res },
        })
      , logout
    )
  }, [tableParams.changed]);
  const fetchData = useCallback(() => {

    setData(null);
    postUrl(sitemode,"/api/ballance/getBallanceSummarize", {
      page: tableParams.pagination.current - 1,
      pageSize: tableParams.pagination.pageSize,
      filters: tableParams.filters,
      sorter: tableParams.sorter,
    },
      (res) => setData(res)
      , logout
    )
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
        filters,
        sorter: { field: sorter.field, order: sorter.order },
      });
    }, 300),
    [tableParams]
  );

  return (
    <>
      {selectedEmail && selectedCol === "Deposit" ? (
        <>
          <div className="flex gap-3 items-center font-bold text-[1.2em] mb-3 mt-4">
            <Button
              type="dashed"
              onClick={() => {
                setSelectedEmail(null);
              }}
            >
              <i className="fa fa-arrow-left"></i>
            </Button>
            {selectedCol + " of " + (auth?.user?.role === USER_ROLE.ADMIN ? selectedEmail.username : HiddenUsername(selectedEmail.username))}
            <div className="text-[1em] ml-2 px-2 py-1 border-solid border border-[#b15125] text-[#b15125] rounded-md">Deposit ({((selectedEmail.deposit)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
              useGrouping: true,
            }) + " " + (prices[siteCurrency]?siteCurrency:"USD")})</div>

          </div>
          <DepositLog username={selectedEmail.username} />
        </>
      ) : selectedEmail && selectedCol === "Withdrawal" ? (
        <>
          <div className="flex gap-3 items-center font-bold text-[1.2em] mb-3 mt-4">
            <Button
              type="dashed"
              onClick={() => {
                setSelectedEmail(null);
              }}
            >
              <i className="fa fa-arrow-left"></i>
            </Button>
            {selectedCol + " of " + (auth?.user?.role === USER_ROLE.ADMIN ? selectedEmail.username : HiddenUsername(selectedEmail.username))}
            <div className="text-[1em] ml-2 px-2 py-1 border-solid border border-[#b15125] text-[#b15125] rounded-md">Withdrawal ({((selectedEmail.withdrawal)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
              useGrouping: true,
            }) + " " + (prices[siteCurrency]?siteCurrency:"USD")})</div>
          </div>
          <WithdrawLog username={selectedEmail.username} />
        </>
      ) : (
        <Table
          size="small"
          className="mt-4"
          bordered
          columns={columns}
          scroll={{ x: "auto" }}
          rowKey={(record) => record._id}
          dataSource={data}
          loading={data === null}
          pagination={tableParams.pagination}
          onChange={handleTableChange}
        />

      )}
    </>
  );
}
