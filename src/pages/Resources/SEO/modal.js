import { Input, Modal, notification, Select, Upload } from "antd";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { warning } from "../../../utility/notification";
import postUrl from "../../../utility/postUrl";
import { SUB_SITE } from "../../../utility";

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
  const [fileList, setFileList] = useState([]);

  const [_game, setGame] = useState("dice");
  const [_lang, setLang] = useState("en");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [urli, setUrl] = useState("");
  const { logout , sitemode } = useAuth();
  useEffect(() => {
    if (data?.image) {
      setFileList([
        {
          uid: "-1",
          name: "upload",
          status: "done",
          url: SUB_SITE[sitemode] + "/" + data.image,
        },
      ]);
    } else {
      setFileList([]); // Reset if no image exists
    }
  }, [data]);

  useEffect(() => {
    setGame((data || {}).game);
    setLang((data || {}).lang);
    setUrl(((data || {}).description || {}).url);
    setTitle((data || {}).title);
    setText((data || {}).text);
  }, [data]);

  useEffect(() => {
    if (!_lang || !_game || _lang === "undefined" || _game === "all") return;
    const defaultURL = `/${_lang}/casino/games/${_game}`;
    setUrl(defaultURL);
  }, [_game, _lang]);

  const handleSubmit = () => {
    const formData = new FormData();

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("file", fileList[0].originFileObj); // ✅ Send the actual file
    }

    formData.append("title", title);
    formData.append("description", JSON.stringify({ url: urli }));
    if (!(data && data._id)) {
      formData.append("name", "SEO");
    } else {
      formData.append("id", data._id);
    }
    formData.append("text", text);
    formData.append("game", _game);
    formData.append("lang", _lang);

    const url =
      data && data._id ? "/api/resource/update" : "/api/resource/create";

    postUrl(sitemode,
      url,
      formData, // ✅ Send FormData directly
      (response) => {
        notification.success({
          message: "Success",
          description: `You successfully ${data ? "updated" : "created"}.`,
        });
        onClose();
        setGame("");
        setLang("");
        setUrl("");
        setTitle("");
        setText("");
        setFileList([]);
        onClose(true);
      },
      logout,
    );
  };

  useEffect(() => {
    if (data) setText(data.text);
  }, [open]);

  const onChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };
  const onPreview = async (file) => {
    let src = file.url;

    if (!src && file.originFileObj) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }

    const imgWindow = window.open(src);
    if (imgWindow) {
      imgWindow.document.write(`<img src="${src}" style="max-width:100%;" />`);
    }
  };

  return (
    <Modal
      title={data ? "Edit" : "Add"}
      open={open}
      onCancel={() => {
        onClose();
      }}
      onOk={handleSubmit}
    >
      <div className="flex  items-center justify-between mt-2">
        <div className="mr-3">Game</div>
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
      <div className="flex  items-center justify-between mt-2">
        <div className="mr-3">Language</div>
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
        <div className="mr-3">Image</div>
        <div className="min-w-40 w-[70%]">
          <Upload
            accept="image/*, .avif" // ✅ Allow all images + AVIF
            beforeUpload={(file) => {
              const isImage = file.type.startsWith("image/");
              if (!isImage) {
                warning("You can only upload image files!");
              }
              return false; // ✅ Ignore unsupported files
            }}
            listType="picture-card"
            fileList={fileList}
            onChange={onChange}
            onPreview={onPreview}
            maxCount={1}
          >
            {fileList.length < 1 ? "+ Upload" : "Change"}
          </Upload>
        </div>
      </div>
      <div className="flex  justify-between mt-2">
        <div className="mr-3">Title</div>
        <Input
          className="min-w-40 w-[70%]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex  justify-between mt-2">
        <div className="mr-3">URL</div>
        <Input
          className="min-w-40 w-[70%]"
          value={urli}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="flex  justify-between mt-2">
        <div className="mr-3">Text View</div>
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
