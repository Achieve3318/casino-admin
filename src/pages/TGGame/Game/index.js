import { Button, Modal, Progress, Select, Table, Tag, Tooltip } from "antd";
import ButtonGroup from "antd/es/button/button-group";
import axios from "axios";
import { debounce } from "lodash";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { warning } from "toastr";
import { TG_GAME_LIST } from "../../../constants/tg_game";
import { useAuth } from "../../../context/AuthContext";
import { isEmpty } from "../../../utility";
import { TruncateMiddle } from "../../../utility/address";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const pageSizeOptions = [10, 20, 50, 100];

const Game = () => {
    const [data, setData] = useState(null);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const user = searchParams.get("user"); // ?id=123 → "123"

    const [selectedRows, setSelectedRows] = useState([]);
    const [gameList, setGameList] = useState(
        [...new Set(TG_GAME_LIST.map(v => v.game))]
    );
    const [game, setGame] = useState(gameList[0]);
    const [coinList, setCoinList] = useState(
        [...new Set(TG_GAME_LIST.map(v => v.network))]
    );
    const [coin, setCoin] = useState(coinList[0]);
    const [progressModal, setProgressModal] = useState({
        open: false,
        percent: 0,
        success: {
            percent: 0
        },
        finish: false,
        result: []
    });
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            size: "default",
            pageSize: pageSizeOptions[1],
            total: 0,
            pageSizeOptions
        },
        changed: false,
        filters: user ? { from: [user] } : {},
        sorter: {
            field: "createAt",
            order: "descend",
        }
    });
    const { logout, coins, auth , sitemode } = useAuth();

    const columns = getFilterColumns([

        {
            title: "Result",
            dataIndex: "lastNumberOfblockNumber",
            className: "text-xs sm:text-sm md:text-base",
            align: "center",
            filters: [
                {
                    text: <div className="inline-block mt-1 -mb-1 w-[25px] h-[25px] rounded-full bg-red-600"> </div>,
                    value: 'red'
                },
                {
                    text: <div className="inline-block  mt-1 -mb-1 w-[25px] h-[25px] rounded-full bg-blue-600"> </div>,
                    value: 'blue'
                },
                {
                    text: 'Not Result',
                    value: 'not'
                }
            ],
            width: "25px",
            render: (value) => !isEmpty(value) && game === "EVEN_ODD" ? <div className="w-full flex justify-center items-center">
                <div className={`w-[25px] h-[25px] rounded-full ${(value % 10) % 2 === 0 ? 'bg-red-600' : 'bg-blue-600'}`}> </div>
            </div> : !isEmpty(value) && game === "BIG_SMALL" ? <div className="w-full flex justify-center items-center">
                <div className={`w-[25px] h-[25px] rounded-full ${(value % 10) < 5 ? 'bg-red-600' : 'bg-blue-600'}`}> </div>
            </div> : ''
        },
        ...(auth?.user?.role === USER_ROLE.ADMIN
            ? [
                {
                    title: "ID",
                    dataIndex: "_id",
                    className: "text-xs sm:text-sm md:text-base",
                    isFilter: true,
                    align: "center",
                    width: "8em",
                },
            ]
            : []),
        {
            title: "From",
            dataIndex: "from",
            className: "text-xs sm:text-sm md:text-base",
            isFilter: !user ? true : false,
            align: "center",
            width: "12em",
            render: value => value && <TruncateMiddle showTooltip={true} text={value} />
        },
        {
            title: "To",
            dataIndex: "to",
            className: "text-xs sm:text-sm md:text-base",
            isFilter: true,
            align: "center",
            width: "12em",
            render: value => value && <TruncateMiddle showTooltip={true} text={value} />

        },
        {
            title: "TxId",
            dataIndex: "txId",
            className: "text-xs sm:text-sm md:text-base",
            isFilter: true,
            align: "center",
            width: "12em",
            render: value => value && <TruncateMiddle showTooltip={true} text={value} />
        },
        {
            title: "BlockNumber",
            dataIndex: "blockNumber",
            isFilter: true,
            className: "text-xs sm:text-sm md:text-base",
            align: "center",
            width: "8em"
        },
        {
            title: "BlockHash",
            dataIndex: "blockHash",
            className: "text-xs sm:text-sm md:text-base",
            sorter: true,
            align: "center",
            width: "8em",
            render: (value, record) => value && <TruncateMiddle showTooltip={true} text={value} />
        },
        {
            title: "Amount",
            dataIndex: "amount",
            sorter: true,
            className: "text-xs sm:text-sm md:text-base",
            align: "center",
            width: "4em",
            render: (value, record) => {

                const amount = value.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 5,
                    useGrouping: true,
                })

                const number = amount.split(".")
                const lastNumber = number[0].slice(-1)

                return <div className="flex items-center justify-start pl-2">
                    <img src={coins[record?.currency]} className="w-[1em] mr-2" /> {number[0].slice(0, -1)} <strong className={`${game === "EVEN_ODD" ? lastNumber * 1 % 2 === 0 ? "text-red-600" : "text-blue-600" : lastNumber * 1 < 5 ? "text-red-600" : "text-blue-600"}`}>
                        {lastNumber} </strong> {number[1] ? "." + number[1] : ''}
                </div>
            }
        },
        {
            title: "Win",
            dataIndex: "win",
            className: "text-xs sm:text-sm md:text-base",
            align: "center",
            filters: [
                {
                    text: "Win",
                    value: true
                },
                {
                    text: "Lose",
                    value: false
                }
            ],
            width: "8em",
            render: (value, record) => <> {value ? <Tag color="green">Win</Tag> : value === false ? <Tag color="red">Lose</Tag> : ''}</>
        },
        {
            title: "Payback",
            dataIndex: "paybackResult",
            filters: [
                {
                    text: "Paid",
                    value: true
                },
                {
                    text: "Unpaid",
                    value: false
                }
            ],
            className: "text-xs sm:text-sm md:text-base",
            align: "center",
            width: "8em",
            render: (value, record) => record?.payback === 0 ? '' : <Tooltip title={<>
                <p>Payback Amount : {record?.payback}</p>
                {record?.paybackResult !== true && <p>Payback Reason : {record?.paybackFailedReason}</p>}
                {record?.paybackResult !== false && <p>TxId : <TruncateMiddle showTooltip={true} text={record?.paybackFailedReason} /></p>}
            </>}>
                {record?.paybackResult ? <Tag color="green">Paid</Tag> : <Tag color="red">Unpaid</Tag>}
            </Tooltip>
        },

        {
            title: "Time",
            dataIndex: "createdAt",
            sorter: true,
            className: "text-xs sm:text-sm md:text-base",
            align: "center",
            width: "10em",
            render: (value) => value && moment.utc(new Date(value)).format("YYYY-MM-DD HH:mm:ss")
        }
    ]);

    const fetchDataCount = useCallback(() => {
        postUrl2Pro(
            "/api/tg/result/count",
            {
                game,
                chain: coin,
                filters: tableParams.filters,
                sorter: tableParams.sorter,
            },
            (res) =>
                setTableParams({
                    ...tableParams,
                    pagination: { ...tableParams.pagination, total: res },
                }),
            logout
        );
    }, [tableParams.changed, game, coin]);
    const fetchData = useCallback(() => {

        setData(null);
        postUrl2Pro(
            "/api/tg/result/list",
            {
                game,
                chain: coin,
                page: tableParams.pagination.current - 1,
                pageSize: tableParams.pagination.pageSize,
                filters: tableParams.filters,
                sorter: tableParams.sorter,
            },
            (res) =>
                setData(res.map(v => ({
                    ...v,
                    key: v.id,
                    children1: v.children,
                    children: undefined
                })))
            ,
            logout
        );
    }, [tableParams.changed, game, coin]);

    useEffect(() => {
        fetchDataCount();
    }, [fetchDataCount]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleTableChange = useCallback(
        debounce((pagination, filters, sorter) => {
            setTableParams({
                ...tableParams,
                pagination,
                filters: { ...tableParams.filters, ...filters },
                sorter,
                changed: !tableParams.changed,
            });
        }, 300),
        [tableParams]
    );
    return <div className="mt-4">
        <div className="flex gap-2 flex-col md:flex-row justify-between">
            <div className="flex gap-2">
                <p className="text-lg font-bold">Game :</p>
                <Select className="w-40" options={gameList.map(v => ({ label: v, value: v }))} onChange={(value) => setGame(value)} value={game} />
                <p className="text-lg font-bold ml-4">Network :</p>
                <Select className="w-40" options={coinList.map(v => ({ label: v, value: v }))} onChange={(value) => setCoin(value)} value={coin} />
            </div>
            <ButtonGroup>
                <Button onClick={async () => {
                    if (selectedRows.length === 0) {
                        warning("Please select a row")
                        return
                    }
                    setProgressModal(prev => ({ ...prev, open: true, title: 'Executing...', finish: false, result: [] }))
                    let count = 0
                    for (let index = 0; index < selectedRows.length; index++) {
                        const _id = selectedRows[index]
                        if (index !== 0) {
                            await new Promise(resolve => setTimeout(resolve, 2000))
                        }
                        try {
                            const { data } = await axios.post(process.env.REACT_APP_PROVIDER_URL + '/api/tg/result/execute', { _id })
                            setProgressModal(prev => ({ ...prev, percent: (index + 1) * 100 / selectedRows.length, success: { percent: (prev.success?.percent || 0) + (data.success ? 100 / selectedRows.length : 0) }, result: [...(prev.result || []), { ...data }] }))
                            count++
                        } catch (e) {
                            setProgressModal(prev => ({ ...prev, percent: (index + 1) * 100 / selectedRows.length, status: 'exception', result: [...(prev.result || []), { ...e.response.data }] }))
                        }
                    }
                    setProgressModal(prev => ({ ...prev, title: `${count}/${selectedRows.length} is proceeded successfully!`, finish: true }))
                }}>
                    <i className="fa fa-gamepad"></i> Exceute Game
                </Button>
                <Button onClick={async () => {
                    if (selectedRows.length === 0) {
                        warning("Please select a row")
                        return
                    }
                    setProgressModal(prev => ({ ...prev, open: true, title: 'Payback...', finish: false, result: [] }))
                    let count = 0
                    for (let index = 0; index < selectedRows.length; index++) {
                        const _id = selectedRows[index]
                        if (index !== 0) {
                            await new Promise(resolve => setTimeout(resolve, 2000))
                        }
                        try {
                            const { data } = await axios.post(process.env.REACT_APP_PROVIDER_URL + '/api/tg/result/payback', { _id })
                            setProgressModal(prev => ({ ...prev, percent: (index + 1) * 100 / selectedRows.length, success: { percent: (prev.success?.percent || 0) + (data.success ? 100 / selectedRows.length : 0) }, result: [...(prev.result || []), { ...data }] }))
                            count++
                        } catch (e) {
                            setProgressModal(prev => ({ ...prev, percent: (index + 1) * 100 / selectedRows.length, status: 'exception', result: [...(prev.result || []), { ...e.response.data }] }))
                        }
                    }
                    setProgressModal(prev => ({ ...prev, title: `${count}/${selectedRows.length} is proceeded successfully!`, finish: true }))
                }}>
                    <i className="fa fa-dollar"></i> Payback
                </Button>
            </ButtonGroup>
        </div>
        <Table
            className="mt-3"
            size="small"
            rowKey={(record) => record._id}
            columns={columns}
            scroll={{ x: "auto" }}
            dataSource={data}
            loading={data === null}
            pagination={tableParams.pagination}
            onChange={handleTableChange}
            rowSelection={{
                onChange: (selectedRowKeys, selectedRows) => {
                    setSelectedRows(selectedRowKeys);
                },
                getCheckboxProps: (record) => ({
                    disabled: record.name === 'Disabled User', // Column configuration not to be checked
                }),
            }}
        />
        <Modal title={progressModal.title} open={progressModal.open} footer={null} onCancel={progressModal.finish ? () => {
            fetchDataCount()
            fetchData()
            setProgressModal({ open: false, percent: 0, success: { percent: 0 }, finish: false, result: [] })
        } : null}
        >
            <Progress percent={progressModal.percent} success={progressModal.success} status={progressModal.status}
                format={(percent) => Number(percent).toFixed(2) + "%"}
            />

            <div className="mt-2">
                <p>Result :</p>
                {progressModal.result.map((error, index) => <p className='flex items-center gap-2' key={index}>
                    <i className={`fa fa-${error.success ? 'check-circle' : 'times-circle'} ${error.success ? 'text-green-600' : 'text-red-600'}`}></i>{error.message}</p>)}
            </div>
        </Modal>
    </div>;
};

export default Game;    
