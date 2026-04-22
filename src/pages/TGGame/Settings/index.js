import { Checkbox, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import GameCard from "./GameCard";
import postUrl2Pro from "../../../utility/postUrl2Pro";
const Setting = () => {
    const { logout , sitemode } = useAuth();
    const [gameSettingData, setGameSettingData] = useState(null);
    const [checked, setChecked] = useState(false);

    const getGameSettingData = () =>
        postUrl2Pro(
            "/api/tg/game/setting/list",
            {},
            (d) =>
                setGameSettingData(
                    d
                ),
            logout,
        );
    useEffect(() => {
        getGameSettingData();
    }, []);
    return (
        <div className="mt-4">
            <div className="flex justify-start">
                <Checkbox
                    checked={checked}
                    onChange={(e) => {
                        setChecked(e.target.checked);
                    }}
                >
                    Has Funds
                </Checkbox>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
                {!gameSettingData && <div className="flex justify-center items-center w-full"><Spin size="large" /></div>}
                {gameSettingData?.length > 0 && gameSettingData?.map((item, index) => {
                    return <GameCard getGameData={getGameSettingData} key={index} item={item} checked={checked}/>
                })}
            </div>
        </div>)
};

export default Setting; 
