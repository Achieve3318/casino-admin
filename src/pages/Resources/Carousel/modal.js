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
  languages = {},
}) {
  const [fileList, setFileList] = useState([]);

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
  const [_lang, setLang] = useState("en");
  const [title, setTitle] = useState(1);
  const { logout , sitemode } = useAuth();

  useEffect(() => {
    setLang((data || {}).lang);
  }, [data]);


  const handleSubmit = () => {
    const formData = new FormData();

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("file", fileList[0].originFileObj); // ✅ Send the actual file
    }

    if (!(data && data._id)) {
      formData.append("name", "carousel");
    } else {
      formData.append("id", data._id);
    }
    formData.append("lang", _lang);
    formData.append("title", title);

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
        setLang("");
        setFileList([]);
        onClose(true);
      },
      logout,
    );
  };

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
        <div className="mr-3">Sort</div>
        <Input
          className="min-w-40 w-[70%]"
          value={title}
          min={1}
          type="number"
          onChange={(e) => setTitle(e.target.value)}
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
    </Modal>
  );
}
