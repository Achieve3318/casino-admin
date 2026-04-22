import { Button, Checkbox } from "antd";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import NetworkCard from "./NetworkCard";
import UTXO from "./UTXO";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const MasterBalance = () => {
  const [data, setData] = useState([]);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const { logout , sitemode } = useAuth();
  const getChain = () => {
    setData([]);
    setLoading(true);
    postUrl2Pro(
      "/api/chain/get",
      {},
      (d) => {
        setData(d.map((v, index) => ({ ...v, key: v._id })));
        setLoading(false);
      },
      logout,
    );
  };
  useEffect(() => {
    getChain();
  }, []);
  return (
    <>
      <div className=" flex justify-between items-center mt-4">
        <div className="flex items-center gap-3">
          <p className="font-extrabold text-[2em]">Master Wallets</p>
          <Button
            shape="circle"
            onClick={() => {
              getChain();
            }}
          >
            <i className={`fa fa-refresh ${loading ? "fa-spin" : ""}`}></i>
          </Button>
        </div>
        <Checkbox
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
          }}
        >
          Has Funds
        </Checkbox>
      </div>
      <div className="w-full flex flex-wrap gap-10 mt-7 justify-between px-4">
        <div className="border-solid w-[450px] border-sky-500 border-2 rounded-md bg-white">
          <div className="text-[1.4em] p-2 bg-sky-500 text-white font-bold">
            UTXO
          </div>
          <div className="p-2 min-h-[120px]">
            {(data || [])
              .filter((item) => item.isUTXO === true)
              .map((v) => (
                <UTXO item={v} checked={checked} key={v._id} />
              ))}
          </div>
        </div>
        {(data || [])
          .filter((item) => item.isUTXO === false)
          .map((v) => (
            <NetworkCard item={v} checked={checked} key={v._id} />
          ))}
      </div>
    </>
  );
};

export default MasterBalance;
