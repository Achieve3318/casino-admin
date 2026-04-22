import React, { useEffect, useReducer, useState } from 'react'
import { postUrl } from '../../../utility'
import { warning } from '../../../utility/notification'
import { useAuth } from '../../../context/AuthContext'
import { Button, InputNumber, Modal, notification, Table } from 'antd'
import ButtonGroup from 'antd/es/button/button-group'
import ReferVIPUsers from './ReferVIPUsers'

const EditModal = ({ columns, selectedData, setSelectedData, visible, onOk = f => f, setVisible, price, siteCurrency}) => {

    return <Modal open={visible} onOk={onOk} onCancel={e => setVisible(false)} title={selectedData ? "Update" : "Add"}>
        <div className='w-full flex flex-col gap-4'>
            {
                columns.map(({ title, dataIndex, children }) => {
                    if (dataIndex === "_id") return <></>
                    if (children) {
                        return <div className='w-full flex items-center gap-3'>
                            <span className='w-[180px] text-right'>{title}</span>
                            <div className='w-full flex flex-col gap-1'>
                                <div className='w-full flex gap-1 items-center'>
                                    <InputNumber className='w-full' value={selectedData && selectedData[children[0].dataIndex] ? selectedData[children[0].dataIndex].toFixed(2) : ''} onChange={(value) => {
                                        setSelectedData(prev => (prev ? ({ ...prev, [children[0].dataIndex]: value }) : { [children[0].dataIndex]: value }))
                                    }} /> <span className='w-[50px]'>USD($)</span>
                                </div>
                                <div className='w-full flex gap-1 items-center'>
                                    <InputNumber className='w-full' value={selectedData && selectedData[children[0].dataIndex] ? (selectedData[children[0].dataIndex]/(price[siteCurrency] ? price[siteCurrency]:1)).toFixed(2) : ''} onChange={(value) => {
                                        setSelectedData(prev => (prev ? ({ ...prev, [children[0].dataIndex]: value * (price[siteCurrency] ? price[siteCurrency]:1) }) : { [children[0].dataIndex]: value *(price[siteCurrency] ? price[siteCurrency]:1) }))
                                    }} /> <span className='w-[50px]'>{price[siteCurrency] ? siteCurrency:'USD'}</span>
                                </div>
                            </div>
                        </div>
                    } else {
                        return <div className='w-full flex items-center gap-3'>
                            <span className='w-[180px] text-right'>{title}</span>
                            <InputNumber className='w-full' value={selectedData ? selectedData[dataIndex] : ''} onChange={(value) => {
                                setSelectedData(prev => (prev ? ({ ...prev, [dataIndex]: value }) : { [dataIndex]: value }))
                            }} />
                        </div>
                    }
                })
            }
        </div>
    </Modal>
}

