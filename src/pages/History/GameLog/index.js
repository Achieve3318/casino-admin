import { Badge, Button, Spin, Table } from "antd";
import { debounce, sortBy } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import DoubleDescription from "../../../components/common/DoubleDescription";
import { useAuth } from "../../../context/AuthContext";
import { blockedEmail, postUrl } from "../../../utility";
import { success } from "../../../utility/notification";
import { getFilterColumns } from "../../../utility/table";
import HistoryModal from "./HistoryModal";
import HiddenUsername from "../../../utility/hiddenEmail";
import { USER_ROLE } from "../../../constants";

const pageSizeOptions = [10, 20, 50, 100];

export default function HistoryLog() {
  const [data, setData] = useState(null);
  const [crashLoading, setCrashLoading] = useState(false);
  const [slideLoading, setSlideLoading] = useState(false);
  const [crashSeeds, setCrashSeed] = useState(null);
  const [slideSeeds, setClientSeed] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState("");
  const { logout, auth, blockLists , sitemode, prices, siteCurrency } = useAuth();

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

  const columns = getFilterColumns([
    {
      title: "Username",
      dataIndex: "username",
      width: "10em",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      isFilter: true,
      render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },
    {
      title: "All Bet Count",
      dataIndex: "totalBet",
      width: "7em",
      className: "text-xs sm:text-sm md:text-base",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      sorter: true,
    },
    {
      title: "All Win Count",
      dataIndex: "totalWin",
      width: "7em",
      className: "text-xs sm:text-sm md:text-base",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      sorter: true,
    },
    {
      title: "All Bet Amount",
      dataIndex: "totalBetAmount",
      width: "10em",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
      align: "right",
      render: (value, all) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          }) + " " + (prices[siteCurrency]?siteCurrency:"USD")}
        </>
      ),
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "WinAmount",
      dataIndex: "totalWinAmount",
      sorter: true,
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, all) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          }) + " " + (prices[siteCurrency]?siteCurrency:"USD")}
        </>
      ),

      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Profit",
      dataIndex: "profit",
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, all) => (
        <span
          className={`font-bold ${all.totalWinAmount - all.totalBetAmount > 0 ? "text-green-500" : "text-red-500"}`}
        >
          {((all.totalWinAmount - all.totalBetAmount || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString(
            "en-US",
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
              useGrouping: true,
            },
          ) + " " + (prices[siteCurrency]?siteCurrency:"USD")}
        </span>
      ),

      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
  ]);

  const fetchDataCount = () => {
    postUrl(sitemode,"/api/dailySummary/getAllCount", {
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
    postUrl(sitemode,"/api/dailySummary/getAll", {
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
        sorter,
      });
    }, 300),
    [tableParams]
  );


  const crashSeed = () => {
    setCrashLoading(true);
    postUrl(sitemode,"/api/seed/createSeed", {
      game: "crash",
    },
      (res) => {
        setCrashLoading(false);
        success("Created crash seed successfully.");
      }
      , logout
    )
  };

  useEffect(() => {
    postUrl(sitemode,"/api/seed/getCSSeed", {
      game: "crash",
    },
      (res) => {
        setCrashSeed(res.nonce);
      }
      , logout
    )


    postUrl(sitemode,"/api/seed/getCSSeed", {
      game: "slide",
    },
      (res) => {
        setClientSeed(res.nonce);
      }
      , logout
    )
  }, []);

  const slideSeed = () => {
    setSlideLoading(true);
    postUrl(sitemode,"/api/seed/createSeed", {
      game: "slide",
    },
      (res) => {
        setSlideLoading(false);
        success("Created crash seed successfully.");
      }
      , logout
    )
  };


  return (
    <>
      <div className="w-full flex justify-end mt-3 ">
        <div className="flex">
          <Button disabled={crashLoading} type="primary" onClick={crashSeed}>
            {crashLoading ? <Spin size="small" /> : ""}
            <span className="text-[0.9em]">New Crash Seed</span>
          </Button>
          <Badge
            count={crashSeeds}
            className="mr-2 text-[0.8em]"
            overflowCount={Infinity}
          />
          <Button disabled={slideLoading} type="primary" onClick={slideSeed}>
            {slideLoading ? <Spin size="small" /> : ""}
            <span className="text-[0.9em]">New Slide </span>
          </Button>
          <Badge count={slideSeeds} className="ml-2" overflowCount={Infinity} />
          {/* <Button
            disabled={refNonceLoading}
            type="primary"
            onClick={refreshSeed}
          >
            {slideLoading ? <Spin size="small" /> : ""}
            <span className="text-[0.9em]">Refresh Seed Nonce</span>
          </Button> */}
        </div>
      </div>
      {selectedEmail ? (
        ""
      ) : (
        <>
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

      {selectedEmail ? (
        <>
          <div className="flex gap-3 items-center font-bold text-[1.2em] mt-3 sticky top-0 z-30 bg-white">
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
              <div className="text-[1em] px-2 py-1 border-solid border border-[#a600ff] text-[#a600ff] rounded-md">Win / Bet
                <span className="text-black ml-2">
                  (<span className=" text-[#18b318]">{selectedEmail.totalWin}</span> / {selectedEmail.totalBet})
                </span>
              </div>
              <div className="text-[1em] px-2 py-1 border-solid border border-[#d37700] text-[#d37700] rounded-md">Win / Bet Amount
                <span className="text-black ml-2">
                  (<span className=" text-[#18b318]">{(selectedEmail.totalWinAmount/(prices[siteCurrency]?prices[siteCurrency]:1)).toFixed(2)} {prices[siteCurrency]?siteCurrency:"USD"}</span> / {(selectedEmail.totalBetAmount/(prices[siteCurrency]?prices[siteCurrency]:1)).toFixed(2)} {prices[siteCurrency]?siteCurrency:"USD"})
                </span>
              </div>
              <div className={`text-[1em] px-2 py-1 border-solid border ${(selectedEmail.totalWinAmount - selectedEmail.totalBetAmount) > 0 ? "border-[#18b318] text-[#18b318]" : "border-[#ff0000] text-[#ff0000]"} rounded-md`}>Profit ({((selectedEmail.totalWinAmount - selectedEmail.totalBetAmount || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                  useGrouping: true,
                },
              ) + " " + (prices[siteCurrency]?siteCurrency:"USD")})</div>

            </div>
          </div>
          <HistoryModal email={selectedEmail.username} />
        </>
      ) : (
        ""
      )}
    </>
  );
}
