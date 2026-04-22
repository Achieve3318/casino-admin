import { DeleteFilled, EditFilled, EyeFilled, EyeInvisibleOutlined, PlusOutlined, SaveFilled } from "@ant-design/icons";
import { Badge, Button, Checkbox, Input, InputNumber, Modal, Transfer } from "antd";
import React, { useEffect, useState } from "react";
import { postUrl } from "../../../utility";
import './custom.css';
import { useAuth } from "../../../context/AuthContext";

const { confirm } = Modal

const UsernamesTransferList = ({ allUsernames = [], selUsernames = [], onSelect = f => f }) => {
    const [targetKeys, setTargetKeys] = useState(selUsernames);

    useEffect(() => {
        setTargetKeys(selUsernames)
    }, [selUsernames])

    const handleChange = (nextTargetKeys) => {
        setTargetKeys(nextTargetKeys);
        onSelect(nextTargetKeys)
    };

    return (
        <Transfer
            dataSource={allUsernames}
            titles={["All", "Applied"]}
            className="h-full"
            targetKeys={targetKeys}
            onChange={handleChange}
            render={(item) => item.key}
            showSearch={true}
        />
    );
};

const EditCard = ({ mode = "bad", color = "pink", allUsernames = [], data: defaultData = null, setRefresh = f => f }) => {
    const { sitemode } = useAuth()

    const [showTransfer, setShowTransfer] = useState(true)
    const [data, setData] = useState(defaultData ? defaultData : {
        name: '',
        profitLimit: {
            balance: 0,
            manual: 0,
        },
        betLimit: {
            balance: 0,
            manual: 0,
        },
        usernames: []
    })

    const handleProfitChangeData = (key, value) =>
        setData(prev => ({
            ...prev,
            profitLimit: {
                ...prev.profitLimit,
                [key]: value
            }
        }))
    const handleBetChangeData = (key, value) =>
        setData(prev => ({
            ...prev,
            betLimit: {
                ...prev.betLimit,
                [key]: value
            }
        }))

    const saveData = () => {
        if (defaultData === null)
            postUrl(sitemode, '/api/lucky/create', { ...data, mode }, ({ message }) => {
                if (message === 'success') {
                    setData({
                        name: '',
                        profitLimit: {
                            balance: 0,
                            manual: 0,
                        },
                        betLimit: {
                            balance: 0,
                            manual: 0,
                        },
                        usernames: []
                    })
                    setRefresh()
                }

            })
        else
            postUrl(sitemode, '/api/lucky/update', { id: defaultData._id, ...data }, ({ message }) => {
                if (message === 'success') {
                    setData({
                        name: '',
                        profitLimit: {
                            balance: 0,
                            manual: 0,
                        },
                        betLimit: {
                            balance: 0,
                            manual: 0,
                        },
                        usernames: []
                    })
                    setRefresh()
                }
            })
    }

    const handleSaveData = () => {

        if (data.usernames.length === 0)
            confirm({
                title: "Save",
                content: "No appliers, Are you sure to save rule",
                onOk: saveData,
                onCancel: () => { }
            })
        else
            saveData()
    }

    return <div className={`bg-${color}-100 drop-shadow-md rounded-xl flex flex-col md:flex-row transition-all w-full md:w-auto`}>
        <div className="w-full">
            <div className='w-full min-h-36 relative flex rounded-xl'>
                <div className={`absolute w-full h-full bg-${color}-200 rounded-xl`}>&nbsp;</div>
                <div className="absolute w-full top-4 flex justify-center items-center">
                    <Input
                        className={`w-[50%] text-center text-${color}-700 font-bold text-2xl`}
                        value={data.name}
                        onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="absolute flex gap-2 text-xs flex-col top-20 justify-center w-full">
                    <span className="text-slate-600 w-full flex justify-start ml-10 text-xs">
                        <Checkbox className="text-slate-600 text-xs" checked={data.defaultRule} onChange={(e) => setData(prev => ({ ...prev, defaultRule: e.target.checked }))} title="Default Rule">
                            Default Rule
                        </Checkbox>
                    </span>
                    <span className="text-slate-600 w-full flex justify-start ml-10 text-xs">
                        <Checkbox className="text-slate-600 text-xs" checked={data.ignoreDefaultRule} onChange={(e) => setData(prev => ({ ...prev, ignoreDefaultRule: e.target.checked }))} title="Ignore Default Rule">
                            Ignore Default Rule
                        </Checkbox>
                    </span>
                </div>
            </div>
            <div className='w-full px-3 py-1 md:py-3'>
                <div className="flex flex-col gap-1 md:gap-2 text-xs text-slate-800 font-semibold">
                    <p className="text-sm">Profit Limit:</p>
                    <div className="pl-2 w-full flex justify-between items-baseline">
                        <span className="text-slate-600">Rate of Balance:</span>
                        <InputNumber className="max-w-24" addonAfter={"%"} min={0} max={100} value={data.profitLimit.balance} onChange={e => handleProfitChangeData('balance', e)} />
                    </div>
                    <div className="pl-2 w-full flex justify-between items-baseline">
                        <span className="text-slate-600">Manual:</span>
                        <InputNumber className="max-w-24" addonAfter={"$"} min={0} value={data.profitLimit.manual} onChange={e => handleProfitChangeData('manual', e)} />
                    </div>
                    <p className="text-sm">Bet Limit:</p>
                    <div className="pl-2 w-full flex justify-between items-baseline">
                        <span className="text-slate-600">Rate of Balance:</span>
                        <InputNumber className="max-w-24" addonAfter={"%"} min={0} max={100} value={data.betLimit.balance} onChange={e => handleBetChangeData('balance', e)} />
                    </div>
                    <div className="pl-2 w-full flex justify-between items-baseline">
                        <span className="text-slate-600">Manual:</span>
                        <InputNumber className="max-w-24" addonAfter={"$"} min={0} value={data.betLimit.manual} onChange={e => handleBetChangeData('manual', e)} />
                    </div>
                </div>
                <div className="mt-2 flex justify-end gap-3">
                    <Button className="bg-transparent rounded-full hover:bg-cyan-500" onClick={handleSaveData}>
                        <SaveFilled />
                        Save
                    </Button>
                    <Button className={`bg-${color}-400 rounded-full text-white`} onClick={() => setShowTransfer(v => !v)}>
                        <PlusOutlined />
                        Apply to
                    </Button>
                </div>
            </div>
        </div>
        <div className={`bg-${color}-50 ${showTransfer ? 'block' : 'hidden'} rounded-e-lg`}>
            {showTransfer && <UsernamesTransferList allUsernames={allUsernames} selUsernames={data.usernames} onSelect={(usernames) => setData(prev => ({ ...prev, usernames }))} />}
        </div>
    </div>
}

