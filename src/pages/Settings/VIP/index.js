import { Modal, Spin } from "antd";
import React, { useEffect, useReducer, useState } from "react";
import VIPModal from "../../../components/VIPModal";
import { convert2MK, postUrl } from "../../../utility";
import { success } from "../../../utility/notification";
import { useAuth } from "../../../context/AuthContext";

const VIP = () => {
  const [vipsetttings, setVIPSettings] = useState([]);
  const [refVal, refresh] = useReducer((f) => !f, false);
  const [modal, setModal] = useState({ open: false });
  const [isLoading, setLoading] = useState(true);
  const { sitemode } = useAuth()


  useEffect(() => {
    setLoading(true);
    postUrl(sitemode, "/api/vip/get", {}, (data) => {
      setVIPSettings(data);
      setLoading(false);
    });
  }, [refVal]);

  const onDel = (id) => {
    Modal.confirm({
      content: "Are you sure about deleting this?",
      title: "Delete this element",
      onOk: () => {
        postUrl(sitemode, "/api/vip/del", { id }, (data) => {
          success(data.message);
          refresh();
        });
      },
    });
  };

  return (
    <div className="mt-4">
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center">
          {" "}
          <Spin tip="Loading" size="large"></Spin>
        </div>
      )}
      {!isLoading && (
        <div className="flex flex-wrap">
          {vipsetttings.map(
            ({ _id, level, color, score, batch, benifits, label }, index) => (
              <div
                className="p-5 m-6 w-[260px] bg-[#001f36] min-h-[370px] float-left rounded-md  items-center justify-center relative"
                key={index}
              >
                <span className={`bg-${color} p-1 rounded-md text-[0.8em]`}>
                  {level}
                </span>
                <p className="text-[1.6em] text-white font-bold mt-2">
                  ${convert2MK(score)}
                </p>
                <p className="text-[0.8em] text-slate-400 ">{label}</p>
                <div className="mt-3">
                  {(benifits || []).map((benifit, i) => (
                    <div
                      key={i}
                      className={`flex items-center text-[1.2em] mt-2 text-${color}`}
                    >
                      <i className={`fa fa-check-circle`}></i>
                      <span className="text-white text-[0.75em] ml-2">
                        {benifit}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="w-full flex flex-col absolute bottom-0 gap-2">
                  <p
                    className={
                      " text-[0.75em] ml-2 text-" +
                      (batch ? "green-100" : "red-100")
                    }
                  >
                    {batch && (
                      <i className="fa fa-hand-o-left">
                        &nbsp;&nbsp;&nbsp;Merged Previous
                      </i>
                    )}
                    {!batch && (
                      <i className="fa fa-times">
                        &nbsp;&nbsp;&nbsp;Not Merged
                      </i>
                    )}
                  </p>
                  <p className="w-full flex flex-row -ml-5">
                    <span
                      onClick={() =>
                        setModal({
                          open: true,
                          mode: "Update",
                          data: {
                            _id,
                            level,
                            color,
                            score,
                            batch,
                            benifits,
                            label,
                          },
                        })
                      }
                      className="border-solid border-1 p-2 border-green-600 hover:border-green-400 rounded-bl-md text-green-600 w-1/2 text-center cursor-pointer"
                    >
                      <i className="fa fa-pencil"></i>
                      Edit
                    </span>
                    <span
                      onClick={() => onDel(_id)}
                      className="border-solid border-1 p-2 border-red-600  hover:border-red-400 text-red-600 w-1/2 rounded-br-md text-center cursor-pointer"
                    >
                      <i className="fa fa-trash"></i>
                      Delete
                    </span>
                  </p>
                </p>
              </div>
            ),
          )}

          <div className="flex m-6 p-5 w-[260px] h-[370px] bg-[#001f36]  float-left rounded-md  items-center justify-center relative cursor-pointer">
            <span
              onClick={() => setModal({ open: true, mode: "Add" })}
              className=" text-white font-bold text-9xl hover:text-gray-300 text-center content-center w-full h-full"
            >
              <i className="fa fa-plus"></i>
            </span>
          </div>
        </div>
      )}
      <VIPModal
        {...modal}
        onClose={() => setModal({ open: false })}
        refreshList={refresh}
      ></VIPModal>
    </div>
  );
};

VIP.displayName = 'VIP';
export default VIP;
