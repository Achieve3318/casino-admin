import React, { useState, useEffect } from 'react';
import { Table, Input, Button, DatePicker, Card, Space, Typography, Tag, Select } from 'antd';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { success, error } from '../../../utility/notification';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SUB_SITE } from '../../../utility';
import { DownloadOutlined } from '@ant-design/icons';
import { dateFormat } from '../../../utility/date';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const GAME_TYPE = {
    'grupo': 'Group',
    'unidade': 'One number',
    'dezena': 'Two numbers',
    'centena': 'Three numbers',
    'milhar_invertida': 'Four numbers'
};

const GAME_TYPE_OPTIONS = [
    { value: 'rio_janeiro', label: 'Rio de Janeiro' },
    { value: 'ponto_bicho', label: 'Ponto do Bicho' },
    { value: 'sao_paulo', label: 'São Paulo' },
    { value: 'bahia', label: 'Bahia' },
    { value: 'paraiba', label: 'Paraíba' },
    { value: 'goias', label: 'Goiás' },
    { value: 'distrito_federal', label: 'Distrito Federal' },
    { value: 'minas_gerais', label: 'Minas Gerais' },
    { value: 'federal', label: 'Federal' }
];

const BichoBettingHistory = () => {
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
        gameType: '',
        dateRange: null,
    });

    // Format user's bet for display
    const formatUserBet = (bet, betType) => {
        if (!bet || !Array.isArray(bet) || bet.length === 0) {
            return '-';
        }

        if (betType === 'grupo') {
            // For grupo, show group IDs from selection.groupId
            const groupIds = bet.map(b => {
                if (b.selection && b.selection.groupId !== undefined) {
                    return b.selection.groupId;
                }
                // Fallback: check if groupId is directly on the bet entry
                return b.groupId;
            }).filter(id => id !== undefined && id !== null);
            return groupIds.length > 0 ? groupIds.join(', ') : '-';
        } else {
            // For other types, show numbers from selection.number
            const numbers = bet.map(b => {
                let number = null;
                if (b.selection && b.selection.number !== undefined) {
                    number = b.selection.number;
                } else if (b.number !== undefined) {
                    // Fallback: check if number is directly on the bet entry
                    number = b.number;
                }
                if (number !== null && number !== undefined) {
                    const padding = betType === 'unidade' ? 1 : betType === 'dezena' ? 2 : betType === 'centena' ? 3 : 4;
                    return number.toString().padStart(padding, '0');
                }
                return '';
            }).filter(n => n);
            return numbers.length > 0 ? numbers.join(', ') : '-';
        }
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

            if (historyFilters.gameType) {
                params.gameType = historyFilters.gameType;
            }

            if (historyFilters.dateRange && historyFilters.dateRange[0] && historyFilters.dateRange[1]) {
                params.startDate = historyFilters.dateRange[0].startOf('day').toISOString();
                params.endDate = historyFilters.dateRange[1].endOf('day').toISOString();
            }

            const response = await axios.get(`${API_URL}/admin/bicho/betting-history`, {
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

            if (historyFilters.gameType) {
                params.gameType = historyFilters.gameType;
            }

            if (historyFilters.dateRange && historyFilters.dateRange[0] && historyFilters.dateRange[1]) {
                params.startDate = historyFilters.dateRange[0].startOf('day').toISOString();
                params.endDate = historyFilters.dateRange[1].endOf('day').toISOString();
            }

            const response = await axios.get(`${API_URL}/admin/bicho/betting-history`, {
                params,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                const data = response.data.data;

                // Create CSV content
                const headers = ['Plan Number', 'Username', "User's Bet", 'Bicho ID', 'Winning Prizes', 'Betting Amount', 'Betting Time', 'Winning Amount', 'Status', 'Currency', 'Game Type', 'Bet Type'];
                const rows = data.map(item => [
                    item.planNumber || '',
                    item.username || '',
                    item.betDisplay || formatUserBet(item.bet, item.type),
                    item.bichoId || '',
                    item.winningPrizes ? item.winningPrizes.map(p => String(p).padStart(4, '0')).join(', ') : '',
                    item.betAmount || 0,
                    dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                    item.winAmount || 0,
                    item.status || '',
                    item.currency || '',
                    item.gameType || '',
                    item.type || '',
                ]);

                const csvContent = [
                    headers.join(','),
                    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');

                // Create and download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `bicho_betting_history_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`);
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
            title: 'Bicho ID',
            dataIndex: 'bichoId',
            key: 'bichoId',
            align: 'center',
            width: 100,
            render: (text) => text || '-',
        },
        {
            title: "User's Bet",
            dataIndex: 'betDisplay',
            key: 'userBet',
            align: 'center',
            width: 200,
            render: (betDisplay, record) => (
                <Text strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                    {betDisplay || formatUserBet(record.bet, record.type)}
                </Text>
            ),
        },
        {
            title: 'Winning Prizes',
            dataIndex: 'winningPrizes',
            key: 'winningPrizes',
            align: 'center',
            width: 250,
            render: (prizes) => prizes ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {prizes.map((prize, idx) => (
                        <Text key={idx} strong style={{ fontSize: '14px', color: '#fbbf24', fontFamily: 'monospace' }}>
                            {String(prize).padStart(4, '0')}
                        </Text>
                    ))}
                </div>
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
            render: (time) => dateFormat(time, sitemode),
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
            dataIndex: 'gameType',
            key: 'gameType',
            align: 'center',
            width: 120,
        },
        {
            title: 'Bet Type',
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
            <Title level={2}>Bicho Betting History</Title>
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
                            <label>Game Type:</label>
                            <Select
                                placeholder="Filter by game type"
                                value={historyFilters.gameType}
                                onChange={(value) => setHistoryFilters(prev => ({ ...prev, gameType: value }))}
                                style={{ width: 200 }}
                                allowClear
                                options={GAME_TYPE_OPTIONS}
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
                        scroll={{ x: 1600 }}
                    />
                </Space>
            </Card>
        </div>
    );
};

export default BichoBettingHistory;

