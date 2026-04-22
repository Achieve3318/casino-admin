import React from "react";
import BonusManage from "../../../components/BonusManage";
import { BONUS_TYPE } from "../../../constants/bonus";
const WagerBonus = () => {
  return <BonusManage type={BONUS_TYPE.Wager} />;
};

export default WagerBonus;
