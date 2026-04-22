import React, { useEffect, useState } from 'react';
import { Modal, Input, InputNumber, Select, TextArea, Button } from 'antd'
import { CARDS } from '../../../constants/bonus';
import { postUrl } from '../../../utility';
import { useAuth } from '../../../context/AuthContext';
import { warning, success } from '../../../utility/notification';

export default ({ open = false, data = {}, onClose = f => f, setRefresh }) => {
    const [editedData, setEditedData] = useState({})
    const [username, setUsername] = useState('')
    const [title, setTitle] = useState('')
    const [card, setCard] = useState(null)
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [currency, setCurrency] = useState('')
    const { logout, sitemode, coins } = useAuth();
    useEffect(() => {
        setEditedData({ ...data })
        setUsername(data.username)
        setTitle(data.title)
        setCard(data.card)
        setAmount(data.amount)
        setDescription(data.description)
        setCurrency(data.currency)
    }, [data])

    const handleSave = (id, draft = true) => {
        if (!username || !title || card === null || !amount || !description) {
            warning("All parameters are required.")
            return;
        }
        postUrl(sitemode,
            id ? "/api/bonus/card/update" : "/api/bonus/card/add",
            {
                _id: id,
                username,
                title,
                card,
                amount,
                description,
                draft,
                currency,
            },
            (res) => {
                if (res.message) {
                    success("Bonus card saved successfully.");
                }
                setRefresh()
                onClose();
            },
            logout,
        )
    }


    return <Modal open={open} footer={null} title={editedData.id ? 'Edit Bonus Card' : 'Create New Bonus Card'} onCancel={onClose}>
        <div className='w-full'>
            <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <Input
                placeholder="Title"
                className="mt-2 w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-[10px]">
                <Select
                    placeholder="Select a Card"
                    className="mt-2 w-[150px] h-[40px]"
                    value={card}
                    onChange={(value) => setCard(value)}
                >
                    {CARDS.map((card, index) => <Select.Option key={index} value={index}><img src={card} alt={index} className="w-[50px]" /></Select.Option>)}
                </Select>
                <Input
                    placeholder="Amount"
                    type="number"
                    className="mt-2 w-full"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>
            <Select
                placeholder="Select a Currency"
                className="mt-2 h-[40px] w-full"
                value={currency}
                onChange={(value) => setCurrency(value)}
            >
                {Object.keys(coins).map((currency, index) => <Select.Option key={index} value={currency}><img src={coins[currency]} className="w-[1em] mr-2 cursor-pointer" /> {currency}</Select.Option>)}
            </Select>
            <Input.TextArea
                placeholder="Description"
                className="mt-2 w-full"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <div className="w-full flex justify-end gap-[10px] mt-[10px]">
                <Button
                    onClick={() => {
                        handleSave(editedData._id, false)
                    }}
                    color="primary"
                    variant="solid"
                >
                    Save
                </Button>
                <Button
                    onClick={onClose}
                    color="gray"
                    variant="outlined"
                >
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        handleSave(editedData._id, true)
                    }}
                    color="danger"
                    variant="solid"
                >
                    Draft
                </Button>
            </div>
        </div>
    </Modal>
}