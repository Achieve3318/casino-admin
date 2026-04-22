import { Modal, notification, Select } from "antd";
import React, { useEffect, useReducer, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import postUrl from "../../../utility/postUrl";
import { PlusCard } from "../Description/card";
import CarouselCard from "./card";
import EditModal from "./modal";

const Carousel = () => {
  const [languages, setLanguages] = useState([]);
  const [lang, setLang] = useState("all");
  const [refresh, setRefresh] = useReducer((f) => !f);
  const [modal, setModal] = useState({ open: false, data: null });
  const { logout , sitemode } = useAuth();

  const [data, setData] = useState([]);

  useEffect(() => {
    postUrl(sitemode,"/api/server/languages", {}, (data) => setLanguages(data));
  }, []);

  useEffect(() => {
    postUrl(sitemode,
      "/api/resource/getList",
      {
        name: "carousel",
        lang: lang === "all" ? "" : lang,
      },
      (data) => setData(data),
      logout,
    );
  }, [lang, logout, refresh]);

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
        if (data.message === "NOTIFICATIONS.success.Deleted") {
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
        {(data || []).sort((a, b) => a.title - b.title).map((data) => (
          <div className="p-5" key={data._id}>
            <CarouselCard
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
        languages={languages}
      />
    </>
  );
};

export default Carousel;
