import { Button, Modal, Table, Tooltip } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { blockedEmail } from "../../../utility";
import { error, success, warning } from "../../../utility/notification";
import { getFilterColumns } from "../../../utility/table";
import DepositLogModal from "./DepositLogModal";
import { USER_ROLE } from "../../../constants";
import HiddenUsername from "../../../utility/hiddenEmail";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const pageSizeOptions = [
    10,
    20,
    50,
    100,
    500
];

const DepositsBalance = () => {
    const [refresh, setRefresh] = useReducer((f) => !f);
    const [data, setData] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalInfo, setDepositLogModal] = useState({ open: false, data: [], others: {} })
    const { coins, prices, logout, auth, blockLists , sitemode } = useAuth();

    const [tableParams, setTableParams] = useState({
        pagination: {
            size: "default",
            current: 1,
            pageSize: pageSizeOptions[1],
            total: 0,
            pageSizeOptions,
            showQuickJumper: true,
            showSizeChanger: true
        },
        changed: false,
        filters: {},
        sorter: {
            field: "username",
            order: "ascend"
        }
    });

    const columns = getFilterColumns([
        ...(auth?.user?.role === USER_ROLE.ADMIN
            ? [
                {
                    title: "ID",
                    dataIndex: "_id",
                    width: "10em",
                    align: "center",
                },
            ]
            : []),
        {
            title: "Username",
            dataIndex: "username",
            sorter: true,
            width: "12em",
            className: "text-xs sm:text-sm md:text-base",
            isFilter: true,
            align: "center",
            render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
            // defaultSortOrder : 'ascend'
        },
        {
            title: "Wallet",
            dataIndex: "address",
            sorter: true,
            width: "12em",
            className: "text-xs sm:text-sm md:text-base",
            isFilter: true,
            align: "center"
        },
        {
            title: "Coin",
            dataIndex: "currency",
            sorter: true,
            width: "8em",
            className: "text-xs sm:text-sm md:text-base",
            isFilter: true,
            align: "center"
        },
        {
            title: "Chain",
            dataIndex: "network",
            sorter: true,
            width: "8em",
            className: "text-xs sm:text-sm md:text-base",
            isFilter: true,
            align: "center"
        }, {
            title: "Amount",
            dataIndex: "onchain",
            sorter: true,
            width: "10em",
            className: "text-xs sm:text-sm md:text-base",
            render: (value, all) => (
                <> {
                    (value || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 5,
                        useGrouping: true
                    })
                }
                    <Tooltip title={
                        all.currency
                    }>
                        <img src={
                            coins[all.currency]
                        }
                            className="w-[1em] ml-2 cursor-pointer" />
                    </Tooltip>
                </>
            ),
            align: "right",
            onHeaderCell: () => (
                {
                    style: {
                        textAlign: "center"
                    }
                }
            )
        }, {
            title: "USD",
            dataIndex: "usd",
            width: "10em",
            className: "text-xs sm:text-sm md:text-base",
            render: (value, all) => prices[all?.currency] ? ((all?.onchain || 0) * prices[all?.currency]).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true
            }) + " $" : (all?.onchain || 0),
            align: "right",
            onHeaderCell: () => (
                {
                    style: {
                        textAlign: "center"
                    }
                }
            )
        }, {
            title: 'Last Deposit Date',
            dataIndex: 'updatedAt',
            sorter: true,
            width: '10em',
            className: 'text-xs sm:text-sm md:text-base',
            align: 'center',
            render: (v, all) => {
                return <span className={
                    all.onchain === all.amount ? "" : "text-gray"
                }>
                    {v} </span>
            }
        }, {
            title: "View logs",
            width: '5em',
            className: 'text-xs sm:text-sm md:text-base',
            align: 'center',
            render: (v, all) => {
                return <a onClick={
                    () => {
                        console.log((all.deposits || []).map((each) => ({
                            ...each,
                            type: "Deposit"
                        })));

                        setDepositLogModal({
                            open: true,
                            data: [
                                ...(all.deposits || []).map((each) => ({
                                    ...each,
                                    type: "Deposit"
                                })),
                                ...(all.claimed || []).map((each) => ({
                                    ...each,
                                    type: "Claimed"
                                }))
                            ],
                            others: all
                        })
                    }
                }>
                    View
                </a>
            }
        }
    ]);
    const fetchDataCount = () => {
        postUrl2Pro("/api/crypto/getDepositBalanceCount", {
            filters: tableParams.filters,
            sorter: tableParams.sorter
        }, (data) => setTableParams({
            ...tableParams,
            pagination: {
                ...tableParams.pagination,
                total: data
            }
        }), logout,);
    };
    const fetchData = () => {
        setData(null);
        setLoading(true);
        postUrl2Pro("/api/crypto/getDepositBalance", {
            page: tableParams.pagination.current - 1,
            pageSize: tableParams.pagination.pageSize,
            filters: tableParams.filters,
            sorter: tableParams.sorter
        }, (data) => {
            setData(data);

            setLoading(false);
        }, logout,);
    };

    useEffect(fetchDataCount, [tableParams.changed, refresh]);
    useEffect(() => fetchData(), [
        tableParams.changed, refresh,
    ],);
    const handleTableChange = useCallback(debounce((pagination, filters, sorter) => {
        setTableParams({
            ...tableParams,
            changed: !tableParams.changed,
            pagination,
            filters,
            sorter
        });
    }, 300), [tableParams]);
    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange
    };

    const handleClaim = () => {
        if (selectedRowKeys.length === 0) {
            warning("Select Row");
            return;
        }
        const wallets = selectedRowKeys.map((id) => {
            const record = (data || []).filter(({ _id }) => _id === id);
            if (record.length === 0)
                return {};



            return { username: record[0].username, currency: record[0].currency, network: record[0].network, amount: record[0].onchain };
        });
        postUrl2Pro("/api/crypto/claim", {
            wallets
        }, (data) => {
            success(data.message);
            setTimeout(() => {
                setRefresh();
            }, 4000);
        }, logout, (err) => {
            error(err);
            setRefresh();
        },);
    };
    return (
        <>
            <div className="w-full flex justify-between items-end mt-4">
                <div className="flex items-center gap-3">
                    <p className="text-[2em]  font-extrabold ">Deposit Wallets</p>
                    <Button shape="circle"
                        onClick={
                            () => {
                                fetchData();
                                fetchDataCount();
                            }
                        }>
                        <i className={
                            `fa fa-refresh ${loading ? "fa-spin" : ""
                            }`
                        }></i>
                    </Button>
                </div>
                <Button type="primary"
                    icon={
                        <i
                            className="fa fa-hand-rock-o"></i>
                    }
                    onClick={handleClaim}>
                    Claim
                </Button>
            </div>
            <Table className="mt-4" size="small" bordered
                columns={columns}
                rowSelection={rowSelection}
                scroll={
                    { x: "auto" }
                }
                rowKey={
                    (record) => record._id
                }
                dataSource={data}
                loading={
                    data === null
                }
                pagination={
                    tableParams.pagination
                }
                onChange={handleTableChange} />
            <DepositLogModal
                coins={coins}
                open={
                    modalInfo.open
                }
                data={
                    modalInfo.data
                }
                others={
                    modalInfo.others
                }
                onCancel={
                    () => setDepositLogModal({ open: false, data: [], others: {} })
                } />
        </>
    );
};

export default DepositsBalance;
