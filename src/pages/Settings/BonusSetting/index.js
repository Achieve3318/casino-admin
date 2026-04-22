import { Switch, message, InputNumber, Button } from "antd";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { postUrl } from "../../../utility";
import { success } from "../../../utility/notification";
import BetBonus from "../BetBonus";

export default function BonusSetting() {
    const { logout, sitemode } = useAuth();
    const [phoneEnabled, setPhoneEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [newUserBoostThreshold, setNewUserBoostThreshold] = useState(500);
    const [loading, setLoading] = useState(false);
    const [thresholdLoading, setThresholdLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        postUrl(
            sitemode,
            "/api/bonus/settings/get",
            {},
            (data) => {
                setPhoneEnabled(data.phoneVerificationBonusEnabled !== false);
                setEmailEnabled(data.emailVerificationBonusEnabled !== false);
            },
            logout
        );
        
        // Load new user boost settings
        postUrl(
            sitemode,
            "/api/bonus/newuserboost/settings/get",
            {},
            (data) => {
                setNewUserBoostThreshold(data.newUserBoostThreshold || 500);
            },
            logout
        );
    };

    const handlePhoneChange = (checked) => {
        setLoading(true);
        postUrl(
            sitemode,
            "/api/bonus/settings/update",
            { phoneVerificationBonusEnabled: checked },
            () => {
                setPhoneEnabled(checked);
                success("Phone verification bonus setting updated successfully");
                setLoading(false);
            },
            logout,
            () => {
                setLoading(false);
            }
        );
    };

    const handleEmailChange = (checked) => {
        setLoading(true);
        postUrl(
            sitemode,
            "/api/bonus/settings/update",
            { emailVerificationBonusEnabled: checked },
            () => {
                setEmailEnabled(checked);
                success("Email verification bonus setting updated successfully");
                setLoading(false);
            },
            logout,
            () => {
                setLoading(false);
            }
        );
    };

    const handleThresholdUpdate = () => {
        if (newUserBoostThreshold < 0) {
            message.error("Threshold must be a positive number");
            return;
        }
        
        setThresholdLoading(true);
        postUrl(
            sitemode,
            "/api/bonus/newuserboost/settings/update",
            { newUserBoostThreshold },
            () => {
                success("New user boost threshold updated successfully");
                setThresholdLoading(false);
            },
            logout,
            () => {
                setThresholdLoading(false);
            }
        );
    };

    return (
        <div>
            <p className="font-extrabold text-[2em]">Bonus Settings</p>
            <div className="border-1 border-solid border-green-400 bg-green-100 rounded-md p-4 flex justify-between w-full mt-4">
                <p className="text-[20px] text-green-600">Phone Verification Bonus</p>
                <Switch checked={phoneEnabled} onChange={handlePhoneChange} disabled={loading} />
            </div>
            <div className="border-1 border-solid border-blue-400 bg-blue-100 rounded-md p-4 flex justify-between w-full mt-4">
                <p className="text-[20px] text-blue-600">Email Verification Bonus</p>
                <Switch checked={emailEnabled} onChange={handleEmailChange} disabled={loading} />
            </div>
            <div className="border-1 border-solid border-purple-400 bg-purple-100 rounded-md p-4 mt-4">
                <p className="text-[20px] text-purple-600 mb-4">New User Win Boost Threshold</p>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                            First-login users will win with 90% probability until their total earnings reach this threshold (in MXN).
                        </p>
                        <InputNumber
                            min={0}
                            value={newUserBoostThreshold}
                            onChange={(value) => setNewUserBoostThreshold(value || 500)}
                            style={{ width: '200px' }}
                            addonAfter="MXN"
                        />
                    </div>
                    <Button 
                        type="primary" 
                        onClick={handleThresholdUpdate}
                        loading={thresholdLoading}
                    >
                        Update Threshold
                    </Button>
                </div>
            </div>
        </div>
    );
}