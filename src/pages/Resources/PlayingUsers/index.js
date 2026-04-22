import { Input, InputNumber, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { postUrl } from "../../../utility";
import { useAuth } from "../../../context/AuthContext";
const PlayingUsers = () => {
    const [games, setGames] = useState([]);
    const [modal, setModal] = useState(false);
    const [game, setGame] = useState("");
    const [users, setUsers] = useState(null);
    const [id, setId] = useState(undefined);
    const {sitemode} = useAuth()
    const getData = () => {
        postUrl(sitemode,"/api/resource/getList", { name: "playingUsers" }, (data) => setGames(data));
    }
    useEffect(() => {
        getData();
    }, []);
    return <>
        <div className="flex flex-wrap gap-4 mt-4">
            {[...games].map((v) => (
                <div key={v.game} className="p-4 bg-white rounded-md border border-solid border-gray-200 w-[250px] min-h-[100px] cursor-pointer" onClick={() => { setGame(v.game); setUsers(v.text); setId(v._id); setModal(true) }}>
                    <div className="text-[1.3em] font-bold">Game : {v.game.charAt(0).toUpperCase() + v.game.slice(1)}</div>
                    <div className="mt-3 text-[1.2em]">Users : {v.text}</div>
                </div>
            ))}
            <div className="p-4 bg-white rounded-md border border-solid border-gray-200 w-[250px] min-h-[100px] flex items-center justify-center cursor-pointer" onClick={() => setModal(true)}>
                <i className="fa fa-plus"></i>
            </div>
        </div>
        <Modal
            open={modal}
            title={id ? "Edit Playing Users" : "Add Playing Users"}
            onClose={() => { setModal(false); setGame(""); setUsers(""); setId(undefined); }}
            onCancel={() => { setModal(false); setGame(""); setUsers(""); setId(undefined); }}
            onOk={() => {
                postUrl(sitemode,`${id ? "/api/resource/update" : "/api/resource/create"}`, { name: "playingUsers", game, text: users.toString(), id }, (data) => {
                    getData();
                    setModal(false);
                    setGame("");
                    setUsers("");
                    setId(undefined);
                });
            }}
        >
            <div className="flex gap-4 mt-4">
                <div className="text-[1.1em] w-[100px] text-right">Game :</div>
                <Input placeholder="Game" value={game} onChange={(e) => setGame(e.target.value)} />
            </div>
            <div className="flex gap-4 mt-2">
                <div className="text-[1.1em] w-[100px] text-right">Users :</div>
                <InputNumber className="w-full" placeholder="User" value={users} onChange={(e) => setUsers(e)} />
            </div>
        </Modal>
    </>;
};

export default PlayingUsers;


