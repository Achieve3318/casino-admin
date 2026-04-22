import { Button, InputNumber, Modal, Spin, Tag, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { useAuth } from "../../../context/AuthContext";
import { isEmpty } from "../../../utility";
import { TruncateMiddle } from "../../../utility/address";
import { error } from "../../../utility/notification";
import postUrl2Pro from "../../../utility/postUrl2Pro";
const GameCard = ({ item = {}, checked = false, getGameData = f => f, key }) => {
    const { coins, prices, logout , sitemode } = useAuth();
    const [copied, setCopied] = useState(false);
    const [data, setData] = useState(null);
    const [holeData, setHoleData] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [editRtp, setEditRtp] = useState(item.rtp);
    const [originalRtp, setOriginalRtp] = useState(item.rtp);
    const [editMin, setEditMin] = useState(item.min);
    const [originalMin, setOriginalMin] = useState(item.min);
    const [editMax, setEditMax] = useState(item.max);
    const [originalMax, setOriginalMax] = useState(item.max);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [remainAmount, setRemainAmount] = useState(0);
    const [coinInfo, setCoinInfo] = useState(null);
    const [claiming, setClaiming] = useState(false);


    const handleCopyButton = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
    };
    const getGameSettingData = () =>
        postUrl2Pro(
            "/api/tg/game/setting/balance",
            { _id: item._id },
            (d) =>
                setHoleData(
                    d
                ),
            logout,
        );


    useEffect(() => {
        if(!item.isUTXO) {
            getGameSettingData();
        }
    }, [item._id]);
    useEffect(() => {
        setData(
            checked === true
                ? (holeData?.balances || [])
                    .filter((v) => v.balance && v.balance * 1 > 0)
                    .sort((a, b) => (a.type > b.type ? 1 : -1))
                : (holeData?.balances || []).sort((a, b) => (a.type > b.type ? 1 : -1)),
        );
    }, [holeData, checked]);
    return <div className="border-solid w-[450px] border-sky-600 border-2 rounded-md bg-white bg-opacity-15" key={key}>
        <div className="text-[1.4em] bg-[#2d7aff]   p-2 border-solid border-t-0 border-x-0 border-2 border-white text-white">
            <div className="flex items-center text-[0.7em] mt-1  gap-3">
                <p className="font-bold text-[1.4em] ">
                    {item.game?.toUpperCase()}
                    &nbsp;({item.network})
                </p>
                <p className="w-full overflow-hidden text-right">
                    <TruncateMiddle text={item?.address} maxLength={18} />
                </p>
                <Tooltip title={item?.address}>
                    <CopyToClipboard
                        text={item?.address || ""}
                        onCopy={() => item && handleCopyButton()}
                    >
                        <Tooltip title="Copied" open={copied} placement="right">
                            <i className="fa fa-clone cursor-pointer hover:text-green-400 "></i>
                        </Tooltip>
                    </CopyToClipboard>
                </Tooltip>
            </div>
        </div>
        <div className="p-3 min-h-[120px] w-full">
            <div className="flex gap-1 items-center mb-3">
                <p className="w-1/4 font-bold text-red-400 text-lg">* RTP</p>
                <div className="flex gap-1 justify-between w-3/4">
                    <div className="flex gap-1">
                        <InputNumber value={editRtp} onChange={(e) => {
                            setIsEdit(true);
                            setEditRtp(e);
                        }} />
                        {originalRtp !== editRtp && <Button onClick={() => {
                            postUrl2Pro("/api/tg/game/setting/update", { _id: item._id, rtp: editRtp }, (d) => {
                                getGameData();
                                setOriginalRtp(editRtp);
                                setIsEdit(false);
                            }, logout);
                        }}>Save</Button>}
                        {originalRtp !== editRtp && <Button onClick={() => {
                            setEditRtp(originalRtp);
                        }}>Cancel</Button>}
                    </div>

                    {isEmpty(item.subscription?.id) ? <Button type="primary" onClick={() => {
                        postUrl2Pro("/api/tg/game/setting/update", { _id: item._id, createSubscription: true }, (d) => {
                            getGameData();
                        }, logout);
                    }}>Subscribe</Button> : <Tag color="success" className="flex items-center justify-center">Subscribed</Tag>}
                </div>
            </div>
            <div className="flex gap-1 items-center mb-3">
                <p className="w-1/4 font-bold text-red-400 text-lg">* Min</p>
                <div className="flex gap-1 justify-between w-3/4">
                    <div className="flex gap-1">
                        <InputNumber value={editMin} onChange={(e) => {
                            setIsEdit(true);
                            setEditMin(e);
                        }} />
                        {originalMin !== editMin && <Button onClick={() => {
                            postUrl2Pro("/api/tg/game/setting/update", { _id: item._id, min: editMin }, (d) => {
                                getGameData();
                                setOriginalMin(editMin);
                                setIsEdit(false);
                            }, logout);
                        }}>Save</Button>}
                        {originalMin !== editMin && <Button onClick={() => {
                            setEditMin(originalMin);
                        }}>Cancel</Button>}
                    </div>
                </div>
            </div>
            <div className="flex gap-1 items-center mb-3">
                <p className="w-1/4 font-bold text-red-400 text-lg">* Max</p>
                <div className="flex gap-1 justify-between w-3/4">
                    <div className="flex gap-1">
                        <InputNumber value={editMax} onChange={(e) => {
                            setIsEdit(true);
                            setEditMax(e);
                        }} />
                        {originalMax !== editMax && <Button onClick={() => {
                            postUrl2Pro("/api/tg/game/setting/update", { _id: item._id, max: editMax }, (d) => {
                                getGameData();
                                setOriginalMax(editMax);
                                setIsEdit(false);
                            }, logout);
                        }}>Save</Button>}
                        {originalMax !== editMax && <Button onClick={() => {
                            setEditMax(originalMax);
                        }}>Cancel</Button>}
                    </div>
                </div>
            </div>
            {!data ? (
                <div className="w-full h-full flex justify-center items-center">
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    {(data || []).map((item) => {
                        return (
                            <div key={item.name} className="w-full flex gap-1 pb-2 items-center justify-between">
                                <div className="flex  text-[1.1em] w-1/4">{item.name}</div>
                                <div className="flex  text-[1.1em] w-full items-start justify-end">
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
                                <div className="flex  text-[1.1em] items-start">
                                    <Tooltip title={`Claim ${item.name} to Master wallet...`}>
                                        <Button type="ghost" icon={<i className="fa fa-hand-grab-o"></i>}
                                            onClick={() => {
                                                setCoinInfo(item);
                                                setIsModalOpen(true)
                                                setRemainAmount(0)
                                            }}
                                        ></Button>
                                    </Tooltip>
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

        </div>

        <Modal open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} title={`Confirm Claim`}>
            {coinInfo && <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 justify-center w-full mt-8">
                    <span><strong>Remaining</strong> amount after claiming</span>
                    <span><img src={coins[coinInfo.name]} className="w-[1.1em]" />{coinInfo.name}</span>
                    <span> to the Master wallet...</span>
                </div>
                <div className="flex items-center flex-col  gap-2">
                    <InputNumber className="w-full" value={remainAmount || 0} onChange={(e) => setRemainAmount(e)} min={0} max={coinInfo.balance} />
                    <span className="text-red-400 h-[5px]">{remainAmount > 0 ? '$' + (remainAmount * prices[coinInfo.name]).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 5,
                        useGrouping: true,
                    }) : ''}</span>
                </div>
                <Button className="w-full mt-8" disabled={claiming} onClick={() => {
                    setClaiming(true)
                    postUrl2Pro("/api/crypto/send", { _id: item._id, remainAmount, currency: coinInfo.name }, (d) => {
                        getGameSettingData()
                        setIsModalOpen(false)
                        setClaiming(false)
                    }, logout, (err) => {
                        setClaiming(false)
                        error(err)
                    });
                }} icon={claiming ? <Spin /> : <i className="fa fa-hand-grab-o"></i>}>Claim</Button>
            </div>}
        </Modal>
    </div>;
};

export default GameCard;    
