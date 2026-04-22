import { Button, Input, Modal, Progress, Table, Tag, Card, Row, Col, Statistic, Tabs, DatePicker, Space, Tooltip } from "antd";
import ButtonGroup from "antd/es/button/button-group";
import axios from "axios";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import WithdrawalSettingModal from "../../../components/WithdrawalSettingModal";
import { useAuth } from "../../../context/AuthContext";
import { blockedEmail, isEmpty, postUrl } from "../../../utility";
import { TruncateMiddle } from "../../../utility/address";
import { dateFormat } from "../../../utility/date";
import { success, warning } from "../../../utility/notification";
import { getFilterColumns } from "../../../utility/table";
import DetailBalance from "../../History/BalanceLog/DetailBalance";
import { USER_ROLE } from "../../../constants";
import HiddenUsername from "../../../utility/hiddenEmail";
import postUrl2Pro from "../../../utility/postUrl2Pro";
import BalanceTable from "../../../components/common/BalanceTable";
import WithdrawalManageForFiat from "./Fiat";
import WithdrawalManageForTronPay from "./TronPay";
import { SUB_SITE } from "../../../utility";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const defaultRangeTime = [dayjs().startOf("day"), dayjs().endOf("day")];

const normalizeIp = (value = "") => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const commaSplit = trimmed.split(",")[0];
    const mapped = commaSplit.includes("::ffff:") ? commaSplit.split("::ffff:").pop() : commaSplit;
    const ipv4Match = mapped.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    if (ipv4Match) return ipv4Match[1];
    if (mapped.includes("]:")) {
        const bracketMatch = mapped.match(/\[(.*)\]:(\d+)$/);
        if (bracketMatch) return bracketMatch[1];
    }
    const parts = mapped.split(":");
    if (parts.length > 1) {
        const last = parts[parts.length - 1];
        if (!Number.isNaN(Number(last))) {
            return parts.slice(0, -1).join(":") || last;
        }
        if (last.includes(".")) return last;
    }
    return mapped;
};

const extractBettingIps = (record = {}) => {
    const candidateFields = [
        "betIps",
        "betIPs",
        "bettingIps",
        "bettingIPs",
        "betIpList",
        "betIp",
        "betIP",
        "bettingIp",
    ];
    const ips = new Set();
    candidateFields.forEach((field) => {
        const value = record[field];
        if (!value) return;
        if (Array.isArray(value)) {
            value.forEach((ip) => {
                const normalized = normalizeIp(ip || "");
                if (normalized) ips.add(normalized);
            });
        } else if (typeof value === "string") {
            const normalized = normalizeIp(value);
            if (normalized) ips.add(normalized);
        }
    });
    return Array.from(ips);
};

const buildIpMatchMap = (rows = [], insights = {}) => {
    const duplicateMap = rows.reduce((acc, row) => {
        const normalized = normalizeIp(row?.ipaddress || "");
        if (!normalized) return acc;
        if (!acc[normalized]) acc[normalized] = [];
        acc[normalized].push(row);
        return acc;
    }, {});

    return rows.reduce((acc, row) => {
        const normalized = normalizeIp(row?.ipaddress || "");
        if (!normalized) return acc;

        const loginInfo = insights.latestLoginByUser?.[row.username];
        const loginMatch = loginInfo && normalizeIp(loginInfo.ip || "") === normalized;
        const loginUsage = insights.loginIpUsage?.[normalized];
        const otherWithdrawalUsers = (duplicateMap[normalized] || [])
            .filter((item) => item._id !== row._id)
            .map((item) => item.username)
            .filter(Boolean);
        const bettingIps = extractBettingIps(row);

        acc[row._id] = {
            normalizedIp: normalized,
            loginMatch,
            loginTimestamp: loginInfo?.createdAt,
            sharedLoginUsers: (loginUsage?.usernames || [])
                .map((item) => item.username)
                .filter((username) => username && username !== row.username),
            otherWithdrawalMatch: otherWithdrawalUsers.length > 0,
            otherWithdrawalUsers: Array.from(new Set(otherWithdrawalUsers)),
            bettingMatch: bettingIps.includes(normalized),
            loginIp: loginInfo ? normalizeIp(loginInfo.ip || "") : "",
        };
        return acc;
    }, {});
};

