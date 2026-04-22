import { Table, Tooltip } from "antd";
import { debounce } from "lodash";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { isEmpty } from "../../../utility";
import { TruncateMiddle } from "../../../utility/address";
import { getFilterColumns } from "../../../utility/table";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const pageSizeOptions = [10, 20, 50, 100];

const DetailTable = ({ selected, date, user }) => {
    const { coins  } = useAuth();

    const renderValue = (value, dataIndex) => {
        if (isEmpty(value)) {
            return null;
        } 
        return <> {[...Object.keys(value)].sort((a, b) => a - b?1:-1).map(v => v !== "total" && <div className="flex justify-end" key={v}>{value[v].amount.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 5,
            useGrouping: true,
        })}<Tooltip title={v}><img src={coins[v]} className="w-[1em] ml-1" /></Tooltip> </div>)}
            <div className={`flex justify-end border-0 border-t border-solid border-gray-400 font-bold text-[1.1em] italic ${dataIndex === "betamount" ? "text-green-900" : "text-green-500"}`}>
                {value?.total?.amount?.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 5,
                    useGrouping: true,
                })}
            </div>
        </>
    }
    const renderCount = (value, dataIndex) => {
        if (isEmpty(value)) {
            return null;
        }
        return <> {[...Object.keys(value)].sort((a, b) => a - b?1:-1).map(v => v !== "total" && <div className="flex justify-end" key={v}>{value[v]} </div>)}
            <div className={`flex justify-end border-0 border-t border-solid border-gray-400 font-bold text-[1.1em] ${dataIndex === "betcount" ? "text-green-900" : "text-green-500"}`}>
                {value?.total}
            </div>
        </>
    }
    const renderForTotal = (value, dataIndex) => {
        if (isEmpty(value)) {
            return null;
        }
        return <> {[...Object.keys(value?.byCurrency)].sort((a, b) => a - b?1:-1).map(v => v !== "total" && <div className="flex justify-end" key={v}>{value?.byCurrency[v].toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 5,
            useGrouping: true,
        })}<Tooltip title={v}><img src={coins[v]} className="w-[1em] ml-1" /></Tooltip> </div>)}
            <div className={`flex justify-end border-0 border-t border-solid border-gray-400 font-bold text-[1.1em] italic ${dataIndex === "betamount" ? "text-green-900" : "text-green-500"}`}>
                {value?.total?.amount?.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 5,
                    useGrouping: true,
                })}
            </div>
        </>
    }
    const renderCountForTotal = (value, dataIndex) => {
        if (isEmpty(value)) {
            return null;
        }
        return <> {[...Object.keys(value?.byCurrency)].sort((a, b) => a - b?1:-1).map(v => v !== "total" && <div className="flex justify-end" key={v}>{value?.byCurrency[v]} </div>)}
            <div className={`flex justify-end border-0 border-t border-solid border-gray-400 font-bold text-[1.1em] ${dataIndex === "betcount" ? "text-green-900" : "text-green-500"}`}>
                {value?.total}
            </div>
        </>
    }
    const columns = getFilterColumns(
        [
            {
                title: 'User',
                dataIndex: 'from',
                key: 'user',
                align: "center",
                width: "200px",
                sorter: true,
                render: (value) => <TruncateMiddle text={value} maxLength={18} showTooltip={true} />
            },
            {
                title: "EVEN_ODD",
                key: "even_odd",
                children: [
                    {
                        title: "Bet Count",
                        dataIndex: "EVEN_ODD_betcount",
                        key: "EVEN_ODD_betcount",
                        align: "right",
                        width: "5em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderCount(value, "betcount")
                    },
                    {
                        title: "Win Count",
                        dataIndex: "EVEN_ODD_wincount",
                        key: "EVEN_ODD_wincount",
                        align: "right",
                        width: "5em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderCount(value, "wincount")
                    },
                    {
                        title: "Bet Amount",
                        dataIndex: "EVEN_ODD_betamount",
                        key: "EVEN_ODD_betamount",
                        align: "right",
                        width: "10em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderValue(value, "betamount")
                    },
                    {
                        title: "Payback",
                        dataIndex: "EVEN_ODD_paybackamount",
                        key: "EVEN_ODD_paybackamount",
                        align: "right",
                        width: "10em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderValue(value, "paybackamount")
                    },
                ],
                onCell: (value,record) => ({
                    onDoubleClick: () => {
                        window.open(`/tg-game/game?user=${record.from}&game=EVEN_ODD&network=${Object.keys(record?.EVEN_ODD_betcount)?.find(v => v!=='total') || ''}`, "_blank");
                    }
                })
            },
            {
                title: "BIG_SMALL",
                key: "big_small",
                children: [
                    {
                        title: "Bet Count",
                        dataIndex: "BIG_SMALL_betcount",
                        key: "BIG_SMALL_betcount",
                        align: "right",
                        width: "5em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderCount(value, "betcount")

                    },
                    {
                        title: "Win Count",
                        dataIndex: "BIG_SMALL_wincount",
                        key: "BIG_SMALL_wincount",
                        align: "right",
                        width: "5em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderCount(value, "wincount")
                    },
                    {
                        title: "Bet Amount",
                        dataIndex: "BIG_SMALL_betamount",
                        key: "BIG_SMALL_betamount",
                        align: "right",
                        width: "10em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderValue(value, "betamount")
                    },
                    {
                        title: "Payback",
                        dataIndex: "BIG_SMALL_paybackamount",
                        key: "BIG_SMALL_paybackamount",
                        align: "right",
                        width: "10em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderValue(value, "paybackamount")
                    },
                ],
            },
            {
                title: "Total",
                key: "total",
                children: [
                    {
                        title: "Bet Count",
                        dataIndex: "total_betcount",
                        key: "total_betcount",
                        align: "right",
                        width: "5em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderCountForTotal(value, "betcount")
                    },
                    {
                        title: "Win Count",
                        dataIndex: "total_wincount",
                        key: "total_wincount",
                        align: "right",
                        width: "5em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderCountForTotal(value, "wincount")
                    },
                    {
                        title: "Bet Amount",
                        dataIndex: "total_betamount",
                        key: "total_betamount",
                        align: "right",
                        width: "10em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderForTotal(value, "betamount")
                    },
                    {
                        title: "Payback",
                        dataIndex: "total_paybackamount",
                        key: "total_paybackamount",
                        align: "right",
                        width: "10em",
                        onHeaderCell: (column) => ({
                            style: {
                                textAlign: "center",
                            }
                        }),
                        render: value => renderForTotal(value, "paybackamount")

                    },
                ],
            },
            {
                title: "Profit",
                dataIndex: "profit",
                key: "profit",
                sorter: true,
                align: "right",
                onHeaderCell: (column) => ({
                    style: {
                        textAlign: "center",
                    }
                }),
                render: (value) => <span className={(value > 0 ? "text-green-500" : "text-red-500") + " font-bold"}>{value.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}</span>
            }
        ]);
    const { logout , sitemode } = useAuth();
    const [data, setData] = useState([]);
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            pageSize: pageSizeOptions[1],
            total: 0,
            pageSizeOptions,
        },
        changed: false,
        filters: {},
        sorter: { field: "profit", order: "descend" },
    });

    const handleTableChange = useCallback(
        debounce((pagination, filters, sorter) => {
            setTableParams({
                ...tableParams,
                pagination,
                filters,
                sorter: { field: sorter.field, order: sorter.order },
                changed: !tableParams.changed,
            });
        }, 300),
        [tableParams]
    );
    const fetchDataCount = useCallback(() => {
        if (isEmpty(date)) {
            return
        }
        postUrl2Pro(
            "/api/tg/statistics/byuser/count",
            {
                type: selected,
                period: selected === "daily" ? moment.utc(date).format("YYYY-MM-DD") : (selected === "weekly" ? moment.utc(date).startOf("week").format("YYYY-MM-DD") + " ~ " + moment.utc(date).endOf("week").format("YYYY-MM-DD") : moment.utc(date).startOf("month").format("YYYY-MM-DD") + " ~ " + moment.utc(date).endOf("month").format("YYYY-MM-DD")),
                user,
            },
            (res) =>
                setTableParams({
                    ...tableParams,
                    pagination: { ...tableParams.pagination, total: res },
                }),
            logout
        );
    }, [selected, date, user, tableParams.changed]);
    const fetchData = useCallback(() => {

        if (isEmpty(date)) {
            return
        }
        setData(null);
        postUrl2Pro(
            "/api/tg/statistics/byuser/get",
            {
                type: selected,
                period: selected === "daily" ? moment.utc(date).format("YYYY-MM-DD") : (selected === "weekly" ? moment.utc(date).startOf("week").format("YYYY-MM-DD") + " ~ " + moment.utc(date).endOf("week").format("YYYY-MM-DD") : moment.utc(date).startOf("month").format("YYYY-MM-DD") + " ~ " + moment.utc(date).endOf("month").format("YYYY-MM-DD")),
                user,
                sorter: tableParams.sorter,
                page: tableParams.pagination.current - 1,
                pageSize: tableParams.pagination.pageSize,
            },
            (res) =>
                setData(res)
            ,
            logout
        );
    }, [tableParams.changed, selected, date, user]);

    useEffect(() => {
        fetchDataCount();
    }, [fetchDataCount]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    return <div className="mt-4 w-full">
        <Table
            columns={columns}
            bordered={true}
            dataSource={data}
            loading={!data}
            pagination={tableParams.pagination}
            onChange={handleTableChange}
            scroll={{ x: 'auto' }}
         
        />
    </div>;
};

export default DetailTable;
