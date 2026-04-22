import { Button, Select, Upload } from "antd";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { postUrl, SUB_SITE } from "../../../utility";
import { success, warning } from "../../../utility/notification";
import axios from "axios";

const DashboardPopup = () => {
  const [fileList, setFileList] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [lang, setLang] = useState("en");
  const [id, setId] = useState("");
  const [isContent, setIsContent] = useState(false);
  const { logout, sitemode } = useAuth();

  useEffect(() => {
    postUrl(sitemode, "/api/server/languages", {}, (data) => {
      setLanguages(data);
    });
  }, []);

  const onLangChange = (lang) => setLang(lang);

  useEffect(() => {
    postUrl(
      sitemode,
      "/api/resource/get",
      { lang, name: "dashboardPopup" },
      (data) => {
        if (data && data.lang === lang) {
          if (data.image) {
            setFileList([
              {
                uid: "-1",
                name: "dashboard-popup",
                status: "done",
                url: SUB_SITE[sitemode] + "/" + data.image,
              },
            ]);
          } else {
            setFileList([]);
          }
          setIsContent(true);
          setId(data._id);
        } else {
          setFileList([]);
          setIsContent(false);
          setId(undefined);
        }
      },
      logout
    );
  }, [lang, sitemode]);

  const handleSave = () => {
    const formData = new FormData();

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("file", fileList[0].originFileObj);
    }

    formData.append("lang", lang);
    formData.append("name", "dashboardPopup");
    if (isContent && id) {
      formData.append("id", id);
      if (fileList.length === 0) {
        formData.append("clearImage", "true");
      }
    }

    const url = isContent ? "/api/resource/update" : "/api/resource/create";

    axios
      .post(SUB_SITE[sitemode] + url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        success("Your action is applied successfully");
        // Refresh the data
        postUrl(
          sitemode,
          "/api/resource/get",
          { lang, name: "dashboardPopup" },
          (data) => {
            if (data && data.lang === lang) {
              if (data.image) {
                setFileList([
                  {
                    uid: "-1",
                    name: "dashboard-popup",
                    status: "done",
                    url: SUB_SITE[sitemode] + "/" + data.image,
                  },
                ]);
              } else {
                setFileList([]);
              }
              setIsContent(true);
              setId(data._id);
            }
          },
          logout
        );
      })
      .catch((e) => {
        if ((e.response || {}).status === 401) logout && logout();
        else warning("Failed to save dashboard popup");
      });
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
    <div className="mt-4">
      <p className="text-[2em] font-extrabold text-center">Dashboard Popup</p>
      <div className="mt-4">
        <div className="mb-4">
          <label className="block mb-2">Language</label>
          <Select
            className="min-w-40"
            showSearch
            placeholder="Select a language"
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
        </div>
        <div className="mb-4">
          <label className="block mb-2">Advertisement Image</label>
          <Upload
            accept="image/*, .avif"
            beforeUpload={(file) => {
              const isImage = file.type.startsWith("image/");
              if (!isImage) {
                warning("You can only upload image files!");
              }
              return false;
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
        <Button
          type="primary"
          className="float-right mt-2 min-w-[100px]"
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default DashboardPopup;

