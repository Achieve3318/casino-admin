import React, { useEffect, useState } from "react";
import { Input, Button } from "antd";
import { useAuth } from "../../../context/AuthContext";
import { postUrl } from "../../../utility";
import { success } from "../../../utility/notification";

const BetBonus = () => {
  const { logout, sitemode } = useAuth();
  const [originalPercentage, setOriginalPercentage] = useState(0);
  const [lotteryPercentage, setLotteryPercentage] = useState(0);
  const [slotPercentage, setSlotPercentage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    postUrl(
      sitemode,
      "/api/bonus/bet/settings/get",
      {},
      (data) => {
        setOriginalPercentage(data.original || 0);
        setLotteryPercentage(data.lottery || 0);
        setSlotPercentage(data.slot || 0);
      },
      logout
    );
  };

  const handleSave = () => {
    setLoading(true);
    postUrl(
      sitemode,
      "/api/bonus/bet/settings/update",
      {
        original: parseFloat(originalPercentage) || 0,
        lottery: parseFloat(lotteryPercentage) || 0,
        slot: parseFloat(slotPercentage) || 0,
      },
      () => {
        success("Bet bonus percentages updated successfully");
        setLoading(false);
      },
      logout,
      () => {
        setLoading(false);
      }
    );
  };

  return (
    <div className="mt-4">
      <div className="mb-6">
        <p className=" text-[2em] mb-4 font-extrabold">Bet Bonus Percentage Settings</p>
        <p className="text-gray-600 mb-4">
          Configure the bet bonus percentage for each game type. The bonus is calculated as a percentage of the total bets placed each day.
        </p>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Games Percentage (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={originalPercentage}
              onChange={(e) => setOriginalPercentage(e.target.value)}
              placeholder="Enter percentage (e.g., 5.5)"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Percentage of total bets on original games (dice, limbo, crash, etc.)
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lottery Games Percentage (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={lotteryPercentage}
              onChange={(e) => setLotteryPercentage(e.target.value)}
              placeholder="Enter percentage (e.g., 3.0)"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Percentage of total bets on lottery games (melate, chispazo, etc.)
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slot Games Percentage (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={slotPercentage}
              onChange={(e) => setSlotPercentage(e.target.value)}
              placeholder="Enter percentage (e.g., 2.5)"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Percentage of total bets on slot games (provider games)
            </p>
          </div>
          <Button
            type="primary"
            onClick={handleSave}
            loading={loading}
            className="w-full"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BetBonus;
