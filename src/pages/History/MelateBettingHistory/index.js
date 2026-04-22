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

const MelateBettingHistory = () => {
    const { logout, sitemode } = useAuth();
    const API_URL = SUB_SITE[sitemode] + "/api";

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
        dateRange: null,
    });

    // Format melate bet for display
    const formatMelateBet = (bet) => {
        if (!bet || !Array.isArray(bet) || bet.length === 0) {
            return '-';
        }

        const betData = bet[0];
        const parts = [];

        // Number selection
        if (betData.numberSelection && betData.numberSelection.numbers) {
            const { gameType, numbers } = betData.numberSelection;
            const gameTypeLabel = {
                '2-balls': '2 Balls',
                '3-balls': '3 Balls',
                '4-balls': '4 Balls'
            }[gameType] || gameType;
            parts.push(`${gameTypeLabel}: [${numbers.sort((a, b) => a - b).join(', ')}]`);
        }

        // Sum bets
        if (betData.sumBets && Array.isArray(betData.sumBets) && betData.sumBets.length > 0) {
            parts.push(`Sum Bets: [${betData.sumBets.join(', ')}]`);
        }

        return parts.length > 0 ? parts.join(' | ') : '-';
    };

    // Format melate result for display
    const formatMelateResult = (result) => {
        if (!result || !Array.isArray(result)) return '-';
        // Result is array of digits, but melate result is 14 digits (7 two-digit numbers)
        // We need to reconstruct it
        if (result.length === 14) {
            const numbers = [];
            for (let i = 0; i < 7; i++) {
                numbers.push(`${result[i * 2]}${result[i * 2 + 1]}`);
            }
            return numbers;
        }
        // If it's already formatted as string, split it
        if (typeof result === 'string' && result.length === 14) {
            const numbers = [];
            for (let i = 0; i < 7; i++) {
                numbers.push(result.substring(i * 2, (i + 1) * 2));
            }
            return numbers;
        }
        return result;
    };

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

            if (historyFilters.dateRange && historyFilters.dateRange[0] && historyFilters.dateRange[1]) {
                params.startDate = dayjs(historyFilters.dateRange[0]).format('YYYY-MM-DD');
                params.endDate = dayjs(historyFilters.dateRange[1]).format('YYYY-MM-DD');
            }

            const response = await axios.get(`${API_URL}/admin/melate/betting-history`, {
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
            console.error('Error fetching melate betting history:', err);
            error('Failed to fetch betting history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleDownloadHistory = async () => {
        try {
            setHistoryLoading(true);
            const params = {
                limit: 10000,
                offset: 0,
            };

            if (historyFilters.username) {
                params.username = historyFilters.username;
            }

            if (historyFilters.currency) {
                params.currency = historyFilters.currency;
            }

            if (historyFilters.dateRange && historyFilters.dateRange[0] && historyFilters.dateRange[1]) {
                params.startDate = dayjs(historyFilters.dateRange[0]).format('YYYY-MM-DD');
                params.endDate = dayjs(historyFilters.dateRange[1]).format('YYYY-MM-DD');
            }

            const response = await axios.get(`${API_URL}/admin/melate/betting-history`, {
                params,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                const data = response.data.data;

                const headers = ['Plan Number', 'Username', "User's Bet", 'Betting Amount', 'Betting Time', 'Winning Numbers', 'Winning Amount', 'Status', 'Currency'];
                const rows = data.map(item => [
                    item.planNumber || '',
                    item.username || '',
                    formatMelateBet(item.bet),
                    item.betAmount || 0,
                    dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                    formatMelateResult(item.result),
                    item.winAmount || 0,
                    item.win ? 'Won' : (item.win === false ? 'Lost' : 'Pending'),
                    item.currency || '',
                ]);

                const csvContent = [
                    headers.join(','),
                    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `melate_betting_history_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`);
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

    const historyColumns = [
        {
            title: 'Plan Number',
            dataIndex: 'planNumber',
            key: 'planNumber',
            align: 'center',
            width: 120,
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            align: 'center',
            width: 150,
        },
        {
            title: "User's Bet",
            dataIndex: 'bet',
            key: 'userBet',
            align: 'left',
            width: 300,
            render: (bet) => (
                <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {formatMelateBet(bet)}
                </Text>
            ),
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
            title: 'Winning Numbers',
            dataIndex: 'result',
            key: 'result',
            align: 'center',
            width: 200,
            render: (result) => {
                if (!result) return '-';
                const numbers = Array.isArray(formatMelateResult(result)) 
                    ? formatMelateResult(result) 
                    : formatMelateResult(result).split(' ');
                return (
                    <div className="flex justify-center gap-1">
                        {numbers.map((num, idx) => {
                            const isSeventh = idx === 6; // 7th number (index 6) - not used for draw
                            return (
                                <div
                                    key={idx}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                                        isSeventh
                                            ? 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700'
                                            : 'bg-gradient-to-br from-red-400 via-red-500 to-red-700'
                                    }`}
                                    title={isSeventh ? '7th number (not used for draw)' : ''}
                                >
                                    <Text strong style={{ fontSize: '12px', color: 'white' }}>
                                        {num}
                                    </Text>
                                    {isSeventh && (
                                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-black" style={{ fontSize: '8px' }}>×</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            },
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
            dataIndex: 'win',
            key: 'status',
            align: 'center',
            width: 100,
            render: (win) => {
                if (win === true) {
                    return <Tag color="green">Won</Tag>;
                } else if (win === false) {
                    return <Tag color="red">Lost</Tag>;
                } else {
                    return <Tag color="default">Pending</Tag>;
                }
            },
        },
        {
            title: 'Currency',
            dataIndex: 'currency',
            key: 'currency',
            align: 'center',
            width: 100,
        },
    ];

    useEffect(() => {
        fetchBettingHistory();
    }, []);

    return (
        <div className="p-4">
            <Title level={2}>Melate Betting History</Title>
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
                            <label>Currency:</label>
                            <Input
                                placeholder="Filter by currency"
                                value={historyFilters.currency}
                                onChange={(e) => setHistoryFilters(prev => ({ ...prev, currency: e.target.value }))}
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

export default MelateBettingHistory;

