import { Input, Modal, notification, Select } from "antd";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import postUrl from "../../../utility/postUrl";

const { TextArea } = Input;

export default function EditModal({
  open = false,
  onClose = (f) => f,
  data = null,
  game = "dice",
  lang = "en",
  games = {},
  languages = {},
}) {
  const [_game, setGame] = useState("dice");
  const [_lang, setLang] = useState("en");
  const [text, setText] = useState("");
  const { logout , sitemode } = useAuth();

  useEffect(() => {
    if (game !== "all") setGame(game);
  }, [game]);
  useEffect(() => {
    if (lang !== "all") setLang(lang);
  }, [lang]);

  const handleSubmit = () => {
    if (data && data._id) {
      postUrl(sitemode,
        "/api/resource/update",
        {
          id: data._id,
          text,
        },
        (data) => {
          if (data.message === "success") {
            notification.success({
              message: "Success",
              description: "You successfully updated.",
            });
            onClose(true);
          }
        },
        logout,
      );
    } else
      postUrl(sitemode,
        "/api/resource/create",
        {
          name: "description",
          title: "",
          text,
          game: _game,
          lang: _lang,
        },
        (data) => {
          if (data.message === "success") {
            notification.success({
              message: "Success",
              description: "You successfully created.",
            });
            onClose(true);
          }
        },
        logout,
      );
  };

  useEffect(() => {
    if (data) setText(data.text);
  }, [open]);

  return (
    <Modal
      title={data ? "Edit" : "Add"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
    >
      <div className="flex  items-center justify-between mt-2">
        <div className="mr-3 font-bold">Game</div>
        <Select
          className="min-w-40 w-[70%]"
          showSearch
          placeholder="Select a Game"
          optionFilterProp="label"
          onChange={(value) => setGame(value)}
          value={_game}
          disabled={data}
          options={Object.keys(games).map((key) => ({
            value: key,
            label: key[0].toUpperCase() + key.slice(1),
          }))}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="mr-3 font-bold">Language</div>
        <Select
          className="min-w-40 w-[70%]"
          showSearch
          placeholder="Select an language"
          optionFilterProp="label"
          onChange={(value) => setLang(value)}
          value={_lang}
          disabled={data}
          options={Object.keys(languages).map((key) => ({
            value: languages[key].lang,
            label: languages[key].label,
          }))}
        />
      </div>
      <div className="flex  justify-between mt-2">
        <div className="mr-3 font-bold">Text View</div>
        <TextArea
          className="min-w-40 w-[70%]"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
    </Modal>
  );
}
