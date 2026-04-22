import { Switch, Table, Tag } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { postUrl } from '../../../utility'
import { debounce } from 'lodash';

const pageSizeOptions = [10, 20, 50, 100];



export default () => {
    const { siteCurrency, prices, sitemode } = useAuth()
    const [data, setData] = useState(null)
    const [tableParams, setTableParams] = useState({
        pagination: {
            size: "default",
            current: 1,
            pageSize: pageSizeOptions[0],
            total: 0,
            pageSizeOptions,
            showQuickJumper: true,
            showSizeChanger: true,
        },
        changed: false,
        filters: {},
        sorter: {},
    });

    const fetchDataCount = useCallback(() => {
        postUrl(sitemode,
            "/api/bonus/refer/vip/getStatusCount",
            {
                filters: tableParams.filters,
                sorter: tableParams.sorter,
            },
            (res) =>
                setTableParams((prev) => ({
                    ...prev,
                    pagination: { ...prev.pagination, total: res },
                })),
        );
    }, [tableParams.changed]);

    const fetchData = useCallback(() => {
        setData(null);
        postUrl(sitemode,
            "/api/bonus/refer/vip/getStatus",
            {
                page: tableParams.pagination.current - 1,
                pageSize: tableParams.pagination.pageSize,
                filters: tableParams.filters,
                sorter: tableParams.sorter,
            },
            (res) => setData(res)
        );
    }, [tableParams.changed]);

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
                changed: !tableParams.changed,
                pagination,
                filters,
                sorter,
            });
        }, 300),
        [tableParams]
    );

    const [columns, setColumns] = useState([{
        title: "Username",
        dataIndex: 'username',
        align: 'center',
        width: '5em',
        className: "text-xs sm:text-sm md:text-base",
    }, {
        title: "Level(number of reaches)",
        dataIndex: "level",
        align: 'center',
        width: '7em',
        className: "text-xs sm:text-sm md:text-base",
        render(level, row) {
            return `Level ${level}`
        }
    }, {
        title: "Subordinates",
        children: [{
            title: "Username",
            dataIndex: "sub_username",
            align: "center",
            width: '5em',
            className: "text-xs sm:text-sm md:text-base",
        }, {
            title: "Depsoit",
            children: [{
                title: 'USD($)',
                dataIndex: 'deposit',
                align: 'right',
                width: '3em',
                className: "text-xs sm:text-sm md:text-base",
            }, {
                title: prices[siteCurrency] ? siteCurrency : "USD",
                dataIndex: 'deposit',
                align: 'right',
                width: '3em',
                className: "text-xs sm:text-sm md:text-base",
                render(amount) {
                    return (amount / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toFixed(2) + " " + (prices[siteCurrency] ? siteCurrency : "USD")
                }
            }]
        }, {
            title: "Wager",
            children: [{
                title: 'USD($)',
                dataIndex: 'wager',
                align: 'right',
                width: '3em',
                className: "text-xs sm:text-sm md:text-base",
            }, {
                title: prices[siteCurrency] ? siteCurrency : "USD",
                dataIndex: 'wager',
                align: 'right',
                width: '3em',
                className: "text-xs sm:text-sm md:text-base",
                render(amount) {
                    return (amount / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toFixed(2) + " " + (prices[siteCurrency] ? siteCurrency : "USD")
                }
            }]
        }, {
            title: "Status",
            dataIndex: "received",
            align: 'center',
            width: "3em",
            className: "text-xs sm:text-sm md:text-base",
            render(received, row) {
                return <Tag color={received ? 'cyan' : 'error'}>{received ? (row.prize + '$ (' + ((row.prize/(prices[siteCurrency] ? prices[siteCurrency] : 1)).toFixed(2)) + " " +(prices[siteCurrency]? siteCurrency:"$") + ')') : "Pending"}</Tag>
            }
        }]
    }, {
        title: "Enable/Disable",
        dataIndex: "disabled",
        align: 'center',
        width: "3em",
        className: "text-xs sm:text-sm md:text-base",
        render(disabled) {
            return <Switch checked={disabled} />
        }
    }])

    useEffect(() => {
        if( data) {
            const rowSapnForUsername = {}, rowSpanForLevel = {}
            data.forEach((item, index) => {
                if( index === 0|| item['level'] !== data[index-1]['level']){
                    let count = 1
                    for ( let i = index + 1; i<data.length; i ++){
                        if( data[i]['level'] === item['level']) count ++
                        else break
                    }
                    rowSpanForLevel[index] = count
                } else{
                    rowSpanForLevel[index] = 0
                }
                if( index === 0|| item['username'] !== data[index-1]['username']){
                    let count = 1
                    for ( let i = index + 1; i<data.length; i ++){
                        if( data[i]['username'] === item['username']) count ++
                        else break
                    }
                    rowSapnForUsername[index] = count
                } else{
                    rowSapnForUsername[index] = 0
                }
            })
            setColumns(prev => {
                const temp = [...prev]
                temp[0].render = (value, row, index) =>{
                    return {
                        children: value,
                        props: {
                            rowSpan: rowSapnForUsername[index]
                        }
                    }
                }
                temp[1].render = (value, row, index) => {
                    return {
                        children: `Level ${value}(${rowSpanForLevel[index]} members)`,
                        props: {
                            rowSpan: rowSpanForLevel[index]
                        }
                    }
                }
                temp[temp.length - 1].render = (disabled, row, index) =>{
                    return {
                        children: <Switch checked={!disabled} />,
                        props: {
                            rowSpan: rowSapnForUsername[index]
                        }
                    }
                }
                return temp
            })
        }
    }, [data])
    return <Table size="small"
        scroll={{ x: "auto" }}
        bordered
        columns={columns}
        rowKey={(record) => record.username}
        dataSource={data}
        loading={data === null}
        pagination={tableParams.pagination}
        onChange={handleTableChange} />

}