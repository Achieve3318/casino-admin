import { Button, Input, Modal, Progress, Table, Tag, Space, DatePicker, Tooltip } from "antd";
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

const WithdrawalManageForTronPay = ({ nameFilter, onFilterChange }) => {
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
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [sorter, setSorter] = useState({ createdAt: -1 });
    const [filters, setFilters] = useState({});

    const { coins, auth, logout, blockLists, sitemode } = useAuth();
    const timezoneName = useMemo(() => getTimezoneForSiteMode(sitemode), [sitemode]);
    const rangePickerTimeDefaults = useMemo(
        () => [dayjs().startOf("day").tz(timezoneName), dayjs().endOf("day").tz(timezoneName)],
        [timezoneName]
    );

    const getDateRangeFilter = (range) => {
        if (!range || !range[0] || !range[1]) return null;
        return {
            startDate: dayjs(range[0]).toISOString(),
            endDate: dayjs(range[1]).toISOString(),
        };
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const countResponse = await axios.post(SUB_SITE[sitemode] + "/api/tronpay/getWithdrawalsListCount", {
                filters: { ...filters, ...getDateRangeFilter(dateRange) }
            });
            const total = parseInt(countResponse.data) || 0;

            const response = await axios.post(SUB_SITE[sitemode] + "/api/tronpay/getWithdrawalsList", {
                pagination: {
                    skip: (pagination.current - 1) * pagination.pageSize,
                    limit: pagination.pageSize
                },
                sorter,
                filters: { ...filters, ...getDateRangeFilter(dateRange) }
            });

            setData(response.data || []);
            setPagination(prev => ({ ...prev, total }));
        } catch (err) {
            if (err.response?.data === "Unauthorized") {
                logout();
            } else {
                warning(err.response?.data?.message || "Failed to fetch withdrawals");
            }
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize, sorter, filters, dateRange, sitemode, logout]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleConfirm = async (_id) => {
        try {
            const response = await axios.post(SUB_SITE[sitemode] + "/api/tronpay/confirm", { _id });
            if (response.data.success) {
                success("Withdrawal confirmed successfully");
                fetchData();
            } else {
                warning(response.data.message || "Failed to confirm withdrawal");
            }
        } catch (err) {
            if (err.response?.data === "Unauthorized") {
                logout();
            } else {
                warning(err.response?.data?.message || "Failed to confirm withdrawal");
            }
        }
    };

    const handleCancel = async () => {
        if (!cancelReason || cancelReason.trim() === "") {
            warning("Please provide a cancellation reason");
            return;
        }

        try {
            await postUrl(sitemode, "/api/tronpay/cancel", {
                data: selectedRowKeys,
                cancelReason: cancelReason.trim()
            }, (data) => {
                success(data.message || "Withdrawals cancelled successfully");
                setSelectedRowKeys([]);
                setCancelOpen(false);
                setCancelReason("");
                fetchData();
            });
        } catch (err) {
            warning(err.response?.data?.message || "Failed to cancel withdrawals");
        }
    };

    const columns = [
        {
            title: "Username",
            dataIndex: "username",
            key: "username",
            isFilter: true,
        },
       
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            align: 'right',
            render: (text, record) => {
                const amount = record.exchangeAmount || record.amount;
                const currency = record.currency || "USDT";
                if (amount === undefined || amount === null) {
                    return `0 ${currency}`;
                }
                const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
                if (isNaN(numAmount)) {
                    return `0 ${currency}`;
                }
                const formattedAmount = numAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 8,
                    useGrouping: true,
                });
                return `${formattedAmount} ${currency}`;
            },
        },
        {
            title: "Address",
            dataIndex: "address",
            key: "address",
            render: (text) => text ? <TruncateMiddle text={text} maxLength={16} showTooltip={true} /> : "-",
        },
        {
            title: "Network",
            dataIndex: "network",
            key: "network",
            render: (text) => text || "-",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                const colorMap = {
                    Completed: "green",
                    InProgress: "blue",
                    Failed: "red",
                    Canceled: "orange",
                    Pending: "default",
                };
                return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
            },
        },
        {
            title: "Trade Hash",
            dataIndex: "tradeHash",
            key: "tradeHash",
            render: (text) => text ? <TruncateMiddle address={text} length={10} /> : "-",
        },
        {
            title: "Created At",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text) => dateFormat(text, timezoneName),
            sorter: true,
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    {record.status === "Pending" && (
                        <Button
                            size="small"
                            type="primary"
                            onClick={() => handleConfirm(record._id)}
                        >
                            Confirm
                        </Button>
                    )}
                    <Button
                        size="small"
                        onClick={() => {
                            setSelectedUsername(record.username);
                            setModal({ open: true, data: [record] });
                        }}
                    >
                        Details
                    </Button>
                </Space>
            ),
        },
    ];

    const cancellableStatuses = ["InProgress", "Pending"];
    const cancellableIds = selectedRowKeys.filter((id) => {
        const record = data?.find((item) => item._id === id);
        return record && cancellableStatuses.includes(record.status);
    });

    return (
        <div>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space>
                    <RangePicker
                        showTime
                        value={dateRange}
                        onChange={setDateRange}
                        format="YYYY-MM-DD HH:mm:ss"
                    />
                    {cancellableIds.length > 0 && (
                        <Button
                            danger
                            onClick={() => setCancelOpen(true)}
                        >
                            Cancel Selected ({cancellableIds.length})
                        </Button>
                    )}
                </Space>
                <Button onClick={fetchData}>Refresh</Button>
            </div>

            <Table
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                }}
                columns={getFilterColumns(columns)}
                dataSource={data}
                loading={loading}
                rowKey="_id"
                pagination={{
                    ...pagination,
                    pageSizeOptions,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} withdrawals`,
                    onChange: (page, pageSize) => {
                        setPagination(prev => ({ ...prev, current: page, pageSize }));
                    },
                }}
                onChange={(pagination, filters, sorter) => {
                    if (sorter.field) {
                        setSorter({
                            [sorter.field]: sorter.order === "ascend" ? 1 : -1,
                        });
                    }
                }}
            />

            <Modal
                title="Cancel Withdrawals"
                open={cancelOpen}
                onOk={handleCancel}
                onCancel={() => {
                    setCancelOpen(false);
                    setCancelReason("");
                }}
            >
                <Input.TextArea
                    placeholder="Enter cancellation reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={4}
                />
            </Modal>

            <Modal
                title="Withdrawal Details"
                open={modal.open}
                onCancel={() => setModal({ open: false, data: [] })}
                footer={null}
                width={800}
            >
                {modal.data.map((record) => (
                    <div key={record._id} style={{ marginBottom: 16 }}>
                        <DetailBalance username={selectedUsername} />
                        <div style={{ marginTop: 16 }}>
                            <p><strong>Amount:</strong> {record.exchangeAmount || record.amount} {record.currency || "USDT"}</p>
                            <p><strong>Address:</strong> {record.address || "-"}</p>
                            <p><strong>Network:</strong> {record.network || "-"}</p>
                            <p><strong>Status:</strong> {record.status}</p>
                            <p><strong>Trade Hash:</strong> {record.tradeHash || "-"}</p>
                            <p><strong>Created At:</strong> {dateFormat(record.createdAt, timezoneName)}</p>
                            {record.reason && <p><strong>Reason:</strong> {record.reason}</p>}
                        </div>
                    </div>
                ))}
            </Modal>
        </div>
    );
};

export default WithdrawalManageForTronPay;

