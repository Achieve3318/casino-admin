import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Card, Space, Typography, Alert, Popconfirm } from 'antd';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { success, error } from '../../../utility/notification';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SUB_SITE } from '../../../utility';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

const Melate1MinManage = () => {
    const { logout, sitemode } = useAuth();
    const [recentResults, setRecentResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputResult, setInputResult] = useState('');

    const API_URL = SUB_SITE[sitemode] + "/api";

    useEffect(() => {
        fetchRecentResults();
    }, []);

    const fetchRecentResults = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/melate-1min/results/last-days?days=7`, {
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

    const formatMelate1MinResult = (result) => {
        if (!result || result.length < 12) return result;
        const numbers = [];
        // Handle both 12-digit (6 numbers) and 14-digit (7 numbers) formats
        const numCount = result.length === 14 ? 7 : 6;
        for (let i = 0; i < numCount; i++) {
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
            error('Please enter 14 digits (7 two-digit numbers from 01-56, including the 7th special ball)');
            return;
        }

        const numbers = [];
        for (let i = 0; i < 7; i++) {
            const num = parseInt(inputResult.substring(i * 2, (i + 1) * 2), 10);
            if (num < 1 || num > 56) {
                error(`Number ${num.toString().padStart(2, '0')} at position ${i + 1} is invalid. All numbers must be between 01-56.`);
                return;
            }
            numbers.push(num);
        }

        // Check that first 6 numbers are unique (7th special ball can be any number including duplicates)
        const first6 = numbers.slice(0, 6);
        if (new Set(first6).size !== 6) {
            error('First 6 numbers must be unique');
            return;
        }

        const resultString = numbers.map(n => n.toString().padStart(2, '0')).join('');

        try {
            setLoading(true);
            await axios.post(`${API_URL}/admin/melate-1min/results/set`,
                {
                    result: resultString
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            success('Melate 1min result set successfully and bets processed');
            setInputResult('');
            fetchRecentResults();
        } catch (err) {
            console.error('Error setting melate 1min result:', err);
            error(err.response?.data?.message || 'Failed to set result');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResult = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`${API_URL}/admin/melate-1min/results/delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            success('Melate 1min result deleted successfully');
            fetchRecentResults();
        } catch (err) {
            console.error('Error deleting melate 1min result:', err);
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
            title: 'Date & Time',
            dataIndex: 'time',
            key: 'time',
            align: 'center',
            width: '25%',
            render: (time) => dayjs(time).tz('America/Mexico_City').format('MMM DD, YYYY HH:mm:ss')
        },
        {
            title: 'Winning Numbers',
            dataIndex: 'result',
            key: 'result',
            align: 'center',
            width: '50%',
            render: (result) => {
                const numbers = formatMelate1MinResult(result).split(' ');
                // Display all 7 numbers (first 6 + 7th special ball)
                return (
                    <div className="flex justify-center gap-2 items-center">
                        {numbers.slice(0, 6).map((num, idx) => (
                            <div
                                key={idx}
                                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-400 via-red-500 to-red-700"
                            >
                                <Text strong style={{ fontSize: '18px', color: 'white' }}>
                                    {num}
                                </Text>
                            </div>
                        ))}
                        {numbers.length > 6 && (
                            <>
                                <Text style={{ fontSize: '16px', margin: '0 4px' }}>+</Text>
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700 border-2 border-yellow-300">
                                    <Text strong style={{ fontSize: '18px', color: 'white' }}>
                                        {numbers[6]}
                                    </Text>
                                </div>
                                <Text style={{ fontSize: '12px', marginLeft: '4px', color: '#666' }}>(Special)</Text>
                            </>
                        )}
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
            <Title level={2}>Melate 1min Results Management</Title>

            <Card title="Set Melate 1min Result" className="mb-4">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                        message="Melate 1min Draw Schedule"
                        description="Melate 1min draws occur every 1 minute, 365 days a year. Results are generated automatically, but you can manually set a result if needed."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <div>
                        <Text strong>Enter 7 numbers (01-56): </Text>
                        <Text type="secondary">Format: 01020304055607 (14 digits, 7 two-digit numbers including the 7th special ball)</Text>
                        <div className="mt-1">
                            <Text type="warning" style={{ fontSize: '12px' }}>
                                Note: First 6 numbers must be unique and between 01-56. The 7th number is the special ball and can be any number 01-56.
                            </Text>
                        </div>
                    </div>

                    <Space.Compact style={{ width: '100%', maxWidth: '600px' }}>
                        <Input
                            maxLength={20}
                            value={displayInput}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="01 02 03 04 05 56 07"
                            style={{
                                fontSize: '20px',
                                fontFamily: 'monospace',
                                textAlign: 'center',
                                letterSpacing: '2px'
                            }}
                            disabled={loading}
                        />
                        <Button
                            type="primary"
                            onClick={handleSetResult}
                            disabled={loading || !inputResult || inputResult.length !== 14}
                            loading={loading}
                        >
                            Set Result
                        </Button>
                    </Space.Compact>

                    {inputResult && inputResult.length === 14 && (
                        <div className="flex justify-center gap-2 mt-4 items-center">
                            {formatMelate1MinResult(inputResult).split(' ').slice(0, 6).map((num, idx) => {
                                const numValue = parseInt(num, 10);
                                const isValid = numValue >= 1 && numValue <= 56;
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
                            {formatMelate1MinResult(inputResult).split(' ').length > 6 && (
                                <>
                                    <Text style={{ fontSize: '16px', margin: '0 4px' }}>+</Text>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700 border-2 border-yellow-300">
                                        <Text strong style={{ fontSize: '18px', color: 'white' }}>
                                            {formatMelate1MinResult(inputResult).split(' ')[6]}
                                        </Text>
                                    </div>
                                    <Text style={{ fontSize: '12px', marginLeft: '4px', color: '#666' }}>(Special)</Text>
                                </>
                            )}
                        </div>
                    )}
                </Space>
            </Card>

            <Card title="Recent Melate 1min Results (Last 7 Days)">
                <Table
                    columns={columns}
                    dataSource={recentResults}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 20 }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </div>
    );
};

export default Melate1MinManage;

