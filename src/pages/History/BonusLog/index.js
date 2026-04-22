import { AntDesignOutlined } from "@ant-design/icons";
import {
  Badge,
  Button,
  InputNumber,
  Modal,
  notification,
  Table,
  Tag,
} from "antd";
import moment from "moment";
import React, { useEffect, useReducer, useState } from "react";
import DoubleDescription from "../../../components/common/DoubleDescription";
import { USER_ROLE } from "../../../constants/index";
import { useAuth } from "../../../context/AuthContext";
import { dateFormat } from "../../../utility/date";
import postUrl from "../../../utility/postUrl";
import HiddenUsername from "../../../utility/hiddenEmail";
import { blockedEmail } from "../../../utility";

export default function BonusLog() {
  const { logout, auth, blockLists , sitemode, prices, siteCurrency } = useAuth();
  const [data, setData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [selRow, setSelRow] = useState(null);
  const [refresh, setRefresh] = useReducer((f) => !f);
  const [modal, setModal] = useState({ open: false, amount: 0 });
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {},
    sorter: {},
  });


  const detailcolumns = [
    ...(auth?.user?.role === USER_ROLE.ADMIN
      ? [
        {
          title: "ID",
          dataIndex: "_id",
          sorter: true,
          width: "15em",
          align: "center",
        },
      ]
      : []),
    {
      title: "Date",
      dataIndex: "createdAt",
      sorter: (a, b) => moment(a) > moment(b),
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      render: (time) => dateFormat(time),
    },
    {
      title: "BetBonus",
      dataIndex: "bonus",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      render: (bonus) =>
        bonus && bonus.bet ? (
          bonus.bet.level ? (
            bonus.bet.claimed ? (
              <Badge count={"Claimed"}>
                <Tag color="red">Level: {bonus.bet.level}</Tag>
                <Tag color="cyan">
                  {((bonus.bet.pointsRequired * bonus.bet.rewardPercentage * 0.01)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })} {prices[siteCurrency]?siteCurrency:"USD"}
                </Tag>
              </Badge>
            ) : (
              <>
                <Tag color="red">Level: {bonus.bet.level}</Tag>
                <Tag color="cyan">
                  {((bonus.bet.pointsRequired * bonus.bet.rewardPercentage * 0.01)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })} {prices[siteCurrency]?siteCurrency:"USD"}
                </Tag>
              </>
            )
          ) : (
            ""
          )
        ) : (
          ""
        ),
    },
    {
      title: "LossBonus",
      dataIndex: "bonus",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      render: (bonus) =>
        bonus && bonus.loss ? (
          bonus.loss.level ? (
            bonus.loss.claimed ? (
              <Badge count={"Claimed"}>
                <Tag color="red">Level: {bonus.loss.level}</Tag>
                <Tag color="cyan">
                  {((bonus.loss.pointsRequired * bonus.loss.rewardPercentage * 0.01)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })} {prices[siteCurrency]?siteCurrency:"USD"}
                </Tag>
              </Badge>
            ) : (
              <>
                <Tag color="red">Level: {bonus.loss.level}</Tag>
                <Tag color="cyan">
                  {((bonus.loss.pointsRequired * bonus.loss.rewardPercentage * 0.01)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })} {prices[siteCurrency]?siteCurrency:"USD"}
                </Tag>
              </>
            )
          ) : (
            ""
          )
        ) : (
          ""
        ),
    },
    {
      title: "VIPBonus",
      dataIndex: "bonus",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      render: (bonus) =>
        bonus && bonus.vip ? (
          bonus.vip.claimed ? (
            <Badge count={"Claimed"}>
              <Tag color="red">{((bonus.vip.amount)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true,
              })} {prices[siteCurrency]?siteCurrency:"USD"}</Tag>
            </Badge>
          ) : (
            <>
              <Tag color="red">{((bonus.vip.amount)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true,
              })} {prices[siteCurrency]?siteCurrency:"USD"}</Tag>
            </>
          )
        ) : (
          ""
        ),
    },
  ];

  const columns = [
    {
      title: "Username",
      dataIndex: "_id",
      sorter: (a, b) =>
        (a || "").toString().localeCompare((b || "").toString()),
      className: "text-xs sm:text-sm md:text-base cursor-pointer",
      align: "center",
      onFilter: (value, record) => record.name.indexOf(value) === 0,
      render: (text) =>
        blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },
    {
      title: "BetBonus",
      dataIndex: "totalBet",
      sorter: (a, b) => a > b,
      className: "text-xs sm:text-sm md:text-base  cursor-pointer",
      align: "center",
      render: (value) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          })}{" "}
          {prices[siteCurrency]?siteCurrency:"USD"}
        </>
      ),
    },
    {
      title: "LossBonus",
      dataIndex: "totalLoss",
      sorter: (a, b) => a > b,
      className: "text-xs sm:text-sm md:text-base cursor-pointer",
      align: "center",
      render: (value) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          })}{" "}
          {prices[siteCurrency]?siteCurrency:"USD"}
        </>
      ),
    },
    {
      title: "VIPBonus",
      dataIndex: "totalVIP",
      sorter: (a, b) => a > b,
      className: "text-xs sm:text-sm md:text-base cursor-pointer",
      align: "center",
      render: (value) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          })}{" "}
          {prices[siteCurrency]?siteCurrency:"USD"}
        </>
      ),
    },
    {
      title: "Login Bonus",
      dataIndex: "totalLogin",
      sorter: (a, b) => a > b,
      className: "text-xs sm:text-sm md:text-base cursor-pointer",
      align: "center",
      render: (value) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          })}{" "}
          {prices[siteCurrency]?siteCurrency:"USD"}
        </>
      ),
    },
    {
      title: "Deposit Bonus",
      dataIndex: "totalDeposit",
      sorter: (a, b) => a > b,
      className: "text-xs sm:text-sm md:text-base cursor-pointer",
      align: "center",
      render: (value) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          })}{" "}
          {prices[siteCurrency]?siteCurrency:"USD"}
        </>
      ),
    },
    {
      title: "Spin Bonus",
      dataIndex: "totalSpin",
      sorter: (a, b) => a > b,
      className: "text-xs sm:text-sm md:text-base cursor-pointer",
      align: "center",
      render: (value) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          })}{" "}
          {prices[siteCurrency]?siteCurrency:"USD"}
        </>
      ),
    },
    {
      title: "Bonus Card",
      dataIndex: "totalCard",
      sorter: (a, b) => a > b,
      className: "text-xs sm:text-sm md:text-base cursor-pointer",
      align: "center",
      render: (value) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          })}{" "}
          {prices[siteCurrency]?siteCurrency:"USD"}
        </>
      ),
    },
    {
      title: "Cattea Bonus",
      dataIndex: "totalCattea",
      sorter: (a, b) => a > b,
      className: "text-xs sm:text-sm md:text-base cursor-pointer",
      align: "center",
      render: (value) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          })}{" "}
          {prices[siteCurrency]?siteCurrency:"USD"}
        </>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalBonus",
      sorter: (a, b) => a > b,
      className: "text-xs sm:text-sm md:text-base cursor-pointer",
      align: "center",
      render: (value) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
          })}{" "}
          {prices[siteCurrency]?siteCurrency:"USD"}
        </>
      ),
    },
  ];

  useEffect(() => {
    postUrl(sitemode,
      "/api/statistic/admin/usersBonus",
      {},
      (data) => setData(data),
      logout
    );
  }, [logout, refresh]);

  useEffect(() => {
    if (!selRow) return;
    setDetailData(null);
    postUrl(sitemode,
      "/api/statistic/admin/userBonus",
      { username: selRow._id },
      (data) => setDetailData(data),
      logout
    );
  }, [logout, refresh, selRow]);

  const handleClaimVIP = () => {
    if (loading === true || modal.amount <= 0) return;
    setLoading(true);
    postUrl(sitemode,
      "/api/bonus/vip/claim",
      { username: selRow._id, amount: modal.amount },
      (data) => {
        if (data.message === "success") {
          notification.success({
            message: "Success",
            description: "VIP Claim Success",
          });
          setRefresh();
          setModal({ open: false, amount: 0 });
        }
        setLoading(false);
      },
      logout,
      () => setLoading(false)
    );
  };

  return !selRow ? (
    <>
      <Table
        size="small"
        className="mt-4"
        columns={columns}
        scroll={{ x: "auto" }}
        dataSource={data || []}
        loading={data === null}
        onRow={(record, index) => ({
          onDoubleClick: (event) => {
            setSelRow(record);
          },
        })}
      />
      <DoubleDescription />
    </>
  ) : (
    <div className="mt-4">
      <div className="flex justify-between flex-wrap gap-2">
        <div
          className="flex gap-3 items-center font-bold text-[1.2em] mb-3 cursor-pointer"
          onClick={() => setSelRow(null)}
        >
          <Button type="dashed" onClick={() => setSelRow(null)}>
            <i className="fa fa-arrow-left"></i>
          </Button>
          {auth?.user?.role === USER_ROLE.ADMIN ? selRow?._id : HiddenUsername(selRow?._id)}
          <div>
            <div className="flex flex-wrap gap-2">
              <div className="text-[1em] px-2 py-1 border-solid border border-[#a600ff] text-[#a600ff] rounded-md">
                Bet Bonus ({((selRow.totalBet)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                  useGrouping: true,
                })} {prices[siteCurrency]?siteCurrency:"USD"})
              </div>
              <div className="text-[1em]  px-2 py-1 border-solid border border-[#ff0000] text-[#ff0000] rounded-md">
                Loss Bonus ({((selRow.totalLoss)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                  useGrouping: true,
                })} {prices[siteCurrency]?siteCurrency:"USD"})
              </div>
              <div className="text-[1em]  px-2 py-1 border-solid border border-[#ff00ae] text-[#ff00ae] rounded-md">
                VIP Bonus ({((selRow.totalVIP)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                  useGrouping: true,
                })} {prices[siteCurrency]?siteCurrency:"USD"})
              </div>
              <div className="text-[1em]  px-2 py-1 border-solid border border-[#18b318] text-[#18b318] rounded-md">
                Total Bonus (
                {((selRow.totalVIP + selRow.totalLoss + selRow.totalBet)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                  useGrouping: true,
                })} {prices[siteCurrency]?siteCurrency:"USD"})
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end mb-2">
        {auth && auth.user && auth.user.role === USER_ROLE.ADMIN && (
          <Button
            type="primary"
            size="large"
            icon={<AntDesignOutlined />}
            onClick={() => setModal({ open: true, amount: 0 })}
          >
            Claim VIP Bonus
          </Button>
        )}
      </div>
      <Table
        size="small"
        scroll={{ x: "auto" }}
        columns={detailcolumns}
        dataSource={detailData || []}
        loading={detailData === null}
      />

      <Modal
        title={"VIP"}
        open={modal.open}
        onCancel={() => setModal({ open: false, amount: 0 })}
        onOk={handleClaimVIP}
      >
        <InputNumber
          addonAfter="$"
          value={modal.amount}
          onChange={(e) => setModal({ open: true, amount: e })}
        />
      </Modal>
    </div>
  );
}
