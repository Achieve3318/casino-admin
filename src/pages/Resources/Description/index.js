import { Button, Select } from "antd";
import React, { useEffect, useReducer, useState } from "react";
import ReactQuill from "react-quill";
import { success } from "toastr";
import { useAuth } from "../../../context/AuthContext";
import postUrl from "../../../utility/postUrl";

const defaultText = '<p><span style="color: #ccc;"> </span></p>';
const DescriptionEdit = () => {
  const [games, setGames] = useState({});
  const [languages, setLanguages] = useState([]);
  const [game, setGame] = useState("dice");
  const [lang, setLang] = useState("en");
  const [refresh, ] = useReducer((f) => !f);
  const { logout , sitemode } = useAuth();

  const [context, setContext] = useState(defaultText);
  const [data, setData] = useState(null);

  useEffect(() => {
    postUrl(sitemode,"/api/server/games", {}, (data) => setGames(data));
    postUrl(sitemode,"/api/server/languages", {}, (data) => setLanguages(data));
  }, []);

  useEffect(() => {
    postUrl(sitemode,
      "/api/resource/get",
      { game, lang, name: "description" },
      (data) => {
        if (data.lang === lang) {
          setData(data);
          setContext(data.text);
        } else {
          setData(null);
          setContext(defaultText);
        }
      },
      logout,
    );
  }, [game, lang, logout, refresh]);

  const onGameChange = (val) => setGame(val);
  const onLangChange = (lang) => setLang(lang);

  const handleChange = (t) => setContext(t);
  const handleSave = () => {
    postUrl(sitemode,
      data ? "/api/resource/update" : "/api/resource/create",
      { game, lang, name: "description", text: context, id: data?._id },
      (data) => {
        if (data.message === "success") success("Saved");
      },
      logout,
    );
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-3 md:gap-10 z-10 shadow-md pb-2 px-3 mt-4">
        <div className="flex items-center justify-between">
          <div className="mr-3">Game : </div>
          <Select
            className="min-w-40 w-[60%]"
            showSearch
            placeholder="Select a Game"
            optionFilterProp="label"
            onChange={onGameChange}
            value={game}
            options={Object.keys(games).map((key) => ({
              value: key,
              label: key[0].toUpperCase() + key.slice(1),
            }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="mr-3">Language : </div>
          <Select
            className="min-w-40 w-[60%]"
            showSearch
            placeholder="Select an language"
            optionFilterProp="label"
            onChange={onLangChange}
            value={lang}
            options={Object.keys(languages).map((key) => ({
              value: languages[key].lang,
              label: languages[key].label,
            }))}
          />
        </div>
      </div>
      <ReactQuill
        className="mt-3"
        value={context}
        onChange={handleChange}
        theme="snow"
        modules={{
          toolbar: [
            [{ header: "1" }, { header: "2" }, { font: [] }],
            [{ size: ["small", "medium", "large", "huge"] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["bold", "italic", "underline"],
            [{ align: [] }],
            [{ color: [] }, { background: [] }],
            ["clean"],
            [{ script: "sub" }, { script: "super" }],
          ],
        }}
      />
      <Button
        type="primary"
        className="float-right mt-2 min-w-[100px]"
        onClick={() => {
          handleSave();
        }}
      >
        Save
      </Button>
    </>
  );
};

export default DescriptionEdit;
