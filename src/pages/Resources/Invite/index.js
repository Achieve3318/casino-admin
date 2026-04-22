import { Button, Select } from "antd";
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "../../../context/AuthContext";
import { postUrl } from "../../../utility";
import { success } from "../../../utility/notification";

const defaultText = '<p><span style="color: rgb(255, 255, 255);"> </span></p>';
const Invite = () => {
  const [editorContent, setEditorContent] = useState(defaultText);
  const [languages, setLanguages] = useState([]);
  const [lang, setLang] = useState("en");
  const [id, setId] = useState("");
  const [isContent, setIsContent] = useState(false);
  useEffect(() => {
    postUrl(sitemode,"/api/server/languages", {}, (data) => {
      setLanguages(data);
    });
  }, []);
  const onLangChange = (lang) => setLang(lang);
  const { logout , sitemode } = useAuth();
  const handleChange = (value) => {
    setEditorContent(value);
  };

  useEffect(() => {
    postUrl(sitemode,
      "/api/resource/get",
      { lang, name: "invite" },
      (data) => {
        if (data.lang === lang) {
          setEditorContent(data.text);
          setIsContent(true);
          setId(data._id);
        } else {
          setEditorContent(defaultText);
          setIsContent(false);
          setId(undefined);
        }
      },
      logout,
    );
  }, [lang]);

  const handleSave = () => {
    postUrl(sitemode,
      isContent ? "/api/resource/update" : "/api/resource/create",
      { lang, text: editorContent, name: "invite", id },
      (data) => {
        success("Your action is applied successfully");
      },
      logout,
    );
  };

  return (
    <div className="mt-4">
      <p className="text-[2em]  font-extrabold text-center">Invite</p>
      <Select
        className="min-w-40 "
        showSearch
        placeholder="Select an language"
        optionFilterProp="label"
        onChange={onLangChange}
        value={lang}
        options={[
          ...Object.keys(languages).map((key) => ({
            value: languages[key].lang,
            label: languages[key].label,
          })),
        ]}
      />
      <ReactQuill
        className="mt-3"
        value={editorContent}
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
    </div>
  );
};

export default Invite;
