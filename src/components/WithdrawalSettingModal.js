import { Divider, InputNumber, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { postUrl } from "../utility";
import { success } from "../utility/notification";
import { useAuth } from "../context/AuthContext";

export default ({open = false, data = {}, onCancel = f => f}) => {
    const [ editData, setEditData ] = useState({...data})
    const { sitemode } = useAuth()

    const saveSetting = () => {
        postUrl(sitemode,'/api/transactions/withdrawal/setting/save', { ...editData}, (res)=>{
            success(res.message)
            onCancel()
        })
    }

    useEffect(() => {
        setEditData({...data})
    }, [data])
    return <>
        <Modal open = {open} onCancel={onCancel} title = "Settings" okText = "Save" onOk={saveSetting} >
            <div className="flex flex-col gap-4">
                <div className="text-md">
                    {`If the total withdrawal amount exceeds $${editData.amount || `{amount}`}, an admin review is required.
                    Additionally, if a user attempts to withdraw the same amount ${editData.several?.times || `{time(s)}`} time(s) within ${editData.several?.period || `{period}`} minute(s), it should trigger an alert for further verification.`}
                </div>
                <Divider />
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-2 items-center">
                        <label> Amount($): </label>
                        <InputNumber value={editData.amount || ''} onChange={e => setEditData(prev => ({...prev, amount: e}))}/>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <InputNumber value={editData.several?.times || ''} onChange={e => setEditData(prev => ({...prev, several: {...(prev.several||{}), times:e}}))}/>
                        <label>time(s) in</label>
                        <InputNumber value={editData.several?.period || ''} onChange={e => setEditData(prev => ({...prev, several: {...(prev.several||{}), period:e}}))}/>
                        <label> minute(s) </label>
                    </div>
                </div>
            </div>
        </Modal>
    </>
}