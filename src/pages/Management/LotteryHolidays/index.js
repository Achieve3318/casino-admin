import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Typography, Modal, Form, Input, DatePicker, Popconfirm } from 'antd';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { success, error } from '../../../utility/notification';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SUB_SITE } from '../../../utility';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

const LotteryHolidays = () => {
    const { sitemode } = useAuth();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();

    const API_URL = SUB_SITE[sitemode] ? SUB_SITE[sitemode] + '/api' : '';

    const fetchHolidays = async () => {
        if (!API_URL) return;
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/admin/quina-seninha/holidays`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.data && res.data.data) {
                setList(res.data.data);
            }
        } catch (err) {
            console.error(err);
            error('Failed to load lottery holidays');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, [sitemode]);

    const openAdd = () => {
        setEditingId(null);
        form.setFieldsValue({ date: dayjs().tz('America/Sao_Paulo'), name: '' });
        setModalOpen(true);
    };

    const openEdit = (record) => {
        setEditingId(record._id);
        form.setFieldsValue({
            date: record.date ? dayjs(record.date).tz('America/Sao_Paulo') : null,
            name: record.name || ''
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const dateStr = values.date ? dayjs(values.date).tz('America/Sao_Paulo').format('YYYY-MM-DD') : null;
            if (!dateStr) {
                error('Please select a date');
                return;
            }
            const payload = { date: dateStr, name: values.name || '' };
            if (editingId) {
                await axios.put(`${API_URL}/admin/quina-seninha/holidays/${editingId}`, payload, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                success('Holiday updated');
            } else {
                await axios.post(`${API_URL}/admin/quina-seninha/holidays`, payload, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                success('Holiday added');
            }
            setModalOpen(false);
            fetchHolidays();
        } catch (err) {
            if (err.errorFields) return;
            error(err.response?.data?.message || 'Failed to save');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/admin/quina-seninha/holidays/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            success('Holiday removed');
            fetchHolidays();
        } catch (err) {
            error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (val) => val ? dayjs(val).tz('America/Sao_Paulo').format('YYYY-MM-DD') : '-'
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (val) => val || '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" size="small" onClick={() => openEdit(record)}>Edit</Button>
                    <Popconfirm
                        title="Remove this holiday?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" size="small" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <Space style={{ marginBottom: 16 }} direction="vertical" size="middle">
                    <Title level={4}>Lottery Holidays (Quina & Seninha)</Title>
                    <p style={{ color: '#666' }}>
                        On these dates, no lottery draw is organized. Users cannot place bets for these days.
                    </p>
                    <Button type="primary" onClick={openAdd}>Add holiday</Button>
                </Space>
                <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={list}
                    loading={loading}
                    pagination={{ pageSize: 20 }}
                />
            </Card>
            <Modal
                title={editingId ? 'Edit holiday' : 'Add holiday'}
                open={modalOpen}
                onOk={handleSubmit}
                onCancel={() => setModalOpen(false)}
                okText="Save"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="name" label="Name (optional)">
                        <Input placeholder="e.g. Christmas" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default LotteryHolidays;
