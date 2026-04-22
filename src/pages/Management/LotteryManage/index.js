import React, { useState, useEffect } from 'react';
import { Table, Input, Button, DatePicker, Card, Space, Typography, Divider, Alert, Popconfirm } from 'antd';
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

const LotteryManage = () => {
    const { logout, sitemode } = useAuth();
    const [todayResults, setTodayResults] = useState([]);
    const [lastDaysResults, setLastDaysResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs().tz('America/Mexico_City'));
    const [scrapedData, setScrapedData] = useState(null);
    const [scraping, setScraping] = useState(false);
    const [multipliers, setMultipliers] = useState({});
    const [multiplierLoading, setMultiplierLoading] = useState(false);
    const [editingMultipliers, setEditingMultipliers] = useState({});

    // Get API URL from environment
    const API_URL = SUB_SITE[sitemode] + "/api";

    // Time slots for the day
    const timeSlots = [
        { time: '13:00', label: '1:00 PM' },
        { time: '15:00', label: '3:00 PM' },
        { time: '17:00', label: '5:00 PM' },
        { time: '19:00', label: '7:00 PM' },
        { time: '21:00', label: '9:00 PM' }
    ];

    // State for input fields
    const [inputResults, setInputResults] = useState({
        '13:00': '',
        '15:00': '',
        '17:00': '',
        '19:00': '',
        '21:00': ''
    });

    useEffect(() => {
        fetchTodayResults();
        fetchLastDaysResults();
        fetchMultipliers();
    }, []);

    // Game type labels for display
    const gameTypeLabels = {
        'yidin': '一定 (1-digit)',
        'erdin': '二定 (2-digits)',
        'sandin': '三定 (3-digits)',
        'sidin': '四定 (4-digits)',
        'wudin': '五定 (5-digits)',
        'erzixian': '二字现 (2-digits-present)',
        'sanzixian': '三字现 (3-digits-present)'
    };

    // Fetch multipliers from backend
    const fetchMultipliers = async () => {
        try {
            setMultiplierLoading(true);
            const response = await axios.get(`${API_URL}/admin/lottery/multipliers`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                const multipliersObj = {};
                response.data.data.forEach(mult => {
                    multipliersObj[mult.gameType] = mult.multiplier;
                });
                setMultipliers(multipliersObj);
                setEditingMultipliers(multipliersObj);
            }
        } catch (err) {
            console.error('Error fetching multipliers:', err);
            error('Failed to fetch multipliers');
        } finally {
            setMultiplierLoading(false);
        }
    };

    // Handle multiplier input change
    const handleMultiplierChange = (gameType, value) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setEditingMultipliers(prev => ({
                ...prev,
                [gameType]: numValue
            }));
        } else if (value === '' || value === '-') {
            setEditingMultipliers(prev => ({
                ...prev,
                [gameType]: value
            }));
        }
    };

    // Save single multiplier
    const handleSaveMultiplier = async (gameType) => {
        const multiplier = editingMultipliers[gameType];
        if (multiplier === undefined || multiplier === null || multiplier === '') {
            warning('Please enter a valid multiplier');
            return;
        }

        try {
            setMultiplierLoading(true);
            await axios.put(`${API_URL}/admin/lottery/multipliers/${gameType}`, 
                { multiplier },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            success('Multiplier updated successfully');
            fetchMultipliers();
        } catch (err) {
            console.error('Error updating multiplier:', err);
            error(err.response?.data?.message || 'Failed to update multiplier');
        } finally {
            setMultiplierLoading(false);
        }
    };

    // Save all multipliers
    const handleSaveAllMultipliers = async () => {
        try {
            setMultiplierLoading(true);
            await axios.put(`${API_URL}/admin/lottery/multipliers`,
                { multipliers: editingMultipliers },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            success('All multipliers updated successfully');
            fetchMultipliers();
        } catch (err) {
            console.error('Error updating multipliers:', err);
            error(err.response?.data?.message || 'Failed to update multipliers');
        } finally {
            setMultiplierLoading(false);
        }
    };

    // Fetch results when selected date changes
    useEffect(() => {
        if (selectedDate) {
            fetchResultsByDate(selectedDate);
        }
    }, [selectedDate]);

    const fetchTodayResults = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/lottery/results/today`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                setTodayResults(response.data.data);

                // Pre-fill existing results in input fields
                const existingResults = {};
                response.data.data.forEach(result => {
                    const time = dayjs(result.time).tz('America/Mexico_City');
                    const timeStr = `${String(time.hour()).padStart(2, '0')}:${String(time.minute()).padStart(2, '0')}`
                    existingResults[timeStr] = result.result;
                });
                setInputResults(prev => ({ ...prev, ...existingResults }));
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
            const response = await axios.get(`${API_URL}/admin/lottery/results/last-days?days=3`, {
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

    const fetchResultsByDate = async (date) => {
        try {
            setLoading(true);
            const dateStr = dayjs(date).tz('America/Mexico_City').format('YYYY-MM-DD');
            const response = await axios.get(`${API_URL}/admin/lottery/results/date?date=${dateStr}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                // Pre-fill existing results in input fields
                const existingResults = {};
                response.data.data.forEach(result => {
                    const time = dayjs(result.time).tz('America/Mexico_City');
                    const timeStr = `${String(time.hour()).padStart(2, '0')}:${String(time.minute()).padStart(2, '0')}`;
                    existingResults[timeStr] = result.result;
                });
                setInputResults(prev => ({ ...prev, ...existingResults }));
            } else {
                // Clear input fields if no results found for this date
                setInputResults({
                    '13:00': '',
                    '15:00': '',
                    '17:00': '',
                    '19:00': '',
                    '21:00': ''
                });
            }
        } catch (err) {
            console.error('Error fetching results by date:', err);
            // Clear input fields on error
            setInputResults({
                '13:00': '',
                '15:00': '',
                '17:00': '',
                '19:00': '',
                '21:00': ''
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (time, value) => {
        // Only allow numbers and limit to 5 digits
        if (/^\d{0,5}$/.test(value)) {
            setInputResults(prev => ({
                ...prev,
                [time]: value
            }));
        }
    };

    const handleSetResult = async (time) => {
        const result = inputResults[time];

        if (!result || result.length !== 5) {
            warning('Please enter a 5-digit number');
            return;
        }

        try {
            setLoading(true);
            const [hours, minutes] = time.split(':');

            // Create the date in Mexico City timezone
            const lotteryTime = dayjs.tz(selectedDate.format('YYYY-MM-DD'), 'America/Mexico_City')
                .hour(parseInt(hours))
                .minute(parseInt(minutes))
                .second(0)
                .millisecond(0);

            // Check if draw time has passed
            const now = dayjs().tz('America/Mexico_City');
            if (lotteryTime.isAfter(now)) {
                warning(`Cannot set result before draw time. Draw time is at ${lotteryTime.format('h:mm A')}, current time is ${now.format('h:mm A')}`);
                setLoading(false);
                return;
            }

            await axios.post(`${API_URL}/admin/lottery/results/set`,
                {
                    result,
                    time: lotteryTime.toISOString()
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
        } catch (err) {
            console.error('Error setting result:', err);
            error(err.response?.data?.message || 'Failed to set result');
        } finally {
            setLoading(false);
        }
    };

    const handleSetAllResults = async () => {
        const results = [];
        let hasError = false;

        for (const slot of timeSlots) {
            const result = inputResults[slot.time];
            if (result && result.length === 5) {
                results.push({
                    time: slot.time,
                    result: result
                });
            } else if (result && result.length !== 5) {
                warning(`Invalid result for ${slot.label}`);
                hasError = true;
                break;
            }
        }

        if (hasError || results.length === 0) {
            if (!hasError) {
                warning('Please enter at least one valid 5-digit result');
            }
            return;
        }

        try {
            setLoading(true);
            // Send date in Mexico City timezone
            const dateStr = selectedDate.format('YYYY-MM-DD');

            const response = await axios.post(`${API_URL}/admin/lottery/results/set-multiple`,
                {
                    results,
                    date: dateStr,
                    timezone: 'America/Mexico_City'
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data?.data?.errors?.length > 0) {
                warning('Some results could not be set');
            } else {
                success('All results set successfully');
            }

            fetchTodayResults();
            fetchLastDaysResults();
        } catch (err) {
            console.error('Error setting multiple results:', err);
            error('Failed to set results');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to check if a time slot can be set
    const canSetTime = (time) => {
        const [hours, minutes] = time.split(':');
        const lotteryTime = dayjs.tz(selectedDate.format('YYYY-MM-DD'), 'America/Mexico_City')
            .hour(parseInt(hours))
            .minute(parseInt(minutes))
            .second(0);
        const now = dayjs().tz('America/Mexico_City');
        return !lotteryTime.isAfter(now);
    };

    // Test scraping functionality
    const handleTestScrape = async () => {
        try {
            setScraping(true);
            const response = await axios.get(`${API_URL}/admin/lottery/scrape-test`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                setScrapedData(response.data.data);
                success(`Successfully scraped ${response.data.count} results from website`);
            }
        } catch (err) {
            console.error('Error testing scrape:', err);
            error('Failed to scrape website: ' + (err.response?.data?.message || err.message));
        } finally {
            setScraping(false);
        }
    };

    // Manually trigger auto-fetch for a specific hour
    const handleAutoFetch = async (hour) => {
        try {
            setLoading(true);
            const response = await axios.post(`${API_URL}/admin/lottery/auto-fetch/${hour}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data?.data?.success) {
                success(`Auto-fetch successful for ${hour}:00 draw`);
                fetchTodayResults();
                fetchLastDaysResults();
            } else {
                warning(response.data?.data?.reason || 'Auto-fetch did not find/set result');
            }
        } catch (err) {
            console.error('Error in auto-fetch:', err);
            error('Auto-fetch failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResult = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`${API_URL}/admin/lottery/results/delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            success('Lottery result deleted successfully');
            fetchTodayResults();
            fetchLastDaysResults();
        } catch (err) {
            console.error('Error deleting lottery result:', err);
            error(err.response?.data?.message || 'Failed to delete result');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Sorteo',
            dataIndex: 'lotteryId',
            key: 'lotteryId',
            align: 'center',
            width: '10%',
            render: (text) => <Text strong>{text || 'N/A'}</Text>
        },
        {
            title: 'Fecha',
            dataIndex: 'time',
            key: 'date',
            align: 'center',
            width: '25%',
            render: (time) => dayjs(time).tz('America/Mexico_City').format('DD/MM/YYYY')
        },
        {
            title: 'Sorteo',
            dataIndex: 'time',
            key: 'time',
            align: 'center',
            width: '25%',
            render: (time) => dayjs(time).tz('America/Mexico_City').format('h:mm A')
        },
        {
            title: 'Combinación Ganadora',
            dataIndex: 'result',
            key: 'result',
            align: 'center',
            width: '30%',
            render: (result) => (
                <Text strong style={{ fontSize: '24px', color: '#fbbf24', fontFamily: 'monospace' }}>
                    {result}
                </Text>
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

    return (
        <div className="p-4">
            <Title level={2}>Lottery Results Management</Title>

            {/* Today's Results Input Section */}
            <Card title="Set Today's Results" className="mb-4">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div className='flex gap-4 items-center'>
                        <div className='flex gap-1 items-center'>
                            <Text>Date: </Text>
                            <DatePicker
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date ? dayjs(date).tz('America/Mexico_City') : dayjs().tz('America/Mexico_City'))}
                                format="YYYY-MM-DD"
                                style={{ marginLeft: 8 }}
                            />
                        </div>
                        <p className='text-sm text-red-500 font-bold'>Note: You cannot set results before the draw time.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {timeSlots.map((slot) => {
                            const isDrawTimePassed = canSetTime(slot.time);
                            return (
                                <Card
                                    key={slot.time}
                                    size="small"
                                    title={
                                        <span>
                                            {slot.label}
                                            {!isDrawTimePassed && <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>(Not yet)</Text>}
                                        </span>
                                    }
                                >
                                    <Space.Compact style={{ width: '100%' }}>
                                        <Input
                                            maxLength={5}
                                            value={inputResults[slot.time]}
                                            onChange={(e) => handleInputChange(slot.time, e.target.value)}
                                            placeholder="12345"
                                            style={{
                                                fontSize: '20px',
                                                fontFamily: 'monospace',
                                                textAlign: 'center'
                                            }}
                                            disabled={loading || !isDrawTimePassed}
                                        />
                                        <Button
                                            type="primary"
                                            onClick={() => handleSetResult(slot.time)}
                                            disabled={loading || !inputResults[slot.time] || inputResults[slot.time].length !== 5 || !isDrawTimePassed}
                                            loading={loading}
                                            title={!isDrawTimePassed ? 'Draw time has not passed yet' : ''}
                                        >
                                            Set
                                        </Button>
                                    </Space.Compact>
                                </Card>
                            );
                        })}
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        onClick={handleSetAllResults}
                        disabled={loading}
                        loading={loading}
                        style={{ backgroundColor: '#10b981' }}
                    >
                        Set All Results
                    </Button>
                </Space>
            </Card>

            {/* Auto-Fetch System Info */}
            <Card title="Auto-Fetch System" className="mb-4">
                <Alert
                    message="Automatic Result Fetching"
                    description="If you don't set a result manually, the system will automatically fetch it from the official lottery website 20 minutes after each draw time (1:30 PM, 3:30 PM, 5:30 PM, 7:30 PM, 9:30 PM Mexico time)."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                        <Button
                            onClick={handleTestScrape}
                            loading={scraping}
                            style={{ marginRight: 8 }}
                        >
                            Test Website Scraping
                        </Button>
                        <Text type="secondary">Check if we can fetch results from the website</Text>
                    </div>

                    {scrapedData && (
                        <div>
                            <Divider orientation="left">Scraped Results Preview</Divider>
                            <Table
                                size="small"
                                dataSource={scrapedData}
                                rowKey="sorteo"
                                pagination={false}
                                columns={[
                                    { title: 'Sorteo', dataIndex: 'sorteo', key: 'sorteo' },
                                    { title: 'Combination', dataIndex: 'combination', key: 'combination', render: (text) => <Text strong style={{ fontFamily: 'monospace', fontSize: '16px' }}>{text}</Text> },
                                    { title: 'Date', dataIndex: 'date', key: 'date' }
                                ]}
                            />
                        </div>
                    )}

                    <Divider orientation="left">Manual Auto-Fetch Triggers</Divider>
                    <div>
                        <Text type="secondary">For testing: Manually trigger auto-fetch for specific draw times</Text>
                        <div style={{ marginTop: 8 }}>
                            <Space wrap>
                                {[13, 15, 17, 19, 21].map(hour => (
                                    <Button
                                        key={hour}
                                        onClick={() => handleAutoFetch(hour)}
                                        disabled={loading}
                                        size="small"
                                    >
                                        Fetch {hour}:00 Draw
                                    </Button>
                                ))}
                            </Space>
                        </div>
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
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Multipliers Management */}
            <Card title="Lottery Multipliers Management" className="mt-4">
                <Alert
                    message="Multiplier Management"
                    description="Manage payout multipliers for each lottery game type. Note: Filter game multipliers are based on fixed positions (1 fixed = yidin, 2 fixed = erdin, etc.) and are not directly editable here."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {Object.keys(gameTypeLabels).map(gameType => (
                            <Card key={gameType} size="small" title={gameTypeLabels[gameType]}>
                                <Space.Compact style={{ width: '100%' }}>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={editingMultipliers[gameType] ?? multipliers[gameType] ?? ''}
                                        onChange={(e) => handleMultiplierChange(gameType, e.target.value)}
                                        placeholder="Multiplier"
                                        style={{ width: '70%' }}
                                        disabled={multiplierLoading}
                                    />
                                    <Button
                                        type="primary"
                                        onClick={() => handleSaveMultiplier(gameType)}
                                        loading={multiplierLoading}
                                        style={{ width: '30%' }}
                                    >
                                        Save
                                    </Button>
                                </Space.Compact>
                            </Card>
                        ))}
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        onClick={handleSaveAllMultipliers}
                        disabled={multiplierLoading}
                        loading={multiplierLoading}
                        style={{ backgroundColor: '#10b981' }}
                    >
                        Save All Multipliers
                    </Button>
                </Space>
            </Card>
        </div>
    );
};

export default LotteryManage;

