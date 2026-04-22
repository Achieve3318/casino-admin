import { Divider } from "antd";
import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import Coins from "./Coin";
import Network from "./Network";
import postUrl2Pro from "../../../utility/postUrl2Pro";
import Fiat from "./Fiat";
const Coin = () => {
  const [networkData, setNetworkData] = useState(null);
  const [coinData, setCoinData] = useState(null);
  const [fiatData, setFiatData] = useState(null);
  const { logout, sitemode } = useAuth();

  const getCoinData = () =>
    postUrl2Pro(
      "/api/coin/get",
      {},
      (d) =>
        setCoinData(
          d
            .map((v, index) => ({ ...v, key: v._id }))
            .sort((a, b) => {
              const completedA = Number(a.isCompleted ?? false);
              const completedB = Number(b.isCompleted ?? false);
              if (completedB - completedA !== 0) return completedA - completedB;
              return a.chain.localeCompare(b.chain); // Secondary sort by chain
            })
        ),
      logout
    );
  const getNetworkData = () =>
    postUrl2Pro(
      "/api/chain/get",
      {},
      (d) => setNetworkData(d.map((v, index) => ({ ...v, key: v._id }))),
      logout
    );
  const getFiatData = () =>
    postUrl2Pro(
      "/api/fiat/get",
      {},
      (d) => setFiatData(d.map((v, index) => ({ ...v, key: v._id }))),
      logout
    );
  return (
    <div className="mt-4">
      <Network
        getData={getNetworkData}
        data={networkData || []}
        loading={networkData === null}
      />
      <Divider />
      <Coins
        getData={getCoinData}
        data={coinData || []}
        network={networkData || []}
        loading={coinData === null}
      />
      <Divider />
      <Fiat
        getData={getFiatData}
        data={fiatData || []}
        loading={fiatData === null}
      />
    </div>
  );
};

export default Coin;
