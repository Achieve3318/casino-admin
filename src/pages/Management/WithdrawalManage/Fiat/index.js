import { Button, Input, Modal, Progress, Table, Tag, Space, DatePicker, Tooltip } from "antd";
import ButtonGroup from "antd/es/button/button-group";
import axios from "axios";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WithdrawalSettingModal from "../../../../components/WithdrawalSettingModal";
import { useAuth } from "../../../../context/AuthContext";
import { blockedEmail, isEmpty, postUrl } from "../../../../utility";
import { TruncateMiddle } from "../../../../utility/address";
import { dateFormat, getTimezoneForSiteMode } from "../../../../utility/date";
import { success, warning } from "../../../../utility/notification";
import { getFilterColumns } from "../../../../utility/table";
import DetailBalance from "../../../History/BalanceLog/DetailBalance";
import { USER_ROLE } from "../../../../constants";
import HiddenUsername from "../../../../utility/hiddenEmail";
import postUrl2Pro from "../../../../utility/postUrl2Pro";
import BalanceTable from "../../../../components/common/BalanceTable";
import { SUB_SITE } from "../../../../utility";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const pageSizeOptions = [10, 20, 50, 100, 500];
const { RangePicker } = DatePicker;

const normalizeFiatIp = (value = "") => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const commaSplit = trimmed.split(",")[0];
    if (commaSplit.includes("::ffff:")) {
        return commaSplit.split("::ffff:").pop();
    }
    if (commaSplit.includes("]:")) {
        const bracketMatch = commaSplit.match(/\[(.*)\]:(\d+)$/);
        if (bracketMatch) return bracketMatch[1];
    }
    const parts = commaSplit.split(":");
    if (parts.length > 1) {
        const last = parts[parts.length - 1];
        if (!Number.isNaN(Number(last))) {
            return parts.slice(0, -1).join(":") || last;
        }
        if (last.includes(".")) return last;
    }
    return commaSplit;
};

const buildFiatIpMatchMap = (rows = [], insights = {}) => {
    const duplicateMap = rows.reduce((acc, row) => {
        const normalized = normalizeFiatIp(row?.ip || "");
        if (!normalized) return acc;
        if (!acc[normalized]) acc[normalized] = [];
        acc[normalized].push(row);
        return acc;
    }, {});

    return rows.reduce((acc, row) => {
        const normalized = normalizeFiatIp(row?.ip || "");
        if (!normalized) return acc;

        const loginInfo = insights.latestLoginByUser?.[row.username];
        const loginNormalized = loginInfo ? normalizeFiatIp(loginInfo.ip || "") : "";
        const loginMatch = loginNormalized && loginNormalized === normalized;
        const loginUsage = insights.loginIpUsage?.[normalized];
        const sharedLoginUsers = (loginUsage?.usernames || [])
            .map(item => item.username)
            .filter(username => username && username !== row.username);
        const otherWithdrawalUsers = (duplicateMap[normalized] || [])
            .filter(item => item._id !== row._id)
            .map(item => item.username)
            .filter(Boolean);

        acc[row._id] = {
            normalizedIp: normalized,
            loginMatch,
            loginTimestamp: loginInfo?.createdAt,
            loginIp: loginNormalized || "",
            sharedLoginUsers: Array.from(new Set(sharedLoginUsers)),
            otherWithdrawalUsers: Array.from(new Set(otherWithdrawalUsers)),
        };
        return acc;
    }, {});
};

