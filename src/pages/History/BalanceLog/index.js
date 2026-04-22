import { Button, Table } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import DoubleDescription from "../../../components/common/DoubleDescription";
import { useAuth } from "../../../context/AuthContext";
import { blockedEmail, postUrl } from "../../../utility";
import { getFilterColumns } from "../../../utility/table";
import DetailBalance from "./DetailBalance";
import { USER_ROLE } from "../../../constants";
import HiddenUsername from "../../../utility/hiddenEmail";
const pageSizeOptions = [10, 20, 50, 100, 500];

export default function BalanceLog() {
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

  const { logout, auth, blockLists , sitemode, prices, siteCurrency } = useAuth();
  const columns = getFilterColumns([
    {
      title: "Username",
      dataIndex: "username",
      sorter: true,
      width: "12em",
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
      align: "center",
      render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },

    {
      title: "Profit on Game",
      dataIndex: "bet",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        ((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: true,
        }) + " " + (prices[siteCurrency]?siteCurrency:"USD"),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },

    {
      title: "Deposit",
      dataIndex: "deposit",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        ((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: true,
        }) + " " + (prices[siteCurrency]?siteCurrency:"USD"),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Referral",
      dataIndex: "referral",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        ((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: true,
        }) + " " + (prices[siteCurrency]?siteCurrency:"USD"),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "withDrawal",
      dataIndex: "withdrawal",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        ((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: true,
        }) + " " + (prices[siteCurrency]?siteCurrency:"USD"),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Bonus",
      dataIndex: "bonus",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value) =>
        ((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: true,
        }) + " " + (prices[siteCurrency]?siteCurrency:"USD"),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    // {
    //   title: "Balance",
    //   dataIndex: "balance",
    //   sorter: true,
    //   width: "10em",
    //   className: "text-xs sm:text-sm md:text-base",
    //   render: (value, all) =>
    //     (
    //       all.bet + all.referral + all.bonus + all.deposit + all.withdrawal || 0
    //     ).toLocaleString("en-US", {
    //       minimumFractionDigits: 0,
    //       maximumFractionDigits: 2,
    //       useGrouping: true,
    //     }) + " $",
    //   align: "right",
    //   onHeaderCell: () => ({ style: { textAlign: "center" } }),
    // },
    {
      title: "Balance",
      dataIndex: "balance",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, all) =>
        (
          ((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1))
        ).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: true,
        }) + " " + (prices[siteCurrency]?siteCurrency:"USD"),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    // {
    //   title: "Total Profit",
    //   dataIndex: "profit",
    //   sorter: true,
    //   width: "10em",
    //   className: "text-xs sm:text-sm md:text-base",
    //   render: (value, all) => (
    //     <span
    //       className={
    //         (all.bet + all.referral + all.bonus > 0
    //           ? "text-green-500"
    //           : "text-red-500") + " font-bold"
    //       }
    //     >
    //       {(all.bet + all.referral + all.bonus || 0).toLocaleString("en-US", {
    //         minimumFractionDigits: 0,
    //         maximumFractionDigits: 2,
    //         useGrouping: true,
    //       }) + " $"}
    //     </span>
    //   ),
    //   align: "right",
    //   onHeaderCell: () => ({ style: { textAlign: "center" } }),
    // },
    {
      title: "Total Profit",
      dataIndex: "profit",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, all) => (
        <span
          className={
            (-all.withdrawal + all.balance - all.deposit > 0
              ? "text-green-500"
              : "text-red-500") + " font-bold"
          }
        >
          {((-all.withdrawal + all.balance - all.deposit || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          }) + " " + (prices[siteCurrency]?siteCurrency:"USD")}
        </span>
      ),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
  ]);
  const fetchDataCount = useCallback(() => {
    postUrl(sitemode,
      "/api/ballance/getBallanceSummarizeCount",
      {
        filters: tableParams.filters,
      },
      (res) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: res },
        }),
      logout
    );
  }, [tableParams.changed]);
  const fetchData = useCallback(() => {

    setData(null);
    postUrl(sitemode,
      "/api/ballance/getBallanceSummarize",
      {
        page: tableParams.pagination.current - 1,
        pageSize: tableParams.pagination.pageSize,
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (res) => setData(res),
      logout
    );
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
        sorter,
      });
    }, 300),
    [tableParams]
  );

  return (
    <>
      {selectedEmail ? (
        <>
          <div className="flex gap-3 items-center font-bold text-[1.2em] mb-3 sticky top-0  z-30 bg-white pt-2">
            <Button
              type="dashed"
              onClick={() => {
                setSelectedEmail(null);
              }}
            >
              <i className="fa fa-arrow-left"></i>
            </Button>
            {auth?.user?.role === USER_ROLE.ADMIN ? selectedEmail.username : HiddenUsername(selectedEmail.username)}
            <div className="flex flex-wrap gap-1">
              <div className="text-[1em] ml-2 px-2 py-1 border-solid border border-[#b33c18] text-[#b33c18] rounded-md">Deposit ({(selectedEmail.deposit/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true,
              })} {prices[siteCurrency]?siteCurrency:"USD"})</div>
              <div className="text-[1em] ml-2 px-2 py-1 border-solid border border-[#b33c18] text-[#b33c18] rounded-md">Withdrawal ({(selectedEmail.withdrawal/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true,
              })} {prices[siteCurrency]?siteCurrency:"USD"})</div>
              <div className="text-[1em] ml-2 px-2 py-1 border-solid border border-[#b33c18] text-[#b33c18] rounded-md">Profit on Game ({(selectedEmail.bet/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true,
              })} {prices[siteCurrency]?siteCurrency:"USD"})</div>
              <div className="text-[1em] ml-2 px-2 py-1 border-solid border border-[#b33c18] text-[#b33c18] rounded-md">Referral ({   (selectedEmail.referral/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true,
              })} {prices[siteCurrency]?siteCurrency:"USD"})</div>
              <div className="text-[1em] ml-2 px-2 py-1 border-solid border border-[#b33c18] text-[#b33c18] rounded-md">Bonus ({ (selectedEmail.bonus/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true,
              })} {prices[siteCurrency]?siteCurrency:"USD"})</div>
              <div className="text-[1em] ml-2 px-2 py-1 border-solid border border-[#b33c18] text-[#b33c18] rounded-md">Balance ({(
                (selectedEmail.balance || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)
              ).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true,
              })} {prices[siteCurrency]?siteCurrency:"USD"})</div>
              <div className="text-[1em] ml-2 px-2 py-1 border-solid border border-[#b33c18] text-[#b33c18] rounded-md">Total Profit {((-selectedEmail.withdrawal + selectedEmail.balance - selectedEmail.deposit)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true,
              })} {prices[siteCurrency]?siteCurrency:"USD"})</div>
            </div>

          </div>
          <DetailBalance username={selectedEmail.username} />
        </>
      ) : (
        <>
          <Table
            className="pt-2"
            size="small"
            bordered
            columns={columns}
            scroll={{ x: "auto" }}
            rowKey={(record) => record._id}
            dataSource={data}
            loading={data === null}
            pagination={tableParams.pagination}
            onChange={handleTableChange}
            onRow={(record, index) => ({
              onDoubleClick: (event) => {
                setSelectedEmail(record);
              },
              style: { cursor: "pointer" },
            })}
          />
          <DoubleDescription />
        </>
      )}
    </>
  );
}
