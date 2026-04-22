import React, { useState, useEffect } from 'react';
import { Table, Input, Button, DatePicker, Card, Space, Typography, Tag } from 'antd';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { success, error } from '../../../utility/notification';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SUB_SITE } from '../../../utility';
import { DownloadOutlined } from '@ant-design/icons';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const GAME_TYPE = {
    '1-digit': 'One number',
    '2-digits': 'Two numbers',
    '3-digits': 'Three numbers',
    '4-digits': 'Four numbers',
    '5-digits': 'Five numbers',
    '2-digits-present': 'Two numbers present',
    '3-digits-present': 'Three numbers present',
    'group-three': 'Three numbers group',
    'group-six': 'Six numbers group',
    'filter': 'Filter by number'
}

const LotteryBettingHistory = () => {
    const { logout, sitemode } = useAuth();
    const API_URL = SUB_SITE[sitemode] + "/api";

    // History state
    const [bettingHistory, setBettingHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPagination, setHistoryPagination] = useState({
        current: 1,
        pageSize: 50,
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100', '200'],
        showQuickJumper: true,
    });
    const [historyFilters, setHistoryFilters] = useState({
        username: '',
        currency: '',
        issueNumber: '',
        dateRange: null,
    });

    // Format user's bet for display (e.g., "123,23,X,X,X")
    const formatUserBet = (bet) => {
        if (!bet || typeof bet !== 'object') {
            return '-';
        }

        const positions = ['ten-thousand', 'thousand', 'hundred', 'ten', 'unit'];
        const formatted = positions.map(pos => {
            const numbers = bet[0][pos];
            if (Array.isArray(numbers) && numbers.length > 0) {
                // Sort numbers and concatenate them
                return numbers.sort((a, b) => a - b).join('');
            }
            return 'X';
        });

        return formatted.join('，');
    };

    // Fetch betting history
    const fetchBettingHistory = async (page = 1, pageSize = 50) => {
        try {
            setHistoryLoading(true);
            const params = {
                limit: pageSize,
                offset: (page - 1) * pageSize,
            };

            if (historyFilters.username) {
                params.username = historyFilters.username;
            }

            if (historyFilters.currency) {
                params.currency = historyFilters.currency;
            }

            if (historyFilters.issueNumber) {
                params.issueNumber = historyFilters.issueNumber;
            }

            if (historyFilters.dateRange && historyFilters.dateRange[0] && historyFilters.dateRange[1]) {
                params.startDate = historyFilters.dateRange[0].startOf('day').toISOString();
                params.endDate = historyFilters.dateRange[1].endOf('day').toISOString();
            }

            const response = await axios.get(`${API_URL}/admin/lottery/betting-history`, {
                params,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                setBettingHistory(response.data.data);
                setHistoryPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: response.data.total || 0,
                }));
            }
        } catch (err) {
            console.error('Error fetching betting history:', err);
            error('Failed to fetch betting history');
        } finally {
            setHistoryLoading(false);
        }
    };

    // Download betting history as CSV
    const handleDownloadHistory = async () => {
        try {
            setHistoryLoading(true);
            const params = {
                limit: 10000, // Large limit for download
                offset: 0,
            };

            if (historyFilters.username) {
                params.username = historyFilters.username;
            }

            if (historyFilters.currency) {
                params.currency = historyFilters.currency;
            }

            if (historyFilters.issueNumber) {
                params.issueNumber = historyFilters.issueNumber;
            }

            if (historyFilters.dateRange && historyFilters.dateRange[0] && historyFilters.dateRange[1]) {
                params.startDate = historyFilters.dateRange[0].startOf('day').toISOString();
                params.endDate = historyFilters.dateRange[1].endOf('day').toISOString();
            }

            const response = await axios.get(`${API_URL}/admin/lottery/betting-history`, {
                params,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                const data = response.data.data;

                // Create CSV content
                const headers = ['Plan Number', 'Username', "User's Bet", 'Issue Number', 'Winning Numbers', 'Betting Amount', 'Betting Time', 'Winning Amount', 'Status', 'Currency'];
                const rows = data.map(item => [
                    item.planNumber || '',
                    item.username || '',
                    formatUserBet(item.bet),
                    item.issueNumber || '',
                    item.winningNumbers || '',
                    item.betAmount || 0,
                    dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                    item.winAmount || 0,
                    item.status || '',
                    item.currency || '',
                ]);

                const csvContent = [
                    headers.join('，'),
                    ...rows.map(row => row.map(cell => `"${cell}"`).join('，'))
                ].join('\n');

                // Create and download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `lottery_betting_history_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                success('Betting history downloaded successfully');
            }
        } catch (err) {
            console.error('Error downloading betting history:', err);
            error('Failed to download betting history');
        } finally {
            setHistoryLoading(false);
        }
    };

    // History table columns
    const historyColumns = [
        {
            title: 'Plan Number',
            dataIndex: 'planNumber',
            key: 'planNumber',
            align: 'center',
            width: 150,
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            align: 'center',
            width: 150,
        },
        {
            title: 'Issue Number',
            dataIndex: 'issueNumber',
            key: 'issueNumber',
            align: 'center',
            width: 120,
            render: (text) => text || '-',
        },
        {
            title: "User's Bet",
            dataIndex: 'bet',
            key: 'userBet',
            align: 'center',
            width: 200,
            render: (bet) => (
                <Text strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                    {formatUserBet(bet)}
                </Text>
            ),
        },

        {
            title: 'Winning Numbers',
            dataIndex: 'winningNumbers',
            key: 'winningNumbers',
            align: 'center',
            width: 150,
            render: (text) => text ? (
                <Text strong style={{ fontSize: '18px', color: '#fbbf24', fontFamily: 'monospace' }}>
                    {text}
                </Text>
            ) : '-',
        },
        {
            title: 'Betting Amount',
            dataIndex: 'betAmount',
            key: 'betAmount',
            align: 'right',
            width: 130,
            render: (amount, record) => `${amount?.toLocaleString() || 0} ${record.currency || ''}`,
        },
        {
            title: 'Betting Time',
            dataIndex: 'createdAt',
            key: 'createdAt',
            align: 'center',
            width: 180,
            render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: 'Winning Amount',
            dataIndex: 'winAmount',
            key: 'winAmount',
            align: 'right',
            width: 130,
            render: (amount, record) => amount ? `${amount.toLocaleString()} ${record.currency || ''}` : '-',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            width: 100,
            render: (status) => {
                if (status === 'Won') {
                    return <Tag color="green">Won</Tag>;
                } else if (status === 'Lost') {
                    return <Tag color="red">Lost</Tag>;
                } else {
                    return <Tag color="default">Pending</Tag>;
                }
            },
        },
        {
            title: 'Game Type',
            key: 'type',
            align: 'center',
            width: 100,
            render: (v, record) => (
                GAME_TYPE[record.type] || '-'
            ),
        },
    ];

    useEffect(() => {
        fetchBettingHistory();
    }, []);

    return (
        <div className="p-4">
            <Title level={2}>Lottery Betting History</Title>
            <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space wrap>
                        <div className="flex items-center gap-2">
                            <label>Username:</label>
                            <Input
                                placeholder="Filter by username"
                                value={historyFilters.username}
                                onChange={(e) => setHistoryFilters(prev => ({ ...prev, username: e.target.value }))}
                                style={{ width: 200 }}
                                allowClear
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label>Issue Number:</label>
                            <Input
                                placeholder="Filter by issue number"
                                value={historyFilters.issueNumber}
                                onChange={(e) => setHistoryFilters(prev => ({ ...prev, issueNumber: e.target.value }))}
                                style={{ width: 150 }}
                                allowClear
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label>Date Range:</label>
                            <RangePicker
                                value={historyFilters.dateRange}
                                onChange={(dates) => setHistoryFilters(prev => ({ ...prev, dateRange: dates }))}
                                format="YYYY-MM-DD"
                                allowClear
                            />
                        </div>
                        <Button
                            type="primary"
                            onClick={() => fetchBettingHistory(1, historyPagination.pageSize)}
                        >
                            Search
                        </Button>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleDownloadHistory}
                            loading={historyLoading}
                        >
                            Download
                        </Button>
                    </Space>
                    <Table
                        columns={historyColumns}
                        dataSource={bettingHistory}
                        rowKey="_id"
                        loading={historyLoading}
                        pagination={historyPagination}
                        onChange={(pagination) => {
                            fetchBettingHistory(pagination.current, pagination.pageSize);
                        }}
                        scroll={{ x: 1400 }}
                    />
                </Space>
            </Card>
        </div>
    );
};

export default LotteryBettingHistory;