const FiatIpCell = ({ ip, match }) => {
    if (!ip) return "-";
    const displayIp = match?.normalizedIp || normalizeFiatIp(ip);
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

const WithdrawalManageForFiat = ({ nameFilter, onFilterChange }) => {
    const [data, setData] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [modal, setModal] = useState({ open: false, data: [] });
    const [setting, setSetting] = useState({})
    const [settingModal, setSettingModal] = useState({ open: false })
    const [loading, setLoading] = useState(true)
    const [progressModal, setProgressModal] = useState({ open: false, percent: 0, success: { percent: 0 }, result: [] })

    // Helper function to check if withdrawal is withdrawable/cancellable
    const isWithdrawable = (record) => {
        if (sitemode === "brazil"||sitemode === "grupo25") {
            // WinPay uses ordStatus: "01" (Pending) or "06" (InProgress) are withdrawable
            const ordStatus = record.ordStatus;
            return ordStatus === "01" || ordStatus === "06";
        } else {
            // Other payment methods use status: "InProgress" is withdrawable
            return record.status === "InProgress";
        }
    }

    // Helper function to check if withdrawal is disabled (completed/failed/canceled)
    const isDisabled = (record) => {
        if (sitemode === "brazil") {
            // WinPay: "07" (Completed), "08" (Failed), "09" (Canceled) are disabled
            const ordStatus = record.ordStatus;
            return ordStatus === "07" || ordStatus === "08" || ordStatus === "09";
        } else {
            // Other payment methods
            return record.status === "Completed" || record.status === "Canceled" || record.status === "Failed";
        }
    }
    const [cancelReason, setCancelReason] = useState()
    const [cancelOpen, setCancelOpen] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState(null);
    const [userFinancialSummary, setUserFinancialSummary] = useState(null);
    const [dateRange, setDateRange] = useState(null);
    const [ipMatches, setIpMatches] = useState({});
    const ipInsightRequestRef = useRef(0);
    const getDateRangeFilter = (range) => {
        if (!range || !range[0] || !range[1]) return null;
        return {
            startDate: dayjs(range[0]).toISOString(),
            endDate: dayjs(range[1]).toISOString(),
        };
    };

    const { coins, auth, logout, blockLists, sitemode } = useAuth();
    const timezoneName = useMemo(() => getTimezoneForSiteMode(sitemode), [sitemode]);
    const rangePickerTimeDefaults = useMemo(
        () => [
            dayjs().tz(timezoneName).startOf("day"),
            dayjs().tz(timezoneName).endOf("day"),
        ],
        [timezoneName]
    );
    const handleDateRangeChange = (dates) => {
        if (!dates) {
            setDateRange(null);
            return;
        }
        const converted = dates.map((date) => (date ? date.tz(timezoneName) : null));
        setDateRange(converted);
    };
    useEffect(() => {
        if (!dateRange) return;
        setDateRange((prev) =>
            prev ? prev.map((date) => (date ? date.tz(timezoneName) : null)) : null
        );
    }, [timezoneName]);
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
            dataIndex: `${sitemode === "mx" ? "money" : sitemode === "taka" ? "amount" : sitemode === "brazil" ? "amount" : "amount"}`,
            sorter: true,
            align: 'right',
            width: "10em",
            className: "text-xs sm:text-sm md:text-base",
            render: (value, record) => {
                // For WinPay, amount is stored in cents, convert to BRL
                if (sitemode === "brazil" && value) {
                    return (Number(value))
                }
                return value;
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
            render: v => <><img src={coins["BRL"]} className="w-[1em] mr-2" />BRL</>,
            isFilter: true
        },
        {
            title: "Withdraw IP",
            dataIndex: "ip",
            align: "center",
            width: "12em",
            className: "text-xs sm:text-sm md:text-base",
            render: (value, record) => <FiatIpCell ip={value} match={ipMatches[record._id]} />
        },
        {
            title: "Status",
            dataIndex: sitemode === "brazil" ? "ordStatus" : "status",
            sorter: true,
            align: "center",
            width: "10em",
            className: "text-xs sm:text-sm md:text-base",
            render: (v, record) => {
                // For WinPay, use ordStatus and map it
                const status = sitemode === "brazil" || sitemode === "grupo25" ? record.ordStatus : v;
                const statusMap = {
                    '01': 'Pending',
                    '06': 'InProgress',
                    '07': 'Completed',
                    '08': 'Failed',
                    '09': 'Canceled'
                };
                const displayStatus = (sitemode === "brazil" || sitemode === "grupo25") && statusMap[status] ? statusMap[status] : status;
                return displayStatus === "Completed" ? <Tag color="green">{displayStatus}</Tag> : (displayStatus === "Failed" ? <Tag color="pink">{displayStatus}</Tag> : displayStatus === "Canceled" ? <Tag color="pink">{displayStatus}</Tag> : <Tag color="default">{displayStatus}</Tag>);
            }
        },
        // WinPay specific columns for Brazil
        ...(sitemode === "brazil" || sitemode === "grupo25" ? [
            {
                title: "Merchant Order ID",
                dataIndex: "merchantOrderId",
                sorter: true,
                align: "center",
                isFilter: true,
                width: "18em",
                className: "text-xs sm:text-sm md:text-base",
            },
            {
                title: "Card Type",
                dataIndex: "cardType",
                sorter: true,
                align: "center",
                isFilter: true,
                width: "10em",
                className: "text-xs sm:text-sm md:text-base",
            },
            {
                title: "Wallet ID",
                dataIndex: "walletId",
                sorter: true,
                align: "center",
                isFilter: true,
                width: "15em",
                className: "text-xs sm:text-sm md:text-base",
            },
        ] : [
            {
                title: "Bank Account Name",
                dataIndex: `${sitemode === "mx" ? "name" : sitemode === "taka" ? "payer_name" : "name"}`,
                sorter: true,
                align: "center",
                isFilter: true,
                width: "15em",
                className: "text-xs sm:text-sm md:text-base",
            },
            {
                title: "Bank Account Number",
                dataIndex: `${sitemode === "mx" ? "bankCard" : sitemode === "taka" ? "account_number" : "accountNumber"}`,
                sorter: true,
                align: "center",
                isFilter: true,
                width: "15em",
                className: "text-xs sm:text-sm md:text-base",
            },
        ]),
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
            title: "Withdraw Time",
            dataIndex: "withdrawTime",
            sorter: true,
            width: "12em",
            className: "text-xs sm:text-sm md:text-base",
            render: v => v ? dateFormat(v) : '-'
        },
    ]);
   
    const fetchDataCount = () => {
        if (sitemode === "betwallet") return
        const filters = { ...tableParams.filters };

        // Add date filter if selected - format as ISO strings
        const appliedRange = getDateRangeFilter(dateRange);
        if (appliedRange) {
            filters.createdAt = {
                $gte: appliedRange.startDate,
                $lte: appliedRange.endDate,
            };
        }

        // Add username filter if provided
        if (nameFilter && nameFilter.trim()) {
            filters.username = nameFilter.trim();
        }

        postUrl(sitemode,
            `/api/winpay/getWithdrawalsListCount`,
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
    const hydrateIpMatches = useCallback((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) {
            setIpMatches({});
            return;
        }
        const ips = Array.from(new Set(rows.map(row => normalizeFiatIp(row?.ip || "")).filter(Boolean)));
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
                setIpMatches(buildFiatIpMatchMap(rows, insights));
            },
            logout,
            () => {
                if (requestId !== ipInsightRequestRef.current) return;
                setIpMatches(buildFiatIpMatchMap(rows));
            }
        );
    }, [logout, sitemode]);

    const fetchData = () => {
        setLoading(true)
        setData(null)
        setIpMatches({})
        if (sitemode === "betwallet") return
        const filters = { ...tableParams.filters };

        // Add date filter if selected - format as ISO strings
        const appliedRange = getDateRangeFilter(dateRange);
        if (appliedRange) {
            filters.createdAt = {
                $gte: appliedRange.startDate,
                $lte: appliedRange.endDate,
            };
        }

        // Add username filter if provided
        if (nameFilter && nameFilter.trim()) {
            filters.username = nameFilter.trim();
        }

        postUrl(sitemode,
            `/api/winpay/getWithdrawalsList`,
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
    useEffect(fetchDataCount, [tableParams.changed, dateRange, nameFilter, sitemode]);
    useEffect(
        fetchData,
        [
            tableParams.changed,
            dateRange,
            nameFilter,
            sitemode,
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
            isWithdrawable(w)
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
                const data = await axios.post(SUB_SITE[sitemode] + "/api/winpay/confirm", { _id })
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
            isWithdrawable(w)
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
            disabled: isDisabled(record),
            name: record._id,
        }),
    };

    useEffect(() => {
        if (selectedUsername) {
            const requestBody = {
                username: selectedUsername?.username,
            };

            // Add date range if selected
            const appliedRange = getDateRangeFilter(dateRange);
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
    }, [selectedUsername, dateRange])
    return (
        <div className="flex flex-col gap-2 w-full mt-4">
            <div className="block md:flex md:flex-row justify-between items-center gap-2 w-full">
                <div className="flex items-center gap-[1.5rem]">
                    <label className="block text-[1.5em] font-bold">Fiat</label>
                    <Button shape="circle" onClick={() => {
                        fetchDataCount()
                        fetchData();
                    }}><i className={`fa fa-refresh ${loading ? "fa-spin" : ""}`}></i></Button>
                </div>
                <ButtonGroup className="block float-right" >
                    <Button disabled={selectedRowKeys.length === 0} onClick={withdraw}>Withdraw</Button>
                    <Button disabled={selectedRowKeys.length === 0} onClick={cancel}>Cancel</Button>
                </ButtonGroup>
            </div>
            <Table
                className="mt-4"
                size="small"
                bordered
                columns={columns}
                rowSelection={rowSelection}
                scroll={{ x: "auto" }}
                rowKey={(record) => record._id}
                dataSource={data}
                loading={data === null}
                pagination={tableParams.pagination}
                onChange={handleTableChange}
                onRow={(record, index) => ({
                    onDoubleClick: (event) => {
                        setSelectedUsername(record);
                    },
                    style: { cursor: "pointer" },
                })}
            />
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
                        // Only cancel withdrawals that are withdrawable
                        const cancellableIds = data?.filter(w =>
                            selectedRowKeys.includes(w._id) &&
                            isWithdrawable(w)
                        ).map(w => w._id) || [];

                        if (cancellableIds.length === 0) {
                            warning("No cancellable withdrawals selected!")
                            setCancelOpen(false)
                            setCancelReason("")
                            return
                        }

                        postUrl(sitemode, "/api/winpay/cancel", { data: cancellableIds, cancelReason }, (data) => {
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
                    <Space direction="horizontal" size="middle" className="flex-wrap mb-4">
                        <div className="flex items-center gap-2">
                            <label className="whitespace-nowrap">Date Range:</label>
                            <RangePicker
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                format="YYYY-MM-DD HH:mm"
                                showTime={{
                                    format: "HH:mm",
                                    defaultValue: rangePickerTimeDefaults,
                                }}
                                allowClear
                                getPopupContainer={(trigger) => trigger.parentElement}
                            />
                        </div>
                    </Space>
                    {userFinancialSummary && (
                        <div className="mb-4">
                            <BalanceTable data={userFinancialSummary} />
                        </div>
                    )}
                    <DetailBalance dateRange={dateRange} pageSize={10} username={selectedUsername?.username} />
                </>
            </Modal>
        </div>
    );
};

WithdrawalManageForFiat.displayName = 'WithdrawalManageForFiat';
export default WithdrawalManageForFiat;

