import { Empty, Modal, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { postUrl } from "../utility";

export default function BalanceModal({
  open = false,
  onClose = (f) => f,
  username = "",
}) {
  const { logout, coins, prices, sitemode } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    postUrl(sitemode,
      "/api/ballance/getUserBallance",
      { username },
      (data) => setData(data),
      logout,
    );
  }, [username, logout]);

  return (
    <div>
      <Modal
        title={"Balance of " + username}
        centered
        open={open}
        onOk={onClose}
        footer={false}
        onCancel={onClose}
        width={{
          xs: "90%",
          sm: "80%",
          md: "70%",
          lg: "60%",
          xl: "50%",
          xxl: "40%",
        }}
      >
        {data ? (
          data.length > 0 ? (
            <>
              <table className="text-[1.2em] w-full text-center border-collapse border-solid border border-gray-400 ">
                <tr className="bg-[#2d7aff] text-white">
                  <th className="border-solid border border-black p-2">
                    Currency
                  </th>
                  <th className="border-solid border border-black p-2">
                    Amount
                  </th>
                  <th className="border-solid border border-black p-2">USD</th>
                </tr>
                {data.map(({ currency, amount }) => (
                  <tr key={currency}>
                    <td className="border-solid border p-2">
                      {currency}
                      <img src={coins[currency]} className="w-[1em] ml-2" />
                    </td>
                    <td className="border-solid border p-2">{amount}</td>
                    <td className="border-solid border p-2">
                      {prices[currency]
                        ? (prices[currency] * amount).toFixed(2) + " $"
                        : amount}
                    </td>
                  </tr>
                ))}
              </table>
            </>
          ) : (
            <Empty />
          )
        ) : (
          <div className="flex justify-center items-center">
            <Spin />
          </div>
        )}
      </Modal>
    </div>
  );
}