export default () => {
    const [data, setData] = useState(null)
    const [refresh, refreshData] = useReducer(a => !a, true)
    const [visible, setVisible] = useState(false)
    const [selectedData, setSelectedData] = useState(null)
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const { sitemode, siteCurrency, prices } = useAuth()
    console.log(prices);
    console.log(siteCurrency);
    

    const columns = [{
        title: "ID",
        dataIndex: "_id",
        width: "5em",
        align: "center",
        className: "text-xs sm:text-sm md:text-base",
    }, {
        title: "Level",
        dataIndex: "level",
        width: "5em",
        align: "center",
        className: "text-xs sm:text-sm md:text-base",
    },
    {
        title: "Number of person",
        dataIndex: "count",
        width: '5em',
        align: "center",
        className: "text-xs sm:text-sm md:text-base"
    }, {
        title: "Deposit amount",
        className: "text-xs sm:text-sm md:text-base",
        children: [{
            title: "USD($)",
            dataIndex: "deposit",
            width: "10em",
            align: 'center',
            className: "text-xs sm:text-sm md:text-base",
            render(amount){
                return amount.toFixed(2)
            }
        }, {
            title: prices[siteCurrency] ? siteCurrency : "USD",
            dataIndex: "deposit",
            width: "10em",
            align: "center",
            className: "text-xs sm:text-sm md:text-base",
            render(amount) {
                return (amount / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toFixed(2) + " " + (prices[siteCurrency] ? siteCurrency : "USD")
            }
        }]
    }, {
        title: "Wager amount",
        className: "text-xs sm:text-sm md:text-base",
        children: [{
            title: "USD($)",
            dataIndex: "wager",
            width: "10em",
            align: 'center',
            className: "text-xs sm:text-sm md:text-base",
            render(amount){
                return amount.toFixed(2)
            }
        }, {
            title: prices[siteCurrency] ? siteCurrency : "USD",
            dataIndex: "wager",
            width: "10em",
            align: "center",
            className: "text-xs sm:text-sm md:text-base",
            render(amount) {
                return (amount / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toFixed(2) +" " + (prices[siteCurrency] ? siteCurrency : "USD")
            }
        }]
    }, {
        title: "Prize amount",
        className: "text-xs sm:text-sm md:text-base",
        children: [{
            title: "USD($)",
            dataIndex: "prize",
            width: "10em",
            className: "text-xs sm:text-sm md:text-base",
            align: 'center',
            render(amount){
                return amount.toFixed(2)
            }
        }, {
            title: prices[siteCurrency] ? siteCurrency : "USD",
            dataIndex: "prize",
            width: "10em",
            align: "center",
            className: "text-xs sm:text-sm md:text-base",
            render(amount) {
                return (amount / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toFixed(2) + " " + (prices[siteCurrency] ? siteCurrency : "USD")
            }
        }]
    }]

    useEffect(() => {
        postUrl(sitemode, "/api//bonus/refer/vip/get", {}, (dt) => setData(dt), null, (e) => {
            notification.error({
                message: "Internal Server Erorr!",
            })
            setData([])
        })
    }, [refresh])

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const update = () => {
        if( !selectedData){
            warning("You have to input values for fields")
            return
        }
        if( !selectedData.count){
            warning("Please input Number of persons")
            return
        }
        if( !selectedData.deposit){
            warning("Please input Deposit amount")
            return
        }
        if( !selectedData.wager){
            warning("Please input Wager amount")
            return
        }
        if( !selectedData.count){
            warning("Please input Prize amount")
            return
        }
        postUrl(sitemode, "/api/bonus/refer/vip/save", {...selectedData}, (data) => {
            notification.success({
                message: "Success",
                description: "Successfully saved!!"
            })
            refreshData()
            setVisible(false)
            setSelectedData(null)
        }, null, (e) => {
            notification.error({
                message: "Error",
                description: "Failed to save!Please check the connection or check the level isn't duplicated!"
            }) 
        })
    }

    return <>

        <EditModal { ...{visible, setVisible, onOk: update, columns, selectedData, setSelectedData, price:prices, siteCurrency }}></EditModal>
        <ButtonGroup className='w-full flex justify-end my-4'>
            <Button
                color="primary"
                icon={<i className="fa fa-plus"></i>}
                variant="solid"
                className="w-[6em]"
                onClick={() => {
                    setVisible(true);
                    setSelectedData(null);
                }}
            >
                Add
            </Button>
            <Button
                color="pink"
                icon={<i className="fa fa-pencil"></i>}
                variant="solid"
                className="w-[6em]"
                onClick={() => {
                    if (selectedRowKeys.length > 1) {
                        warning("You can change only one row.");
                        return;
                    }
                    if (selectedRowKeys.length === 0) {
                        warning("You have to select row.");
                        return;
                    }

                    setSelectedData(
                        data.filter((v) => v._id === selectedRowKeys[0])[0],
                    );
                    setVisible(true);
                }}
            >
                Update
            </Button>
            <Button
                color="danger"
                variant="outlined"
                icon={<i className="fa fa-trash"></i>}
                className="w-[6em]"
                onClick={() => {
                    if (selectedRowKeys.length === 0) {
                        warning("You have to select row.");
                        return;
                    }
                    Modal.confirm({
                        title: "Do you want to delete these items?",
                        content: "Once deleted, the items cannot be recovered.",
                        okText: "Yes",
                        okType: "danger",
                        cancelText: "No",
                        onOk() {
                            if( selectedRowKeys.length === 0){
                                return warning("Select rows to delete!!")
                            }
                            postUrl(sitemode, "/api/bonus/refer/vip/delete", {ids: selectedRowKeys}, (data) => {
                                notification.success({
                                    message: "Success",
                                    description: "Successfully deleted!!"
                                })
                                refreshData()
                            }, null, (e) => {
                                console.log(e)   
                            })
                        },
                        onCancel() { },
                    });
                }}
            >
                Delete
            </Button>

        </ButtonGroup>
        <Table columns={columns} dataSource={data} bordered
            loading={data === null}
            scroll={{ x: "auto" }}
            rowKey={(record) => record._id}
            rowSelection={rowSelection}

        />

        <ReferVIPUsers selectedKeys={selectedRowKeys} />
    </>
}