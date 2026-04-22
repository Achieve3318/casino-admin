import React from "react";
import BonusManage from "../../../components/BonusManage";
import { BONUS_TYPE } from "../../../constants/bonus";
import ReferralManualManage from "./ManualManage";
import { useAuth } from "../../../context/AuthContext";
import { USER_ROLE } from "../../../constants";





const ReferralBonus = () => {
  const { auth , siteCurrency, prices } = useAuth();
  const columns = [
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
      title: "Number Of People",
      dataIndex: "level",
      align: "center",
      width: "6em",
      type: "number",
      sorter: (a, b) => a.level - b.level,
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "Name",
      align: "center",
      width: "8em",
      dataIndex: "name",
      type: "text",
      sorter: (a, b) => a.name > b.name,
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "DepositRequired($)",
      dataIndex: "pointsRequired",
      width: "10em",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value, all) => (
        <>
          {value.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
            useGrouping: true,
          })} &nbsp;
          $
        </>
      ),
      sorter: (a, b) => a.pointsRequired - b.pointsRequired,
      type: "number",

      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "DepositRequired(" + (prices[siteCurrency]?siteCurrency: 1) + ")",
      dataIndex: "pointsRequired",
      width: "10em",
      align: "right",
      mode: 'calc',
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value, all) => (
        <>
          {(value/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
            useGrouping: true,
          })} &nbsp;
          {
            prices[siteCurrency] ? siteCurrency: "USD"
        }
        </>
      ),
      sorter: (a, b) => a.pointsRequired - b.pointsRequired,
      type: "number",

      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "RewardPercentage",
      dataIndex: "rewardPercentage",
      width: "7em",
      type: "number",
      render: (data) => data + " %",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "Description",
      dataIndex: "description",
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      type: "textarea",
      isFilter: true,
    },
  ];
  const ReferralBonusManage = () => {
    return <BonusManage type={BONUS_TYPE.Referral} columns={columns} />;
  };
  return (
    <div className="mt-4">
      <ReferralBonusManage />
      <ReferralManualManage />
    </div>
  );
};

export default ReferralBonus;
