import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Card, Space, Typography, Alert, Popconfirm, Select, Row, Col, Tag } from 'antd';
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
const { Option } = Select;

const Melate5MinManage = () => {
    const { logout, sitemode } = useAuth();
    const [recentResults, setRecentResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputResult, setInputResult] = useState('');
    const [controlledQueue, setControlledQueue] = useState(Array(10).fill(null));
    const [controlledResult, setControlledResult] = useState(null);
    const [loadingControlled, setLoadingControlled] = useState(false);
    const [nextIssueNumber, setNextIssueNumber] = useState(null);

    const API_URL = SUB_SITE[sitemode] + "/api";

    const validBetConditions = [
        { value: null, label: 'Random', color: 'default' },
        { value: 'line-1', label: 'Row 1 (21-123)', color: 'blue' },
        { value: 'line-2', label: 'Row 2 (124-151)', color: 'cyan' },
        { value: 'line-3', label: 'Row 3 (152-191)', color: 'geekblue' },
        { value: 'line-4', label: 'Row 4 (192-219)', color: 'purple' },
        { value: 'line-5', label: 'Row 5 (220-321)', color: 'magenta' },
        { value: 'front-section', label: 'Front Section (21-155)', color: 'green' },
        { value: 'middle-section', label: 'Middle Section (156-187)', color: 'lime' },
        { value: 'back-section', label: 'Back Section (188-321)', color: 'orange' },
        { value: 'small', label: 'Small (21-171)', color: 'gold' },
        { value: 'big', label: 'Big (172-321)', color: 'volcano' },
        { value: 'odd', label: 'Odd', color: 'processing' },
        { value: 'even', label: 'Even', color: 'success' },
        { value: 'small-odd', label: 'Small Odd', color: 'warning' },
        { value: 'small-even', label: 'Small Even', color: 'default' },
        { value: 'big-odd', label: 'Big Odd', color: 'error' },
        { value: 'big-even', label: 'Big Even', color: 'purple' }
    ];

    useEffect(() => {
        fetchRecentResults();
        fetchControlledResult();
    }, []);

    const fetchRecentResults = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/melate-5min/results/last-days?days=7`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                setRecentResults(response.data.data);
            }

            // Also fetch today's results to get the most recent issue number
            try {
                const todayResponse = await axios.get(`${API_URL}/admin/melate-5min/results/today`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (todayResponse.data && todayResponse.data.data && todayResponse.data.data.length > 0) {
                    // Results are sorted by time descending, so first item is most recent
                    // But we should find the highest issue number to be safe
                    const allResults = todayResponse.data.data;
                    const resultsWithIssueNumbers = allResults.filter(r => r.issueNumber != null && r.issueNumber > 0);
                    if (resultsWithIssueNumbers.length > 0) {
                        // Sort by issue number descending to get the highest
                        const sortedByIssue = [...resultsWithIssueNumbers].sort((a, b) => (b.issueNumber || 0) - (a.issueNumber || 0));
                        const highestIssueResult = sortedByIssue[0];
                        if (highestIssueResult && highestIssueResult.issueNumber) {
                            setNextIssueNumber(highestIssueResult.issueNumber + 1);
                            return; // Exit early if we found a valid issue number
                        }
                    }
                }
            } catch (todayErr) {
                console.warn('Error fetching today\'s results for issue number:', todayErr);
            }

            // Fallback: Calculate from last-days results
            if (response.data && response.data.data && response.data.data.length > 0) {
                // Find the result with the highest issue number
                const resultsWithIssueNumbers = response.data.data.filter(r => r.issueNumber != null && r.issueNumber > 0);
                if (resultsWithIssueNumbers.length > 0) {
                    // Sort by issue number descending to get the highest
                    const sortedByIssue = [...resultsWithIssueNumbers].sort((a, b) => (b.issueNumber || 0) - (a.issueNumber || 0));
                    const highestIssueResult = sortedByIssue[0];
                    if (highestIssueResult && highestIssueResult.issueNumber) {
                        setNextIssueNumber(highestIssueResult.issueNumber + 1);
                    } else {
                        setNextIssueNumber(1);
                    }
                } else {
                    setNextIssueNumber(1);
                }
            } else {
                setNextIssueNumber(1);
            }
        } catch (err) {
            console.error('Error fetching recent results:', err);
            error('Failed to fetch recent results');
            // Set default issue number on error
            setNextIssueNumber(1);
        } finally {
            setLoading(false);
        }
    };

    const formatMelate5MinResult = (result) => {
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
            await axios.post(`${API_URL}/admin/melate-5min/results/set`,
                {
                    result: resultString
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            success('Melate 5min result set successfully and bets processed');
            setInputResult('');
            fetchRecentResults();
        } catch (err) {
            console.error('Error setting melate 5min result:', err);
            error(err.response?.data?.message || 'Failed to set result');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResult = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`${API_URL}/admin/melate-5min/results/delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            success('Melate 5min result deleted successfully');
            fetchRecentResults();
        } catch (err) {
            console.error('Error deleting melate 5min result:', err);
            error(err.response?.data?.message || 'Failed to delete result');
        } finally {
            setLoading(false);
        }
    };

    const fetchControlledResult = async () => {
        try {
            setLoadingControlled(true);
            const response = await axios.get(`${API_URL}/admin/melate-5min/controlled-result/current`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                setControlledResult(response.data.data);
                // Pad queue to 10 items with null
                const queue = response.data.data.betConditionsQueue || [];
                const paddedQueue = [...queue];
                while (paddedQueue.length < 10) {
                    paddedQueue.push(null);
                }
                setControlledQueue(paddedQueue.slice(0, 10));
            } else {
                setControlledResult(null);
                setControlledQueue(Array(10).fill(null));
            }
        } catch (err) {
            console.error('Error fetching controlled result:', err);
            if (err.response?.status !== 404) {
                error('Failed to fetch controlled result');
            }
            setControlledResult(null);
            setControlledQueue(Array(10).fill(null));
        } finally {
            setLoadingControlled(false);
        }
    };

    const handleQueueChange = (index, value) => {
        const newQueue = [...controlledQueue];
        newQueue[index] = value === 'null' || value === null || value === '' ? null : value;
        setControlledQueue(newQueue);
    };

    const handleSetControlledResult = async () => {
        try {
            setLoadingControlled(true);
            // Remove trailing nulls to keep only meaningful queue
            const trimmedQueue = [...controlledQueue];
            while (trimmedQueue.length > 0 && trimmedQueue[trimmedQueue.length - 1] === null) {
                trimmedQueue.pop();
            }
            
            if (trimmedQueue.length === 0) {
                error('Please set at least one bet condition');
                return;
            }

            await axios.post(
                `${API_URL}/admin/melate-5min/controlled-result/set`,
                {
                    betConditionsQueue: trimmedQueue
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            success('Controlled bet conditions set successfully');
            fetchControlledResult();
            fetchRecentResults(); // Refresh to get updated issue numbers
        } catch (err) {
            console.error('Error setting controlled result:', err);
            error(err.response?.data?.message || 'Failed to set controlled result');
        } finally {
            setLoadingControlled(false);
        }
    };

    const handleClearControlledResult = async () => {
        try {
            setLoadingControlled(true);
            await axios.delete(`${API_URL}/admin/melate-5min/controlled-result/clear`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            success('Controlled bet conditions cleared successfully');
            setControlledResult(null);
            setControlledQueue(Array(10).fill(null));
        } catch (err) {
            console.error('Error clearing controlled result:', err);
            error(err.response?.data?.message || 'Failed to clear controlled result');
        } finally {
            setLoadingControlled(false);
        }
    };

    const getBetConditionLabel = (value) => {
        const condition = validBetConditions.find(c => c.value === value);
        return condition ? condition.label : 'Random';
    };

    const getBetConditionColor = (value) => {
        const condition = validBetConditions.find(c => c.value === value);
        return condition ? condition.color : 'default';
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
                const numbers = formatMelate5MinResult(result).split(' ');
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
            <Title level={2}>Melate 5min Results Management</Title>

            <Card title="Set Melate 5min Result" className="mb-4">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                        message="Melate 5min Draw Schedule"
                        description="Melate 5min draws occur every 5 minutes, 365 days a year. Results are generated automatically, but you can manually set a result if needed."
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
                            {formatMelate5MinResult(inputResult).split(' ').slice(0, 6).map((num, idx) => {
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
                            {formatMelate5MinResult(inputResult).split(' ').length > 6 && (
                                <>
                                    <Text style={{ fontSize: '16px', margin: '0 4px' }}>+</Text>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700 border-2 border-yellow-300">
                                        <Text strong style={{ fontSize: '18px', color: 'white' }}>
                                            {formatMelate5MinResult(inputResult).split(' ')[6]}
                                        </Text>
                                    </div>
                                    <Text style={{ fontSize: '12px', marginLeft: '4px', color: '#666' }}>(Special)</Text>
                                </>
                            )}
                        </div>
                    )}
                </Space>
            </Card>

            <Card 
                title="Controlled Results Management" 
                className="mb-4"
                extra={
                    controlledResult && (
                        <Popconfirm
                            title="Clear controlled results?"
                            description="Are you sure you want to clear all controlled bet conditions?"
                            onConfirm={handleClearControlledResult}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger size="small" loading={loadingControlled}>
                                Clear All
                            </Button>
                        </Popconfirm>
                    )
                }
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                        message="Control Next 10 Rounds"
                        description="Set bet conditions for each of the next 10 rounds. If you set a bet condition, the result will be generated to satisfy that condition (users betting on it will win). Leave as 'Random' for normal random generation."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    {controlledResult && (
                        <Alert
                            message={`Active Controlled Results (${controlledResult.betConditionsQueue?.length || 0} rounds remaining)`}
                            description={
                                controlledResult.betConditionsQueue && controlledResult.betConditionsQueue.length > 0 && nextIssueNumber ? (
                                    <div>
                                        Next issue: <Text strong>{nextIssueNumber}</Text> - <Tag color={getBetConditionColor(controlledResult.betConditionsQueue[0])}>
                                            {getBetConditionLabel(controlledResult.betConditionsQueue[0])}
                                        </Tag>
                                    </div>
                                ) : (
                                    'Queue is empty'
                                )
                            }
                            type="success"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <div>
                        <Text strong>Set Bet Conditions for Next 10 Rounds:</Text>
                        {nextIssueNumber !== null && (
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                                (Issue {nextIssueNumber} - {nextIssueNumber + 9})
                            </Text>
                        )}
                        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                            {controlledQueue.map((value, index) => {
                                const issueNumber = nextIssueNumber !== null ? nextIssueNumber + index : null;
                                return (
                                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                        <div style={{ marginBottom: 8 }}>
                                            <Text strong>
                                                {issueNumber !== null ? `Issue ${issueNumber}:` : `Round ${index + 1}:`}
                                            </Text>
                                            <Select
                                                value={value === null ? 'null' : value}
                                                onChange={(val) => handleQueueChange(index, val)}
                                                style={{ width: '100%', marginTop: 4 }}
                                                placeholder="Select bet condition"
                                                disabled={loadingControlled}
                                            >
                                                {validBetConditions.map((condition) => (
                                                    <Option key={condition.value || 'null'} value={condition.value || 'null'}>
                                                        <Tag color={condition.color} style={{ marginRight: 4 }}>
                                                            {condition.label}
                                                        </Tag>
                                                    </Option>
                                                ))}
                                            </Select>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>

                    <Space>
                        <Button
                            type="primary"
                            onClick={handleSetControlledResult}
                            loading={loadingControlled}
                            disabled={loadingControlled}
                        >
                            Set Controlled Results
                        </Button>
                        <Button
                            onClick={() => setControlledQueue(Array(10).fill(null))}
                            disabled={loadingControlled}
                        >
                            Reset All to Random
                        </Button>
                        <Button
                            onClick={() => {
                                fetchControlledResult();
                                fetchRecentResults(); // Refresh to get updated issue numbers
                            }}
                            disabled={loadingControlled}
                        >
                            Refresh
                        </Button>
                    </Space>

                    {controlledQueue.filter(q => q !== null).length > 0 && (
                        <Alert
                            message="Summary"
                            description={
                                <div>
                                    <Text strong>Total rounds set: </Text>
                                    <Tag>{controlledQueue.filter(q => q !== null).length} controlled</Tag>
                                    <Tag>{controlledQueue.filter(q => q === null).length} random</Tag>
                                    <div style={{ marginTop: 8 }}>
                                        <Text strong>Controlled rounds: </Text>
                                        {controlledQueue.map((value, index) => {
                                            if (value !== null) {
                                                const issueNumber = nextIssueNumber !== null ? nextIssueNumber + index : null;
                                                return (
                                                    <Tag key={index} color={getBetConditionColor(value)} style={{ marginTop: 4 }}>
                                                        {issueNumber !== null ? `Issue ${issueNumber}` : `Round ${index + 1}`}: {getBetConditionLabel(value)}
                                                    </Tag>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            }
                            type="warning"
                            showIcon
                        />
                    )}
                </Space>
            </Card>

            <Card title="Recent Melate 5min Results (Last 7 Days)">
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

export default Melate5MinManage;

