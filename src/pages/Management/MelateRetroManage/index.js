import React, { useState, useEffect } from 'react';
import { Table, Input, Button, DatePicker, Card, Space, Typography, Alert, Popconfirm } from 'antd';
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

const MelateRetroManage = () => {
    const { logout, sitemode } = useAuth();
    const [recentResults, setRecentResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs().tz('America/Mexico_City'));
    const [inputResult, setInputResult] = useState('');
    const [inputIssueNumber, setInputIssueNumber] = useState('');

    const API_URL = SUB_SITE[sitemode] + "/api";

    // Draw days: Tuesday (2), Saturday (6)
    const getNextDrawDate = (date) => {
        const currentDay = date.day();
        const drawDays = [2, 6]; // Tuesday, Saturday
        
        if (drawDays.includes(currentDay) && date.hour() < 21) {
            return date.hour(21).minute(0).second(0).millisecond(0);
        }
        
        let daysToAdd = 0;
        for (let i = 1; i <= 7; i++) {
            const checkDay = (currentDay + i) % 7;
            if (drawDays.includes(checkDay)) {
                daysToAdd = i;
                break;
            }
        }
        
        return date.add(daysToAdd, 'days').hour(21).minute(0).second(0).millisecond(0);
    };

    useEffect(() => {
        fetchRecentResults();
    }, []);

    useEffect(() => {
        if (selectedDate) {
            fetchResultsByDate(selectedDate);
        }
    }, [selectedDate]);

    const fetchRecentResults = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/melate-retro/results/last-days?days=7`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                setRecentResults(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching recent results:', err);
            error('Failed to fetch recent results');
        } finally {
            setLoading(false);
        }
    };

    const fetchResultsByDate = async (date) => {
        try {
            const dateStr = dayjs(date).tz('America/Mexico_City').format('YYYY-MM-DD');
            const response = await axios.get(`${API_URL}/admin/melate-retro/results/date?date=${dateStr}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data && response.data.data.length > 0) {
                const result = response.data.data[0];
                const formatted = formatMelateRetroResult(result.result);
                setInputResult(formatted.replace(/\s/g, ''));
            } else {
                setInputResult('');
            }
        } catch (err) {
            console.error('Error fetching results by date:', err);
            setInputResult('');
        }
    };

    const formatMelateRetroResult = (result) => {
        if (!result || result.length !== 14) return result;
        const numbers = [];
        for (let i = 0; i < 7; i++) {
            numbers.push(result.substring(i * 2, (i + 1) * 2));
        }
        return numbers.join(' ');
    };

    const handleInputChange = (value) => {
        const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
        if (cleaned.length <= 14) {
            setInputResult(cleaned);
        }
    };

    const handleSetResult = async () => {
        if (!inputResult || inputResult.length !== 14) {
            warning('Please enter 14 digits (7 two-digit numbers from 01-39)');
            return;
        }

        const issueNumberInt = parseInt(inputIssueNumber, 10);
        if (!inputIssueNumber || isNaN(issueNumberInt) || issueNumberInt <= 0) {
            warning('Please enter a valid issue number (positive integer).');
            return;
        }

        const numbers = [];
        for (let i = 0; i < 7; i++) {
            const num = parseInt(inputResult.substring(i * 2, (i + 1) * 2), 10);
            if (num < 1 || num > 39) {
                warning(`Number ${num} at position ${i + 1} is invalid. All numbers must be between 01-39.`);
                return;
            }
            numbers.push(num);
        }

        const selectedDay = selectedDate.day();
        const drawDays = [2, 6]; // Tuesday, Saturday
        
        if (!drawDays.includes(selectedDay)) {
            warning('Selected date is not a draw day. Melate Retro draws are on Tuesday and Saturday.');
            return;
        }

        try {
            setLoading(true);
            const drawTime = dayjs.tz(selectedDate.format('YYYY-MM-DD'), 'America/Mexico_City')
                .hour(21)
                .minute(0)
                .second(0)
                .millisecond(0);

            const now = dayjs().tz('America/Mexico_City');
            if (drawTime.isAfter(now)) {
                warning(`Cannot set result before draw time. Draw time is at ${drawTime.format('h:mm A')}, current time is ${now.format('h:mm A')}`);
                setLoading(false);
                return;
            }

            await axios.post(`${API_URL}/admin/melate-retro/results/set`,
                {
                    result: inputResult,
                    time: drawTime.toISOString(),
                    issueNumber: issueNumberInt
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            success('Melate Retro result set successfully and bets processed');
            setInputResult('');
            setInputIssueNumber('');
            fetchRecentResults();
        } catch (err) {
            console.error('Error setting melate retro result:', err);
            error(err.response?.data?.message || 'Failed to set result');
        } finally {
            setLoading(false);
        }
    };

    const canSetResult = () => {
        const selectedDay = selectedDate.day();
        const drawDays = [2, 6];
        
        if (!drawDays.includes(selectedDay)) {
            return false;
        }

        const drawTime = dayjs.tz(selectedDate.format('YYYY-MM-DD'), 'America/Mexico_City')
            .hour(21)
            .minute(0)
            .second(0);
        const now = dayjs().tz('America/Mexico_City');
        
        return !drawTime.isAfter(now);
    };

    const handleDeleteResult = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`${API_URL}/admin/melate-retro/results/delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            success('Melate Retro result deleted successfully');
            fetchRecentResults();
        } catch (err) {
            console.error('Error deleting melate retro result:', err);
            error(err.response?.data?.message || 'Failed to delete result');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Issue Number',
            dataIndex: 'issueNumber',
            key: 'issueNumber',
            align: 'center',
            width: '15%',
            render: (text) => <Text strong>{text || 'N/A'}</Text>
        },
        {
            title: 'Date',
            dataIndex: 'time',
            key: 'date',
            align: 'center',
            width: '20%',
            render: (time) => dayjs(time).tz('America/Mexico_City').format('ddd, MMM DD, YYYY')
        },
        {
            title: 'Draw Time',
            dataIndex: 'time',
            key: 'time',
            align: 'center',
            width: '15%',
            render: (time) => dayjs(time).tz('America/Mexico_City').format('h:mm A')
        },
        {
            title: 'Winning Numbers',
            dataIndex: 'result',
            key: 'result',
            align: 'center',
            width: '40%',
            render: (result) => {
                const numbers = formatMelateRetroResult(result).split(' ');
                return (
                    <div className="flex justify-center gap-2">
                        {numbers.map((num, idx) => {
                            const isSeventh = idx === 6;
                            return (
                                <div
                                    key={idx}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative ${
                                        isSeventh
                                            ? 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700'
                                            : 'bg-gradient-to-br from-red-400 via-red-500 to-red-700'
                                    }`}
                                    title={isSeventh ? '7th number (special ball)' : ''}
                                >
                                    <Text strong style={{ fontSize: '18px', color: 'white' }}>
                                        {num}
                                    </Text>
                                    {isSeventh && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                            <span className="text-xs">×</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            }
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

    const displayInput = inputResult.replace(/(\d{2})(?=\d)/g, '$1 ');

    return (
        <div className="p-4">
            <Title level={2}>Melate Retro Results Management</Title>

            <Card title="Set Melate Retro Result" className="mb-4">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                        message="Melate Retro Draw Schedule"
                        description="Melate Retro draws are on Tuesday and Saturday at 21:00 (9 PM) Mexico time. You can only set results after the draw time has passed."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <div className='flex gap-4 items-center'>
                        <div className='flex gap-1 items-center'>
                            <Text>Draw Date: </Text>
                            <DatePicker
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date ? dayjs(date).tz('America/Mexico_City') : dayjs().tz('America/Mexico_City'))}
                                format="YYYY-MM-DD"
                                style={{ marginLeft: 8 }}
                                disabledDate={(current) => {
                                    const day = current.day();
                                    return !([2, 6].includes(day));
                                }}
                            />
                        </div>
                        <Text type="secondary">
                            Draw Time: 21:00 (9 PM) Mexico Time
                        </Text>
                        {!canSetResult() && (
                            <Text type="danger">
                                {selectedDate.day() === 2 || selectedDate.day() === 6
                                    ? 'Draw time has not passed yet'
                                    : 'Selected date is not a draw day'}
                            </Text>
                        )}
                    </div>

                    <div>
                        <Text strong>Issue Number: </Text>
                        <div className="mt-1" style={{ maxWidth: 200 }}>
                            <Input
                                value={inputIssueNumber}
                                onChange={(e) => setInputIssueNumber(e.target.value.replace(/\D/g, ''))}
                                placeholder="e.g. 2024015"
                                disabled={loading || !canSetResult()}
                            />
                        </div>
                    </div>

                    <div>
                        <Text strong>Enter 7 numbers (01-39): </Text>
                        <Text type="secondary">Format: 01051234567890 (14 digits, 7 two-digit numbers)</Text>
                        <div className="mt-1">
                            <Text type="warning" style={{ fontSize: '12px' }}>
                                Note: First 6 numbers are used for draw evaluation. 7th number is special ball.
                            </Text>
                        </div>
                    </div>

                    <Space.Compact style={{ width: '100%', maxWidth: '600px' }}>
                        <Input
                            maxLength={20}
                            value={displayInput}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="01 05 12 34 56 78 90"
                            style={{
                                fontSize: '20px',
                                fontFamily: 'monospace',
                                textAlign: 'center',
                                letterSpacing: '2px'
                            }}
                            disabled={loading || !canSetResult()}
                        />
                        <Button
                            type="primary"
                            onClick={handleSetResult}
                            disabled={loading || !inputResult || inputResult.length !== 14 || !canSetResult()}
                            loading={loading}
                            title={!canSetResult() ? 'Cannot set result before draw time' : ''}
                        >
                            Set Result
                        </Button>
                    </Space.Compact>

                    {inputResult && inputResult.length === 14 && (
                        <div className="flex justify-center gap-2 mt-4">
                            {formatMelateRetroResult(inputResult).split(' ').map((num, idx) => {
                                const numValue = parseInt(num, 10);
                                const isValid = numValue >= 1 && numValue <= 39;
                                const isSeventh = idx === 6;
                                return (
                                    <div
                                        key={idx}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center relative ${
                                            isValid
                                                ? isSeventh
                                                    ? 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700'
                                                    : 'bg-gradient-to-br from-green-400 via-green-500 to-green-700'
                                                : 'bg-gradient-to-br from-red-400 via-red-500 to-red-700'
                                        }`}
                                        title={isSeventh ? '7th number (special ball)' : ''}
                                    >
                                        <Text strong style={{ fontSize: '18px', color: 'white' }}>
                                            {num}
                                        </Text>
                                        {isSeventh && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                                <span className="text-xs">×</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Space>
            </Card>

            <Card title="Recent Melate Retro Results (Last 7 Days)">
                <Table
                    columns={columns}
                    dataSource={recentResults}
                    rowKey="_id"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 800 }}
                />
            </Card>
        </div>
    );
};

export default MelateRetroManage;

