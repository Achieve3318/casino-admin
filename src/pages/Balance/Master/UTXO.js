import { Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { useAuth } from "../../../context/AuthContext";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const UTXO = ({
    item = {},
    checked = false
}) => {
    const { coins, prices, logout } = useAuth();
    const [copied, setCopied] = useState(false);

    const [data, setData] = useState([]);
    const [holeData, setHoleData] = useState([]);
    useEffect(() => {
        postUrl2Pro("/api/crypto/getBalance", { network: item.symbol, isEVM: item.isEVM, isUTXO: item.isUTXO, ledgerCurrency: item.ledgerCurrency }, (data) => {
            setHoleData(data)
        }, logout)
    }, [item])

    useEffect(() => {
        setData(checked === true ? (holeData?.balances || []).filter(v => v.balance && v.balance * 1 > 0) : holeData?.balances)
    }, [holeData, checked])

    const handleCopyButton = () => {
        setCopied(true)
        setTimeout(() => {
            setCopied(false);
        }, 2000)
    }


    return (
        data?.length > 0 && <div className="w-full flex gap-1 pb-2">
            <div className="flex  text-[1.1em] w-1/4">{data[0].name}</div>
            <div className="w-3/4 flex justify-between">
                <div className="flex  text-[1.1em] w-full items-center justify-end pr-4">
                    <img
                        src={coins[data[0].name]}
                        className="w-[1.1em] mr-2"
                    />
                    {(data[0].balance * 1).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 5,
                        useGrouping: true,
                    })}&nbsp;
                    {prices[data[0].name] ? <>({(data[0].balance * prices[data[0].name]).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 5,
                        useGrouping: true,
                    })}{data[0].balance * 1 === 0 ? "" : " $"})</> : ""}

                </div>
                <Tooltip title={holeData?.address}>
                    <CopyToClipboard
                        text={holeData?.address || ""}
                        onCopy={() => data && handleCopyButton()}
                    >
                        <Tooltip title="Copied" visible={copied} placement="right">

                            <i className="fa fa-clone cursor-pointer text-sky-400 hover:text-red-500 "></i>
                        </Tooltip>
                    </CopyToClipboard>
                </Tooltip>
            </div>
        </div>
    )
}

export default UTXO;