import { Spin, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { useAuth } from "../../../context/AuthContext";
import { TruncateMiddle } from "../../../utility/address";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const NetworkCard = ({ item, checked = false }) => {
  const [copied, setCopied] = useState(false);
  const { coins, prices, logout , sitemode } = useAuth();

  const [data, setData] = useState(null);
  const [holeData, setHoleData] = useState(null);

  useEffect(() => {
    postUrl2Pro(
      "/api/crypto/getBalance",
      {
        network: item.symbol,
        isEVM: item.isEVM,
        isUTXO: item.isUTXO,
        ledgerCurrency: item.ledgerCurrency,
      },
      (data) => {
        setHoleData(data);
      },
      logout,
    );
  }, [item, checked]);

  useEffect(() => {
    setData(
      checked === true
        ? (holeData?.balances || []).map((each) => {
          if (each.name === 'USDT' && item.symbol === 'polygon') each.balance = each.balance
          if (each.name === 'USDT' && item.symbol === 'eth') each.balance = each.balance
          return each
        })
          .filter((v) => v.balance && v.balance * 1 > 0)
          .sort((a, b) => (a.type > b.type ? 1 : -1))
        : (holeData?.balances || []).map((each) => {
          if (each.name === 'USDT' && item.symbol === 'polygon') each.balance = each.balance
          if (each.name === 'USDT' && item.symbol === 'eth') each.balance = each.balance
          return each
        }).sort((a, b) => (a.type > b.type ? 1 : -1)),
    );
  }, [holeData]);

  const handleCopyButton = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="border-solid w-[450px] border-sky-600 border-2 rounded-md bg-white bg-opacity-15">
      <div className="text-[1.4em] bg-[#2d7aff]   p-2 border-solid border-t-0 border-x-0 border-2 border-white text-white">
        <div className="flex items-center text-[0.7em] mt-1  gap-3">
          <p className="font-bold text-[1.4em] ">
            {item.symbol?.toUpperCase()}
          </p>
          <p className="w-full overflow-hidden text-right">
            <TruncateMiddle text={holeData?.address} maxLength={20} />
          </p>
          <Tooltip title={holeData?.address}>
            <CopyToClipboard
              text={holeData?.address || ""}
              onCopy={() => data && handleCopyButton()}
            >
              <Tooltip title="Copied" visible={copied} placement="right">
                <i className="fa fa-clone cursor-pointer hover:text-green-400 "></i>
              </Tooltip>
            </CopyToClipboard>
          </Tooltip>
        </div>
      </div>
      <div className="p-3 min-h-[120px] w-full">
        {!data ? (
          <div className="w-full h-full flex justify-center items-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {(data || []).map((item) => {
              return (
                <div className="w-full flex gap-1 pb-2" key={item.name}>
                  <div className="flex  text-[1.1em] w-1/4">{item.name}</div>
                  <div className="flex  text-[1.1em] w-full items-center justify-end">
                    <img src={coins[item.name]} className="w-[1.1em] mr-2" />
                    {(item.balance * 1).toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 5,
                      useGrouping: true,
                    })}
                    &nbsp;
                    {prices[item.name] ? (
                      <>
                        (
                        {(item.balance * prices[item.name]).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 5,
                            useGrouping: true,
                          },
                        )}
                        {item.balance * 1 === 0 ? "" : " $"})
                      </>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkCard;
