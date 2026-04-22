import { Modal, notification, Select } from "antd";
import React, { useEffect, useReducer, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import postUrl from "../../../utility/postUrl";
import { PlusCard } from "../Description/card";
import SeoCard from "./card";
import EditModal from "./modal";

const SEO = () => {
  const [games, setGames] = useState({});
  const [languages, setLanguages] = useState([]);
  const [game, setGame] = useState("all");
  const [lang, setLang] = useState("all");
  const [refresh, setRefresh] = useReducer((f) => !f);
  const [modal, setModal] = useState({ open: false, data: null });
  const { logout , sitemode } = useAuth();

  const [data, setData] = useState([]);

  useEffect(() => {
    postUrl(sitemode,"/api/server/games", {}, (data) => setGames(data));
    postUrl(sitemode,"/api/server/languages", {}, (data) => setLanguages(data));
  }, []);

  useEffect(() => {
    postUrl(sitemode,
      "/api/resource/getList",
      {
        name: "SEO",
        game: game === "all" ? "" : game,
        lang: lang === "all" ? "" : lang,
      },
      (data) => setData(data),
      logout,
    );
  }, [game, lang, logout, refresh]);

  const onGameChange = (val) => setGame(val);
  const onLangChange = (lang) => setLang(lang);

  const handleClose = (status = false) => {
    setModal({ open: false });
    if (status) setRefresh();
  };

  const postDelete = (id) => {
    postUrl(sitemode,
      "/api/resource/delete",
      {
        id,
      },
      (data) => {
        if (data.message === "success") {
          notification.success({
            message: "Success",
            description: "You have successfully deleted",
          });
          setRefresh();
        }
      },
      logout,
    );
  };

  const handleDelete = (data) => {
    Modal.confirm({
      title: "Confirm Delete",
      icon: "",
      content: "Do you really want to delete this description?",
      okText: "Yes",
      cancelText: "No",
      onOk: () => postDelete(data._id),
    });
  };

  return (
    <>
      <div className="fixed flex flex-col md:flex-row gap-3 md:gap-10 z-10 shadow-md pb-2 px-3 mt-4">
        <div className="flex  items-center justify-between">
          <div className="mr-3">Game</div>
          <Select
            className="min-w-40 w-[70%]"
            showSearch
            placeholder="Select a Game"
            optionFilterProp="label"
            onChange={onGameChange}
            value={game}
            options={[
              {
                value: "all",
                label: "All",
              },
              ...Object.keys(games).map((key) => ({
                value: key,
                label: key[0].toUpperCase() + key.slice(1),
              })),
            ]}
          />
        </div>
        <div className="flex  items-center justify-between">
          <div className="mr-3">Language</div>
          <Select
            className="min-w-40 w-[70%]"
            showSearch
            placeholder="Select an language"
            optionFilterProp="label"
            onChange={onLangChange}
            value={lang}
            options={[
              {
                value: "all",
                label: "All",
              },
              ...Object.keys(languages).map((key) => ({
                value: languages[key].lang,
                label: languages[key].label,
              })),
            ]}
          />
        </div>
      </div>
      <div className="mt-20 md:mt-10"></div>
      <div className="mt-5 md:mt-10 flex flex-wrap">
        <div className="p-5">
          <PlusCard onClick={() => setModal({ open: true, data: null })} />
        </div>
        {data.map((data) => (
          <div className="p-5" key={data._id}>
            <SeoCard
              game={game}
              lang={lang}
              data={data}
              onEdit={() => setModal({ open: true, data })}
              onDelete={() => handleDelete(data)}
            />
          </div>
        ))}
      </div>
      <EditModal
        open={modal.open}
        onClose={handleClose}
        data={modal.data}
        game={game}
        games={games}
        languages={languages}
      />
    </>
  );
};

export default SEO;