const IpMatchCell = ({ ip, match }) => {
    if (!ip) return "-";
    const displayIp = match?.normalizedIp || normalizeIp(ip);
    const loginIp = match?.loginIp;
    const otherUsers = Array.from(
        new Set([...(match?.sharedLoginUsers || []), ...(match?.otherWithdrawalUsers || [])])
    );

    if (!loginIp || match?.loginMatch) {
        if (!otherUsers.length) {
            return <span>{displayIp}</span>;
        }
        return (
            <>
                <span>{displayIp}</span>
            </>
        );
    }

    return (
        <Tooltip
            title={
                <>
                    <div>Latest login IP: {loginIp}</div>
                    {otherUsers.length > 0 && (
                        <div>Also used by: {otherUsers.join(", ")}</div>
                    )}
                </>
            }
        >
            <span style={{ color: "#ff4d4f" }}>{displayIp}</span>
        </Tooltip>
    );
};

const pageSizeOptions = [10, 20, 50, 100, 500];

const WithdrawalManage = () => {
    const [data, setData] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [modal, setModal] = useState({ open: false, data: [] });
    const [setting, setSetting] = useState({})
    const [settingModal, setSettingModal] = useState({ open: false })
    const [loading, setLoading] = useState(true)
    const [progressModal, setProgressModal] = useState({ open: false, percent: 0, success: { percent: 0 }, result: [] })
    const [cancelReason, setCancelReason] = useState()
    const [cancelOpen, setCancelOpen] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState(null);
    const [userFinancialSummary, setUserFinancialSummary] = useState(null);
    const [dateRange, setDateRange] = useState(null);
    const [nameFilter, setNameFilter] = useState("");
    const [totalWithdrawAmount, setTotalWithdrawAmount] = useState(0);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [appliedFilters, setAppliedFilters] = useState({ dateRange: null, nameFilter: "" });
    const [ipMatches, setIpMatches] = useState({});
    const ipInsightRequestRef = useRef(0);
    const getDateRangeFilter = (range) => {
        if (!range || !range[0] || !range[1]) return null;
        return {
            startDate: dayjs(range[0]).toISOString(),
            endDate: dayjs(range[1]).toISOString(),
        };
    };

    const { coins, auth, logout, blockLists, sitemode, siteCurrency, prices } = useAuth();
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
    const columns = getFilterColumns([
        ...(auth?.user?.role === USER_ROLE.ADMIN
            ? [
                {
                    title: "ID",
                    dataIndex: "_id",
                    sorter: true,
                    width: "6em",
                    align: "center",
                },
            ]
            : []),
        {
            title: "VIP",
            dataIndex: "VIP",
            align: 'center',
            width: "7em",
            className: "text-xs sm:text-sm md:text-base",
            render: (value) => <span className={`p-2 rounded-md bg-${value?.color}`}>{value?.level}</span>
        },
        {
            title: "Username",
            dataIndex: "username",
            sorter: true,
            align: 'center',
            width: "14em",
            className: "text-xs sm:text-sm md:text-base",
            render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
        },

        {
            title: "Amount",
            dataIndex: "amount",
            sorter: true,
            align: 'right',
            width: "10em",
            className: "text-xs sm:text-sm md:text-base",
            render: (value) => {
                if (value === undefined || value === null) {
                    return "0";
                }
                const numValue = typeof value === 'number' ? value : parseFloat(value);
                if (isNaN(numValue)) {
                    return "0";
                }
                return numValue.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 8,
                    useGrouping: true,
                });
            },
            onHeaderCell: () => ({ style: { textAlign: "center" } }),
        },
        {
            title: "Fee",
            dataIndex: "fee",
            sorter: true,
            width: "8em",
            align: 'right',
            className: "text-xs sm:text-sm md:text-base",
            render: (value) => {
                if (value === undefined || value === null) {
                    return "0";
                }
                const numValue = typeof value === 'number' ? value : parseFloat(value);
                if (isNaN(numValue)) {
                    return "0";
                }
                return numValue.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 8,
                    useGrouping: true,
                });
            },
            onHeaderCell: () => ({ style: { textAlign: "center" } }),
        },
        {
            title: "Currency",
            dataIndex: "currency",
            sorter: true,
            width: "10em",
            align: 'center',
            className: "text-xs sm:text-sm md:text-base",
            render: v => <><img src={coins[v]} className="w-[1em] mr-2" />{v}</>,
            isFilter: true
        },
        {
            title: "Network",
            dataIndex: "network",
            sorter: true,
            align: 'center',
            width: "9em",
            className: "text-xs sm:text-sm md:text-base",

        },
        {
            title: "Withdraw IP",
            dataIndex: "ipaddress",
            align: 'center',
            width: "12em",
            className: "text-xs sm:text-sm md:text-base",
            render: (value, record) => <IpMatchCell ip={value} match={ipMatches[record._id]} />
        },
        {
            title: "Status",
            dataIndex: "status",
            sorter: true,
            align: "center",
            width: "10em",
            className: "text-xs sm:text-sm md:text-base",
            render: v => v === "Completed" ? <Tag color="green">{v}</Tag> : (v === "Failed" ? <Tag color="pink">{v}</Tag> : v === "Canceled" ? <Tag color="pink">{v}</Tag> : <Tag color="default">{v}</Tag>)
        },
        {
            title: "Address",
            dataIndex: "address",
            sorter: true,
            align: "center",
            isFilter: true,
            width: "15em",
            className: "text-xs sm:text-sm md:text-base",
            render: v => <TruncateMiddle text={v} maxLength={16} showTooltip={true} />
        },


        {
            title: "Reason",
            dataIndex: "reason",
            sorter: true,
            width: "12em",
            align: "center",
            className: "text-xs sm:text-sm md:text-base",
            render: (v, all) => all.status !== "Completed" && <a onClick={() => {
                try {
                    setModal({
                        open: true,
                        data: JSON.parse(v)
                    })
                }
                catch (e) {
                    setModal({
                        open: true,
                        data: { reason: v }
                    })
                }
            }}
            >View</a>
        },
        {
            title: "Created",
            dataIndex: "createdAt",
            sorter: true,
            width: "12em",
            className: "text-xs sm:text-sm md:text-base",
            render: v => dateFormat(v)
        },
        {
            title: "Confirmed",
            dataIndex: "updatedAt",
            sorter: true,
            width: "12em",
            className: "text-xs sm:text-sm md:text-base",
            render: v => dateFormat(v)
        },
        {
            title: "Withdraw Time",
            dataIndex: "withdrawTime",
            sorter: true,
            width: "12em",
            className: "text-xs sm:text-sm md:text-base",
            render: v => v ? dateFormat(v) : '-'
        },
    ]);
    const fetchDataCount = () => {
        const filters = { ...tableParams.filters };
        
        // Add date filter if selected - format as ISO strings in MongoDB query format
        const appliedRange = getDateRangeFilter(appliedFilters.dateRange);
        if (appliedRange) {
            filters.createdAt = {
                $gte: appliedRange.startDate,
                $lte: appliedRange.endDate,
            };
        }
        
        // Add username filter if provided
        if (appliedFilters.nameFilter && appliedFilters.nameFilter.trim()) {
            filters.username = appliedFilters.nameFilter.trim();
        }
        
        postUrl2Pro(
            "/api/transactions/withdrawal/req/count",
            {
                filters: filters,
                sorter: tableParams.sorter,
            }
            ,
            (res) =>
                setTableParams({
                    ...tableParams,
                    pagination: { ...tableParams.pagination, total: res },
                })

            , logout)
    };
    const fetchData = () => {
        setLoading(true)
        setData(null)
        setIpMatches({})
        const filters = { ...tableParams.filters };
        
        // Add date filter if selected - format as ISO strings in MongoDB query format
        const appliedRange = getDateRangeFilter(appliedFilters.dateRange);
        if (appliedRange) {
            filters.createdAt = {
                $gte: appliedRange.startDate,
                $lte: appliedRange.endDate,
            };
        }
        
        // Add username filter if provided
        if (appliedFilters.nameFilter && appliedFilters.nameFilter.trim()) {
            filters.username = appliedFilters.nameFilter.trim();
        }
        
        postUrl2Pro(
            "/api/transactions/withdrawal/req",
            {
                page: tableParams.pagination.current - 1,
                pageSize: tableParams.pagination.pageSize,
                filters: filters,
                sorter: tableParams.sorter,
            }
            , (data) => {
                setData(data)
                setLoading(false)
                setSelectedRowKeys([])
                hydrateIpMatches(data)
            }, logout);
    };
    useEffect(fetchDataCount, [tableParams.changed]);
    useEffect(
        fetchData,
        [
            tableParams.changed,
        ]
    );

    const fetchSetting = () => {
        postUrl2Pro("/api/transactions/withdrawal/setting/get", {}, ({ several, amount }) => setSetting({ several, amount }))
    }

    useEffect(() => {
        if (!settingModal.open)
            fetchSetting()
    }, [settingModal.open])
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
    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const withdraw = async () => {
        if (selectedRowKeys.length === 0) {
            warning("Select rows for withdrawing!")
            return
        }
        // Filter out withdrawals that are already cancelled, failed, or completed
        const withdrawableWithdrawals = data?.filter(w => 
            selectedRowKeys.includes(w._id) && 
            w.status === "InProgress"
        ) || [];
        
        if (withdrawableWithdrawals.length === 0) {
            warning("Selected withdrawals are already cancelled, failed, or completed and cannot be withdrawn!")
            return
        }
        
        if (withdrawableWithdrawals.length < selectedRowKeys.length) {
            warning(`Only ${withdrawableWithdrawals.length} of ${selectedRowKeys.length} selected withdrawal(s) can be withdrawn. The rest are already cancelled/failed/completed.`)
        }
        
        setProgressModal(prev => ({ ...prev, open: true, title: 'Withdrawing...', finish: false, result: [] }))

        let count = 0
        const withdrawableIds = withdrawableWithdrawals.map(w => w._id)

        for (let index = 0; index < withdrawableIds.length; index++) {
            const _id = withdrawableIds[index]
            if (index !== 0) {
                await new Promise(resolve => setTimeout(resolve, 2000))
            }
            try {
                const data = await axios.post(SUB_SITE[sitemode] + '/api/crypto/withdrawConfirm', { _id })
                setProgressModal(prev => ({ ...prev, percent: (index + 1) * 100 / withdrawableIds.length, success: { percent: (prev.success?.percent || 0) + 100 / withdrawableIds.length }, result: [...(prev.result || []), { ...data }] }))
                count++
            } catch (e) {
                setProgressModal(prev => ({ ...prev, percent: (index + 1) * 100 / withdrawableIds.length, status: 'exception', result: [...(prev.result || []), { ...e.response.data }] }))
            }
        }

        setProgressModal(prev => ({ ...prev, title: `${count}/${withdrawableIds.length} is proceeded successfully!`, finish: true }))
    }

    const cancel = () => {
        if (selectedRowKeys.length === 0) {
            warning("Select rows for canceling!")
            return
        }
        // Filter out withdrawals that are already cancelled, failed, or completed
        const cancellableWithdrawals = data?.filter(w => 
            selectedRowKeys.includes(w._id) && 
            w.status === "InProgress"
        ) || [];
        
        if (cancellableWithdrawals.length === 0) {
            warning("Selected withdrawals are already cancelled, failed, or completed and cannot be cancelled again!")
            return
        }
        
        if (cancellableWithdrawals.length < selectedRowKeys.length) {
            warning(`Only ${cancellableWithdrawals.length} of ${selectedRowKeys.length} selected withdrawal(s) can be cancelled. The rest are already cancelled/failed/completed.`)
        }
        
        setCancelOpen(true)
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => ({
            disabled: record.status === "Completed" || record.status === "Canceled" || record.status === "Failed",
            name: record._id,
        }),
    };

    useEffect(() => {
        if (selectedUsername) {
            const requestBody = {
                username: selectedUsername?.username,
            };
            
            // Add date range if selected
            const appliedRange = getDateRangeFilter(appliedFilters.dateRange);
            if (appliedRange) {
                requestBody.dateRange = {
                    startDate: appliedRange.startDate,
                    endDate: appliedRange.endDate,
                };
            }
            
            postUrl(sitemode,
                "/api/ballance/getUserFinancialSummary",
                requestBody
                , (data) => {
                    setUserFinancialSummary(data.data)
                }, logout);
        }
    }, [selectedUsername, appliedFilters.dateRange])

    // Fetch total withdraw amount - always fetch, with or without period filter
    useEffect(() => {
        const filters = {};
        
        // Add date filter only if period is selected - format as ISO strings
        const appliedRange = getDateRangeFilter(appliedFilters.dateRange);
        if (appliedRange) {
            filters.createdAt = {
                $gte: appliedRange.startDate,
                $lte: appliedRange.endDate,
            };
        }
        
        // Add username filter if provided
        if (appliedFilters.nameFilter && appliedFilters.nameFilter.trim()) {
            filters.username = appliedFilters.nameFilter.trim();
        }
        
        // Add currency filter if selected from table
        if (tableParams.filters?.currency) {
            const currencies = Array.isArray(tableParams.filters.currency) 
                ? tableParams.filters.currency 
                : [tableParams.filters.currency];
            if (currencies.length > 0) {
                filters.currency = currencies[0];
            }
        }
        
        // Fetch crypto withdrawal total from provider
        postUrl2Pro(
            "/api/transactions/withdrawal/req/total",
            { filters: filters },
            (cryptoTotal) => {
                // Fetch fiat withdrawal total from backend if not betwallet
                if (sitemode !== "betwallet") {
                    postUrl(sitemode,
                        `/api/winpay/getWithdrawalsTotal`,
                        { filters: filters },
                        (fiatTotal) => {
                            // Convert crypto and fiat amounts to site currency
                            const cryptoCurrency = cryptoTotal?.currency;
                            const fiatCurrency = fiatTotal?.currency;
                            const cryptoAmount = cryptoTotal?.total || 0;
                            const fiatAmount = fiatTotal?.total || 0;
                            
                            // Convert to site currency using prices (prices are in USD)
                            const cryptoPrice = prices[cryptoCurrency] || 0;
                            const fiatPrice = prices[fiatCurrency] || 0;
                            const siteCurrencyPrice = prices[siteCurrency] || 1;
                            
                            // Convert amounts to USD first
                            const cryptoInUSD = cryptoAmount * cryptoPrice;
                            const fiatInUSD = fiatAmount * fiatPrice;
                            const totalInUSD = cryptoInUSD + fiatInUSD;
                            
                            // Convert from USD to site currency (divide by siteCurrency price since prices are USD per unit)
                            // If siteCurrency is USD, price is 1, so division gives same value
                            const totalInSiteCurrency = siteCurrencyPrice > 0 ? totalInUSD / siteCurrencyPrice : totalInUSD;
                            
                            setTotalWithdrawAmount({
                                crypto: cryptoTotal || { total: 0, currency: null },
                                fiat: fiatTotal || { total: 0, currency: null },
                                total: totalInSiteCurrency,
                                currency: siteCurrency
                            });
                        },
                        logout
                    );
                } else {
                    // Only crypto for betwallet
                    const cryptoCurrency = cryptoTotal?.currency;
                    const cryptoAmount = cryptoTotal?.total || 0;
                    const cryptoPrice = prices[cryptoCurrency] || 0;
                    const siteCurrencyPrice = prices[siteCurrency] || 1;
                    
                    // Convert to site currency
                    const cryptoInUSD = cryptoAmount * cryptoPrice;
                    const totalInSiteCurrency = siteCurrencyPrice > 0 ? cryptoInUSD / siteCurrencyPrice : cryptoInUSD;
                    
                    setTotalWithdrawAmount({
                        crypto: cryptoTotal || { total: 0, currency: null },
                        fiat: { total: 0, currency: null },
                        total: totalInSiteCurrency,
                        currency: siteCurrency
                    });
                }
            },
            logout
        );
    }, [appliedFilters.dateRange, appliedFilters.nameFilter, tableParams.filters?.currency, sitemode, siteCurrency, prices]);

    // Handle currency filter change to update selected currency
    useEffect(() => {
        if (tableParams.filters?.currency) {
            const currencies = Array.isArray(tableParams.filters.currency) 
                ? tableParams.filters.currency 
                : [tableParams.filters.currency];
            setSelectedCurrency(currencies.length > 0 ? currencies[0] : null);
        } else {
            setSelectedCurrency(null);
        }
    }, [tableParams.filters?.currency]);
    
    const handleFilterChange = () => {
        // Trigger filter by updating tableParams which will trigger useEffect
        setTableParams({
            ...tableParams,
            pagination: { ...tableParams.pagination, current: 1 },
            changed: !tableParams.changed,
        });
    };

    const handleFilterApply = () => {
        // Store the applied filters
        setAppliedFilters({ dateRange, nameFilter });
        // Apply the filters by triggering the data fetch
        handleFilterChange();
    };

    const hydrateIpMatches = useCallback((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) {
            setIpMatches({});
            return;
        }
        const ips = Array.from(new Set(rows.map(row => normalizeIp(row?.ipaddress || "")).filter(Boolean)));
        const usernames = Array.from(new Set(rows.map(row => row?.username).filter(Boolean)));
        if (!ips.length && !usernames.length) {
            setIpMatches({});
            return;
        }
        const requestId = ++ipInsightRequestRef.current;
        postUrl(
            sitemode,
            "/api/userLogin/ip/insights",
            { ips, usernames },
            (insights) => {
                if (requestId !== ipInsightRequestRef.current) return;
                setIpMatches(buildIpMatchMap(rows, insights));
            },
            logout,
            () => {
                if (requestId !== ipInsightRequestRef.current) return;
                setIpMatches(buildIpMatchMap(rows));
            }
        );
    }, [logout, sitemode]);

    return (
        <div className="flex flex-col gap-2 w-full mt-4">
            <div className="flex items-center justify-between gap-[1.5rem]">
                <label className="block text-[2em] font-extrabold">Withdrawal Requests</label>
                <Button type="primary" onClick={() => setSettingModal({ open: true })}>Setting</Button>
            </div>
            <div className="flex flex-col gap-2 w-full mt-[1rem]">
                <Space direction="horizontal" size="middle" className="w-full flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="whitespace-nowrap">Date Range:</label>
                        <RangePicker
                            value={dateRange}
                            onChange={(dates) => {
                                setDateRange(dates);
                            }}
                            format="YYYY-MM-DD HH:mm"
                            showTime={{
                                format: "HH:mm",
                                defaultValue: defaultRangeTime,
                            }}
                            allowClear
                            getPopupContainer={(trigger) => trigger.parentElement}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="whitespace-nowrap">Username:</label>
                        <Input
                            placeholder="Enter username"
                            value={nameFilter}
                            onChange={(e) => {
                                setNameFilter(e.target.value);
                            }}
                            onPressEnter={handleFilterApply}
                            style={{ width: 200 }}
                            allowClear
                        />
                        <Button type="primary" onClick={handleFilterApply}>Filter</Button>
                    </div>
                    {totalWithdrawAmount && (
                        <div className="flex items-center gap-2">
                            <label className="whitespace-nowrap font-bold">
                                Total Withdraw: {
                                    (() => {
                                        const total = totalWithdrawAmount?.total !== undefined 
                                            ? totalWithdrawAmount.total 
                                            : ((totalWithdrawAmount?.crypto?.total || 0) + (totalWithdrawAmount?.fiat?.total || 0));
                                        if (total === undefined || total === null || isNaN(total)) {
                                            return "0";
                                        }
                                        return Number(total).toLocaleString("en-US", {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 8,
                                            useGrouping: true,
                                        });
                                    })()
                                } {siteCurrency || totalWithdrawAmount?.currency || 'USD'}
                            </label>
                        </div>
                    )}
                </Space>
            </div>
            

            {sitemode !== "betwallet" && (
                <WithdrawalManageForFiat 
                    dateRange={appliedFilters.dateRange}
                    nameFilter={appliedFilters.nameFilter}
                    onFilterChange={handleFilterChange}
                />
            )}
            <Modal title="Reason" open={modal.open} footer={null} onCancel={() => setModal({ open: false, data: [] })}>
                {Object.keys(modal.data).map(item => (
                    <div className="w-full flex">
                        <div className="w-1/4">{item} : </div>
                        <div className="w-3/4">{JSON.stringify(modal.data[item])}</div>
                    </div>
                ))}
            </Modal>
            <WithdrawalSettingModal {...settingModal} data={({ ...setting })} onCancel={() => setSettingModal({ open: false })} ></WithdrawalSettingModal>
            <Modal title={progressModal.title} open={progressModal.open} footer={null} onCancel={progressModal.finish ? () => {
                fetchDataCount()
                fetchData()
                setProgressModal(prev => ({ ...prev, open: false, percent: 0, success: { percent: 0 }, result: [] }))
            } : null}
            >
                <Progress percent={progressModal.percent} success={progressModal.success} status={progressModal.status}
                    format={(percent) => Number(percent).toFixed(2) + "%"}
                />
                <div className="mt-2">
                    <p>Result :</p>
                    {progressModal.result.map((error, index) => <p className='flex items-center gap-2' key={index}>
                        <i className={`fa fa-${error.success ? 'check-circle' : 'times-circle'} ${error.success ? 'text-green-600' : 'text-red-600'}`}></i>{typeof error.message === 'string' ? error.message : JSON.stringify(error.message)}</p>)}
                </div>
            </Modal>
            <Modal title="Are you sure about canceling?" open={cancelOpen} onCancel={() => {
                setCancelOpen(false)
                setCancelReason("")
            }}
                onOk={
                    () => {
                        // Only cancel withdrawals that are in InProgress status
                        const cancellableIds = data?.filter(w => 
                            selectedRowKeys.includes(w._id) && 
                            w.status === "InProgress"
                        ).map(w => w._id) || [];
                        
                        if (cancellableIds.length === 0) {
                            warning("No cancellable withdrawals selected!")
                            setCancelOpen(false)
                            setCancelReason("")
                            return
                        }
                        
                        postUrl2Pro('/api/crypto/cancelWithdraw', { data: cancellableIds, cancelReason }, (data) => {
                            success(data.message)
                            fetchDataCount()
                            fetchData()
                            setCancelOpen(false)
                            setCancelReason("")
                        })
                    }
                }
                okText="Sure"
            >
                <div className="w-full flex flex-col gap-2 items-start">
                    <label className="text-sm">Reason</label>
                    <Input value={cancelReason || ''} onChange={e => {
                        setCancelReason(e.target.value)
                    }} ></Input>
                </div>
            </Modal>
            <Modal width="100%" position="center" title={"User Balance Info of " + selectedUsername?.username} open={!!selectedUsername} onCancel={() => setSelectedUsername(null)}>
                <>
                    {userFinancialSummary && (
                        <div className="mb-4">
                            <BalanceTable data={userFinancialSummary} />
                        </div>
                    )}
                    <DetailBalance pageSize={10} username={selectedUsername?.username} />
                </>
            </Modal>
        </div>
    );
};

WithdrawalManage.displayName = 'WithdrawalManage';
export default WithdrawalManage;

