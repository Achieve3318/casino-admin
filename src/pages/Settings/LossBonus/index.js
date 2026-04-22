import React from "react";
import BonusManage from "../../../components/BonusManage";
import { BONUS_TYPE } from "../../../constants/bonus";
const LossBonus = () => {
  return (
    <div className="mt-4">
      <BonusManage type={BONUS_TYPE.Loss} />
    </div>
  );
};

export default LossBonus;