const RuleCard = ({
    color = 'cyan',
    data = {},
    onEdit = f => f,
    onSelect = f => f,
    setRefresh = f => f,
}) => {

    const [showAccounts, setShowAccounts] = useState(true)
    const { sitemode } = useAuth()

    const onDelete = () => {
        confirm({
            title: "Delete",
            content: "Are you sure to delete?",
            onOk: () => postUrl(sitemode, '/api/lucky/delete', { id: data._id }, ({ message }) => {
                if (message === 'success') {
                    setRefresh()
                }
            }),
            onCancel: () => { }
        })
    }
    const processForLong = (str) => {
        if (str.length > 8) {
            return str.slice(0, 8) + '...'
        }
        return str
    }

    return <div className={`bg-${color}-50 drop-shadow-md rounded-xl flex hover:shadow-inner`}>
        <div className={`w-full h-full flex flex-col rounded-lg bg-${color}-100`}>

            <div className='w-full min-h-24 relative flex rounded-xl' onClick={onSelect}>
                <div className={`absolute w-full h-full bg-${color}-200 rounded-xl`}>&nbsp;</div>
                <div className="absolute w-full h-full flex justify-center items-center">
                    <p className={`w-[50%] bg-transparent text-center text-${color}-700 font-bold text-2xl`}>
                        {processForLong(data?.name)}
                    </p>
                </div>
            </div>
            <div className='w-full p-3 flex-1 flex flex-col justify-between'>
                <div className="flex flex-col gap-2 text-xs text-slate-800 font-semibold">
                    <p className="text-sm">Profit Limit:</p>
                    <div className="pl-5 w-full flex justify-between">
                        <span className="text-slate-600">Rate of Balance:</span>
                        <span>{data?.profitLimit?.balance || 0}%</span>
                    </div>
                    <div className="pl-5 w-full flex justify-between">
                        <span className="text-slate-600">Manual:</span>
                        <span>${data?.profitLimit?.manual || 0}</span>
                    </div>
                    <p className="text-sm">Bet Limit:</p>
                    <div className="pl-5 w-full flex justify-between">
                        <span className="text-slate-600">Rate of Balance:</span>
                        <span>{data?.betLimit?.balance || 0}%</span>
                    </div>
                    <div className="pl-5 w-full flex justify-between">
                        <span className="text-slate-600">Manual:</span>
                        <span>${data?.betLimit?.manual || 0}</span>
                    </div>
                </div>
                <div className="flex justify-end text-xs text-slate-700 gap-0.5 md:gap-1">
                    <p>Applied:</p>
                    <p className="text-black font-bold">{data?.usernames?.length || 0}</p>
                    <p>accounts</p>
                </div>
                <div className="mt-2 flex justify-end gap-3">
                    <Button className="bg-transparent rounded-full" onClick={onDelete}>
                        <DeleteFilled />
                    </Button>
                    <Button className="bg-transparent rounded-full" onClick={onEdit}>
                        <EditFilled />
                    </Button>
                    <Button className={`bg-${color}-300 rounded-full`} onClick={() => setShowAccounts(v => !v)}>
                        {!showAccounts ? <EyeFilled /> : <EyeInvisibleOutlined />}
                    </Button>
                </div>
            </div>
        </div>
        <div className={`${showAccounts ? 'block' : 'hidden'} rounded-e-lg shadow-inner`}>
            {
                data.ignoreDefaultRule && <Badge.Ribbon color="blue" text="Ignore Default Rule" className="z-100">
                </Badge.Ribbon>
            }
            {
                !data.ignoreDefaultRule && data.defaultRule && <Badge.Ribbon color="gray" text="Default Rule" className="z-100">
                </Badge.Ribbon>
            }
            {showAccounts && <div className="p-2 max-w-44 text-sm ">
                <p className={`text-${color}-800 text-lg font-bold break-keep text-nowrap`}>Applied Usernames</p>
                <div className="divide-y divide-gray-100 text-slate-700 h-80 overflow-hidden overflow-y-scroll">
                    {(data?.usernames || []).map((username, index) => <div key={index} className="flex justify-between gap-x-6 py-1 w-full">
                        {username}
                    </div>)}
                </div>
            </div>}
        </div>
    </div>
}

export {
    EditCard
};
export default RuleCard