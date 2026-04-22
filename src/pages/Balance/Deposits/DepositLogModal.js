import {Modal, Tooltip, Empty} from 'antd';
import React, {useEffect, useState} from 'react';
import {dateFormat} from '../../../utility/date';

export default({
    open = false,
    data = [],
    others = {},
    coins = {},
    onCancel = f => f
}) => {

    const [list, setList] = useState([])

    useEffect(() => {
        setList([...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    }, [data])

    return <Modal open={open}
        onCancel={onCancel}
        width='50%'
        title="Deposit Log"
        footer={null}>
        {
        list.length > 0 ? <table className="text-[1.2em] w-full text-center border-collapse border-solid border border-gray-400 mt-[10px]">
            <thead>
                <tr className="bg-[#2d7aff] text-white">
                    <th className="border-solid border border-black p-2 w-[50%]">
                        Date
                    </th>
                    <th className="border-solid border border-black p-2">
                        Amount
                    </th>
                </tr>
            </thead>
            <tbody> {
                list.map(({date, amount, type}) => (
                    <tr key={date}>
                        <td className={`border-solid border border-black p-2 w-[30%] ${type === "Deposit" ? "text-red-500" : "text-green-500"}`}>
                            {
                            dateFormat(date)
                        } </td>
                        <td className={`border-solid border border-black p-2 ${type === "Deposit" ? "text-red-500" : "text-green-500"}`}>

                            {
                            (amount || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 5,
                                useGrouping: true
                            })
                        }
                            <Tooltip title={
                                others.currency
                            }>
                                <img src={
                                        coins[others.currency]
                                    }
                                    className="w-[1em] ml-2 cursor-pointer"/>
                            </Tooltip>
                        </td>
                    </tr>
                ))
            } </tbody>
        </table> : (
            <div className="w-full flex justify-center items-center">
                <Empty/>
            </div>
        )
    } </Modal>
}
