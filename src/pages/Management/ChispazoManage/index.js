import React, { useState, useEffect } from 'react';
import { Table, Input, Button, DatePicker, Card, Space, Typography, Alert, Select, Popconfirm } from 'antd';
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
const { Option } = Select;

const ChispazoManage = () => {
    const { logout, sitemode } = useAuth();
    const [recentResults, setRecentResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs().tz('America/Mexico_City'));
    const [inputResult, setInputResult] = useState('');
    const [inputIssueNumber, setInputIssueNumber] = useState('');
    const [selectedDrawType, setSelectedDrawType] = useState('clasico');

    const API_URL = SUB_SITE[sitemode] + "/api";

    useEffect(() => {
        fetchRecentResults();
    }, []);

    useEffect(() => {
        if (selectedDate) {
            fetchResultsByDate(selectedDate);
        }
    }, [selectedDate, selectedDrawType]);

    const fetchRecentResults = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/chispazo/results/last-days?days=7`, {
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
            const response = await axios.get(`${API_URL}/admin/chispazo/results/date?date=${dateStr}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data && response.data.data.length > 0) {
                // Filter by draw type
                const result = response.data.data.find(r => r.drawType === selectedDrawType);
                if (result) {
                    const formatted = formatChispazoResult(result.result);
                    setInputResult(formatted.replace(/\s/g, ''));
                } else {
                    setInputResult('');
                }
            } else {
                setInputResult('');
            }
        } catch (err) {
            console.error('Error fetching results by date:', err);
            setInputResult('');
        }
    };

    const formatChispazoResult = (result) => {
        if (!result || result.length !== 10) return result;
        const numbers = [];
        for (let i = 0; i < 5; i++) {
            numbers.push(result.substring(i * 2, (i + 1) * 2));
        }
        return numbers.join(' ');
    };

    const handleInputChange = (value) => {
        // Remove spaces and allow only digits, max 10 digits (5 two-digit numbers)
        const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
        if (cleaned.length <= 10) {
            setInputResult(cleaned);
        }
    };

    const handleSetResult = async () => {
        // Validate: must be 10 digits (5 two-digit numbers)
        if (!inputResult || inputResult.length !== 10) {
            warning('Please enter 10 digits (5 two-digit numbers from 01-28)');
            return;
        }

        // Validate issue number
        const issueNumberInt = parseInt(inputIssueNumber, 10);
        if (!inputIssueNumber || isNaN(issueNumberInt) || issueNumberInt <= 0) {
            warning('Please enter a valid issue number (positive integer).');
            return;
        }

        // Validate each number is between 01-28
        const numbers = [];
        for (let i = 0; i < 5; i++) {
            const num = parseInt(inputResult.substring(i * 2, (i + 1) * 2), 10);
            if (num < 1 || num > 28) {
                warning(`Number ${num} at position ${i + 1} is invalid. All numbers must be between 01-28.`);
                return;
            }
            numbers.push(num);
        }

        try {
            setLoading(true);
            // Create draw time based on draw type
            const drawHour = selectedDrawType === 'clasico' ? 21 : 15;
            const drawTime = dayjs.tz(selectedDate.format('YYYY-MM-DD'), 'America/Mexico_City')
                .hour(drawHour)
                .minute(0)
                .second(0)
                .millisecond(0);

            // Check if draw time has passed
            const now = dayjs().tz('America/Mexico_City');
            if (drawTime.isAfter(now)) {
                warning(`Cannot set result before draw time. Draw time is at ${drawTime.format('h:mm A')}, current time is ${now.format('h:mm A')}`);
                setLoading(false);
                return;
            }

            await axios.post(`${API_URL}/admin/chispazo/results/set`,
                {
                    result: inputResult,
                    time: drawTime.toISOString(),
                    issueNumber: issueNumberInt,
                    drawType: selectedDrawType
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            success('Chispazo result set successfully and bets processed');
            setInputResult('');
            setInputIssueNumber('');
            fetchRecentResults();
        } catch (err) {
            console.error('Error setting chispazo result:', err);
            error(err.response?.data?.message || 'Failed to set result');
        } finally {
            setLoading(false);
        }
    };

    const canSetResult = () => {
        const drawHour = selectedDrawType === 'clasico' ? 21 : 15;
        const drawTime = dayjs.tz(selectedDate.format('YYYY-MM-DD'), 'America/Mexico_City')
            .hour(drawHour)
            .minute(0)
            .second(0);
        const now = dayjs().tz('America/Mexico_City');
        
        return !drawTime.isAfter(now);
    };

    const handleDeleteResult = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`${API_URL}/admin/chispazo/results/delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            success('Chispazo result deleted successfully');
            fetchRecentResults();
        } catch (err) {
            console.error('Error deleting chispazo result:', err);
            error(err.response?.data?.message || 'Failed to delete result');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Draw Type',
            dataIndex: 'drawType',
            key: 'drawType',
            align: 'center',
            width: '15%',
            render: (type) => (
                <Text strong>
                    {type === 'clasico' ? 'Clásico (21:00)' : 'De Las Tres (15:00)'}
                </Text>
            )
        },
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
            width: '30%',
            render: (result) => {
                const numbers = formatChispazoResult(result).split(' ');
                return (
                    <div className="flex justify-center gap-2">
                        {numbers.map((num, idx) => (
                            <div
                                key={idx}
                                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-400 via-red-500 to-red-700"
                            >
                                <Text strong style={{ fontSize: '18px', color: 'white' }}>
                                    {num}
                                </Text>
                            </div>
                        ))}
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

    // Format input for display (add spaces)
    const displayInput = inputResult.replace(/(\d{2})(?=\d)/g, '$1 ');

    return (
        <div className="p-4">
            <Title level={2}>Chispazo Results Management</Title>

            {/* Set Result Section */}
            <Card title="Set Chispazo Result" className="mb-4">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                        message="Chispazo Draw Schedule"
                        description="Chispazo Clásico draws are at 21:00 (9 PM) and Chispazo De Las Tres draws are at 15:00 (3 PM) Mexico time every day. You can only set results after the draw time has passed."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <div className='flex gap-4 items-center'>
                        <div className='flex gap-1 items-center'>
                            <Text>Draw Type: </Text>
                            <Select
                                value={selectedDrawType}
                                onChange={(value) => {
                                    setSelectedDrawType(value);
                                    setInputResult('');
                                    setInputIssueNumber('');
                                }}
                                style={{ width: 200, marginLeft: 8 }}
                            >
                                <Option value="clasico">Clásico (21:00)</Option>
                                <Option value="de-las-tres">De Las Tres (15:00)</Option>
                            </Select>
                        </div>
                        <div className='flex gap-1 items-center'>
                            <Text>Draw Date: </Text>
                            <DatePicker
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date ? dayjs(date).tz('America/Mexico_City') : dayjs().tz('America/Mexico_City'))}
                                format="YYYY-MM-DD"
                                style={{ marginLeft: 8 }}
                            />
                        </div>
                        <Text type="secondary">
                            Draw Time: {selectedDrawType === 'clasico' ? '21:00 (9 PM)' : '15:00 (3 PM)'} Mexico Time
                        </Text>
                        {!canSetResult() && (
                            <Text type="danger">
                                Draw time has not passed yet
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
                        <Text strong>Enter 5 numbers (01-28): </Text>
                        <Text type="secondary">Format: 0105123456 (10 digits, 5 two-digit numbers)</Text>
                    </div>

                    <Space.Compact style={{ width: '100%', maxWidth: '600px' }}>
                        <Input
                            maxLength={14} // 10 digits + 4 spaces
                            value={displayInput}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="01 05 12 34 56"
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
                            disabled={loading || !inputResult || inputResult.length !== 10 || !canSetResult()}
                            loading={loading}
                            title={!canSetResult() ? 'Cannot set result before draw time' : ''}
                        >
                            Set Result
                        </Button>
                    </Space.Compact>

                    {inputResult && inputResult.length === 10 && (
                        <div className="flex justify-center gap-2 mt-4">
                            {formatChispazoResult(inputResult).split(' ').map((num, idx) => {
                                const numValue = parseInt(num, 10);
                                const isValid = numValue >= 1 && numValue <= 28;
                                return (
                                    <div
                                        key={idx}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            isValid
                                                ? 'bg-gradient-to-br from-green-400 via-green-500 to-green-700'
                                                : 'bg-gradient-to-br from-red-400 via-red-500 to-red-700'
                                        }`}
                                    >
                                        <Text strong style={{ fontSize: '18px', color: 'white' }}>
                                            {num}
                                        </Text>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Space>
            </Card>

            {/* Recent Results Display */}
            <Card title="Recent Chispazo Results (Last 7 Days)">
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

export default ChispazoManage;

