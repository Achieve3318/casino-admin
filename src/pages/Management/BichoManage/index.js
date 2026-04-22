import React, { useState, useEffect } from 'react';
import { Table, Input, Button, DatePicker, Card, Space, Typography, Divider, Alert, Popconfirm, Select } from 'antd';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { success, error, warning } from '../../../utility/notification';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SUB_SITE } from '../../../utility';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

// Game types for Bicho
const GAME_TYPES = [
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

// Draw times for each game type (simplified - you may need to adjust based on actual draw times)
const DRAW_TIMES = {
    'rio_janeiro': [
        { id: 'rj_09h20', name: 'RJ 09h20', hour: 9, minute: 20 },
        { id: 'rj_11h20', name: 'RJ 11h20', hour: 11, minute: 20 },
        { id: 'rj_14h20', name: 'RJ 14h20', hour: 14, minute: 20 },
        { id: 'rj_16h20', name: 'RJ 16h20', hour: 16, minute: 20 },
        { id: 'rj_21h20', name: 'RJ 21h20', hour: 21, minute: 20 },
        { id: 'federal_20h', name: 'FEDERAL 20h', hour: 20, minute: 0 }
    ],
    'ponto_bicho': [
        { id: 'ponto_02h', name: 'PONTO 02h', hour: 2, minute: 0 },
        { id: 'ponto_05h', name: 'PONTO 05h', hour: 5, minute: 0 },
        { id: 'ponto_09h', name: 'PONTO 09h', hour: 9, minute: 0 },
        { id: 'ponto_12h', name: 'PONTO 12h', hour: 12, minute: 0 },
        { id: 'ponto_15h', name: 'PONTO 15h', hour: 15, minute: 0 },
        { id: 'ponto_18h', name: 'PONTO 18h', hour: 18, minute: 0 },
        { id: 'ponto_22h', name: 'PONTO 22h', hour: 22, minute: 0 }
    ]
    // Add more game types as needed
};

const BichoManage = () => {
    const { logout, sitemode } = useAuth();
    const [todayResults, setTodayResults] = useState([]);
    const [lastDaysResults, setLastDaysResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs().tz('America/Sao_Paulo'));
    const [selectedGameType, setSelectedGameType] = useState('rio_janeiro');
    const [inputResults, setInputResults] = useState({});

    // Get API URL from environment
    const API_URL = SUB_SITE[sitemode] + "/api";

    useEffect(() => {
        fetchTodayResults();
        fetchLastDaysResults();
    }, []);

    useEffect(() => {
        if (selectedDate && selectedGameType) {
            fetchResultsByDate(selectedDate, selectedGameType);
        }
    }, [selectedDate, selectedGameType]);

    const fetchTodayResults = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/bicho/results/today`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                setTodayResults(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching today results:', err);
            error('Failed to fetch today\'s results');
        } finally {
            setLoading(false);
        }
    };

    const fetchLastDaysResults = async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/bicho/results/last-days?days=3`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                setLastDaysResults(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching last days results:', err);
            error('Failed to fetch last days results');
        }
    };

    const fetchResultsByDate = async (date, gameType) => {
        try {
            setLoading(true);
            const dateStr = dayjs(date).tz('America/Sao_Paulo').format('YYYY-MM-DD');
            const response = await axios.get(`${API_URL}/admin/bicho/results/date?date=${dateStr}&gameType=${gameType}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                // Pre-fill existing results in input fields
                const existingResults = {};
                response.data.data.forEach(result => {
                    const time = dayjs(result.time).tz('America/Sao_Paulo');
                    const timeKey = `${result.drawTimeId}_${result.gameType}`;
                    let resultStr = result.prizes.join(',');
                    // Append 6th and 7th if they exist
                    if (result.prize6th !== null && result.prize6th !== undefined) {
                        resultStr += `,${result.prize6th.toString().padStart(4, '0')}`;
                    }
                    if (result.prize7th !== null && result.prize7th !== undefined) {
                        resultStr += `,${result.prize7th.toString().padStart(3, '0')}`;
                    }
                    existingResults[timeKey] = resultStr;
                });
                setInputResults(prev => ({ ...prev, ...existingResults }));
            } else {
                // Clear input fields if no results found
                const drawTimes = DRAW_TIMES[gameType] || [];
                const clearedResults = {};
                drawTimes.forEach(dt => {
                    clearedResults[`${dt.id}_${gameType}`] = '';
                });
                setInputResults(prev => ({ ...prev, ...clearedResults }));
            }
        } catch (err) {
            console.error('Error fetching results by date:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (drawTimeId, value) => {
        // Format: "1234,5678,9012,3456,7890" (5 prizes, each 4 digits)
        // Or with 6th and 7th: "1234,5678,9012,3456,7890,1234,123" (5 prizes + 6th 4-digit + 7th 3-digit)
        const key = `${drawTimeId}_${selectedGameType}`;
        // Only allow digits and commas
        if (/^[\d,]*$/.test(value)) {
            setInputResults(prev => ({
                ...prev,
                [key]: value
            }));
        }
    };

    const handleSetResult = async (drawTime) => {
        const key = `${drawTime.id}_${selectedGameType}`;
        const value = inputResults[key] || '';
        
        // Parse prizes: split by comma and validate
        const prizes = value.split(',').map(p => p.trim()).filter(p => p);
        
        if (prizes.length !== 5 && prizes.length !== 7) {
            warning('Please enter exactly 5 prizes (4-digit numbers), or 5 prizes + 6th (4-digit) + 7th (3-digit) separated by commas');
            return;
        }
        
        // Validate first 5 prizes are 4 digits
        const first5 = prizes.slice(0, 5);
        if (first5.some(p => p.length !== 4 || !/^\d{4}$/.test(p))) {
            warning('Each of the first 5 prizes must be exactly 4 digits (0000-9999)');
            return;
        }
        
        const prizeNumbers = first5.map(p => parseInt(p, 10));
        
        // If 6th and 7th are provided, validate them
        let prize6th = null;
        let prize7th = null;
        if (prizes.length === 7) {
            // Validate 6th prize (4 digits)
            if (prizes[5].length !== 4 || !/^\d{4}$/.test(prizes[5])) {
                warning('6th prize must be exactly 4 digits (0000-9999)');
                return;
            }
            // Validate 7th prize (3 digits)
            if (prizes[6].length !== 3 || !/^\d{3}$/.test(prizes[6])) {
                warning('7th prize must be exactly 3 digits (000-999)');
                return;
            }
            prize6th = parseInt(prizes[5], 10);
            prize7th = parseInt(prizes[6], 10);
        }
        
        try {
            setLoading(true);
            
            // Create the date in Brazil timezone
            const lotteryTime = dayjs.tz(selectedDate.format('YYYY-MM-DD'), 'America/Sao_Paulo')
                .hour(drawTime.hour)
                .minute(drawTime.minute)
                .second(0)
                .millisecond(0);
            
            // Check if draw time has passed
            const now = dayjs().tz('America/Sao_Paulo');
            if (lotteryTime.isAfter(now)) {
                warning(`Cannot set result before draw time. Draw time is at ${lotteryTime.format('h:mm A')}, current time is ${now.format('h:mm A')}`);
                setLoading(false);
                return;
            }
            
            await axios.post(`${API_URL}/admin/bicho/results/set`,
                {
                    prizes: prizeNumbers,
                    prize6th: prize6th,
                    prize7th: prize7th,
                    time: lotteryTime.toISOString(),
                    gameType: selectedGameType,
                    drawTimeId: drawTime.id
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            success('Result set successfully');
            fetchTodayResults();
            fetchLastDaysResults();
            fetchResultsByDate(selectedDate, selectedGameType);
        } catch (err) {
            console.error('Error setting result:', err);
            error(err.response?.data?.message || 'Failed to set result');
        } finally {
            setLoading(false);
        }
    };

    const canSetTime = (drawTime) => {
        const lotteryTime = dayjs.tz(selectedDate.format('YYYY-MM-DD'), 'America/Sao_Paulo')
            .hour(drawTime.hour)
            .minute(drawTime.minute)
            .second(0);
        const now = dayjs().tz('America/Sao_Paulo');
        return !lotteryTime.isAfter(now);
    };

    const handleDeleteResult = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`${API_URL}/admin/bicho/results/delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            success('Bicho result deleted successfully');
            fetchTodayResults();
            fetchLastDaysResults();
        } catch (err) {
            console.error('Error deleting bicho result:', err);
            error(err.response?.data?.message || 'Failed to delete result');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Bicho ID',
            dataIndex: 'bichoId',
            key: 'bichoId',
            align: 'center',
            width: '10%',
            render: (text) => <Text strong>{text || 'N/A'}</Text>
        },
        {
            title: 'Game Type',
            dataIndex: 'gameType',
            key: 'gameType',
            align: 'center',
            width: '15%',
        },
        {
            title: 'Draw Time',
            dataIndex: 'drawTimeId',
            key: 'drawTimeId',
            align: 'center',
            width: '15%',
        },
        {
            title: 'Date',
            dataIndex: 'time',
            key: 'date',
            align: 'center',
            width: '15%',
            render: (time) => dayjs(time).tz('America/Sao_Paulo').format('DD/MM/YYYY')
        },
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            align: 'center',
            width: '15%',
            render: (time) => dayjs(time).tz('America/Sao_Paulo').format('h:mm A')
        },
        {
            title: 'Prizes',
            dataIndex: 'prizes',
            key: 'prizes',
            align: 'center',
            width: '25%',
            render: (prizes, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {prizes && prizes.map((prize, idx) => (
                        <Text key={idx} strong style={{ fontSize: '16px', color: '#fbbf24', fontFamily: 'monospace' }}>
                            {idx + 1}º: {String(prize).padStart(4, '0')}
                        </Text>
                    ))}
                    {record.prize6th !== null && record.prize6th !== undefined && (
                        <Text strong style={{ fontSize: '16px', color: '#10b981', fontFamily: 'monospace' }}>
                            6º: {String(record.prize6th).padStart(4, '0')}
                        </Text>
                    )}
                    {record.prize7th !== null && record.prize7th !== undefined && (
                        <Text strong style={{ fontSize: '16px', color: '#3b82f6', fontFamily: 'monospace' }}>
                            7º: {String(record.prize7th).padStart(3, '0')}
                        </Text>
                    )}
                </div>
            )
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            width: '10%',
            render: (_, record) => (
                <Popconfirm
                    title="Delete this result?"
                    description="Are you sure you want to delete this draw result?"
                    onConfirm={() => handleDeleteResult(record._id)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                >
                    <Button type="primary" danger size="small">
                        Delete
                    </Button>
                </Popconfirm>
            )
        }
    ];

    const drawTimes = DRAW_TIMES[selectedGameType] || [];

    return (
        <div className="p-4">
            <Title level={2}>Bicho Results Management</Title>

            {/* Results Input Section */}
            <Card title="Set Bicho Results" className="mb-4">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div className='flex gap-4 items-center flex-wrap'>
                        <div className='flex gap-1 items-center'>
                            <Text>Date: </Text>
                            <DatePicker
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date ? dayjs(date).tz('America/Sao_Paulo') : dayjs().tz('America/Sao_Paulo'))}
                                format="YYYY-MM-DD"
                                style={{ marginLeft: 8 }}
                            />
                        </div>
                        <div className='flex gap-1 items-center'>
                            <Text>Game Type: </Text>
                            <Select
                                value={selectedGameType}
                                onChange={setSelectedGameType}
                                style={{ width: 200, marginLeft: 8 }}
                                options={GAME_TYPES}
                            />
                        </div>
                        <p className='text-sm text-red-500 font-bold'>Note: You cannot set results before the draw time.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {drawTimes.map((drawTime) => {
                            const isDrawTimePassed = canSetTime(drawTime);
                            const key = `${drawTime.id}_${selectedGameType}`;
                            const value = inputResults[key] || '';
                            
                            return (
                                <Card
                                    key={drawTime.id}
                                    size="small"
                                    title={
                                        <span>
                                            {drawTime.name}
                                            {!isDrawTimePassed && <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>(Not yet)</Text>}
                                        </span>
                                    }
                                >
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Input
                                            value={value}
                                            onChange={(e) => handleInputChange(drawTime.id, e.target.value)}
                                            placeholder="1234,5678,9012,3456,7890,1234,123"
                                            style={{
                                                fontSize: '14px',
                                                fontFamily: 'monospace'
                                            }}
                                            disabled={loading || !isDrawTimePassed}
                                        />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            5 prizes (4 digits each), optionally + 6th (4 digits) + 7th (3 digits), separated by commas
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: '11px', color: '#888' }}>
                                            Example: 1234,5678,9012,3456,7890,1234,123 (6th and 7th will be auto-calculated if not provided)
                                        </Text>
                                        <Button
                                            type="primary"
                                            onClick={() => handleSetResult(drawTime)}
                                            disabled={loading || !value || (value.split(',').filter(p => p.trim()).length !== 5 && value.split(',').filter(p => p.trim()).length !== 7) || !isDrawTimePassed}
                                            loading={loading}
                                            title={!isDrawTimePassed ? 'Draw time has not passed yet' : ''}
                                            block
                                        >
                                            Set
                                        </Button>
                                    </Space>
                                </Card>
                            );
                        })}
                    </div>
                </Space>
            </Card>

            {/* Last 3 Days Results Display */}
            <Card title="Last 3 Days Results">
                <Table
                    columns={columns}
                    dataSource={lastDaysResults}
                    rowKey="_id"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 1200 }}
                />
            </Card>
        </div>
    );
};

export default BichoManage;

