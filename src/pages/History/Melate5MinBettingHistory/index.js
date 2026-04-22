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

const Melate5MinBettingHistory = () => {
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

    // Format melate 5min bet for display
    const formatMelate5MinBet = (bet) => {
        if (!bet || !Array.isArray(bet) || bet.length === 0) {
            return '-';
        }

        const parts = [];
        bet.forEach(betData => {
            // Number selection
            if (betData.numberSelection && betData.numberSelection.numbers) {
                const { gameType, numbers } = betData.numberSelection;
                const gameTypeLabel = {
                    '2-balls': '2 Balls',
                    '3-balls': '3 Balls',
                    '4-balls': '4 Balls'
                }[gameType] || gameType;
                const numArray = Array.isArray(numbers[0]) ? numbers : [numbers];
                numArray.forEach(combo => {
                    parts.push(`${gameTypeLabel}: [${combo.sort((a, b) => a - b).join(', ')}]`);
                });
            }

            // Special bets
            if (betData.specialBets && Array.isArray(betData.specialBets) && betData.specialBets.length > 0) {
                parts.push(`Special: [${betData.specialBets.join(', ')}]`);
            }

            // Sum bets
            if (betData.sumBets && Array.isArray(betData.sumBets) && betData.sumBets.length > 0) {
                parts.push(`Sum Bets: [${betData.sumBets.join(', ')}]`);
            }
        });

        return parts.length > 0 ? parts.join(' | ') : '-';
    };

    // Format melate 5min result for display
    const formatMelate5MinResult = (result) => {
        if (!result) return '-';
        // Handle array format (7 numbers from backend)
        if (Array.isArray(result)) {
            // Return all 7 numbers
            return result.map(n => n.toString().padStart(2, '0'));
        }
        // Handle string format (14 digits = 7 two-digit numbers)
        if (typeof result === 'string' && result.length === 14) {
            const numbers = [];
            // Extract all 7 numbers
            for (let i = 0; i < 7; i++) {
                numbers.push(result.substring(i * 2, (i + 1) * 2));
            }
            return numbers;
        }
        // Handle legacy 18-digit format (6 three-digit numbers) for backward compatibility
        if (typeof result === 'string' && result.length === 18) {
            const numbers = [];
            for (let i = 0; i < 6; i++) {
                numbers.push(result.substring(i * 3, (i + 1) * 3));
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

            const response = await axios.get(`${API_URL}/admin/melate-5min/betting-history`, {
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
            console.error('Error fetching melate 5min betting history:', err);
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

            const response = await axios.get(`${API_URL}/admin/melate-5min/betting-history`, {
                params,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                const data = response.data.data;

                const headers = ['Issue Number', 'Username', "User's Bet", 'Betting Amount', 'Betting Time', 'Winning Numbers', 'Winning Amount', 'Status', 'Currency'];
                const rows = data.map(item => {
                    let numbers = [];
                    const formatted = formatMelate5MinResult(item.result);
                    if (Array.isArray(formatted)) {
                        numbers = formatted;
                    } else if (typeof formatted === 'string') {
                        numbers = formatted.split(' ');
                    }
                    // Format: first 6 numbers + 7th special ball (e.g., "01 02 03 04 05 56 + 07")
                    const winningNumbers = numbers.length >= 7 
                        ? `${numbers.slice(0, 6).join(' ')} + ${numbers[6]}`
                        : numbers.join(' ');
                    
                    return [
                        item.issueNumber || '',
                        item.username || '',
                        formatMelate5MinBet(item.bet),
                        item.betAmount || 0,
                        dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                        winningNumbers,
                        item.winAmount || 0,
                        item.win ? 'Won' : (item.win === false ? 'Lost' : 'Pending'),
                        item.currency || '',
                    ];
                });

                const csvContent = [
                    headers.join(','),
                    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `melate_5min_betting_history_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`);
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
            title: 'Issue Number',
            dataIndex: 'issueNumber',
            key: 'issueNumber',
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
                    {formatMelate5MinBet(bet)}
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
            width: 250,
            render: (result) => {
                if (!result) return '-';
                let numbers = [];
                const formatted = formatMelate5MinResult(result);
                if (Array.isArray(formatted)) {
                    numbers = formatted;
                } else if (typeof formatted === 'string') {
                    numbers = formatted.split(' ');
                } else {
                    numbers = [];
                }
                
                // Always show first 6 numbers
                const displayNumbers = numbers.slice(0, 6);
                // Always show 7th number if available (should always be available for new format)
                const specialBall = numbers.length >= 7 ? numbers[6] : null;
                
                return (
                    <div className="flex justify-center gap-1 items-center flex-wrap">
                        {displayNumbers.map((num, idx) => (
                            <div
                                key={idx}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-red-400 via-red-500 to-red-700"
                            >
                                <Text strong style={{ fontSize: '12px', color: 'white' }}>
                                    {num}
                                </Text>
                            </div>
                        ))}
                        {specialBall && (
                            <>
                                <Text style={{ fontSize: '10px', margin: '0 2px' }}>+</Text>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700 border border-yellow-300">
                                    <Text strong style={{ fontSize: '12px', color: 'white' }}>
                                        {specialBall}
                                    </Text>
                                </div>
                            </>
                        )}
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
            <Title level={2}>Melate 5min Betting History</Title>
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

export default Melate5MinBettingHistory;

