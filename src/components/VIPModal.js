import { Checkbox, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { normalColors } from "../constants/color";
import { isEmpty, isNumber, postUrl } from "../utility";
import { success, warning } from "../utility/notification";
import { useAuth } from "../context/AuthContext";

const { Option, OptGroup } = Select;

export default ({
  open = false,
  mode = "Add",
  data = {},
  onClose = (f) => f,
  refreshList = (f) => f,
}) => {
  const [postData, setPostData] = useState({ ...data });
  const { sitemode } = useAuth()
  useEffect(() => {
    if (open) setPostData({ ...data });
  }, [open]);

  const saveVIP = () => {
    if (isEmpty(postData?.level)) {
      warning("Insert VIP Level!!");
      return;
    }
    if (isEmpty(postData?.score)) {
      warning("Insert VIP Level!!");
      return;
    }
    if (
      !isNumber(postData?.score) &&
      (!isNumber(postData?.score.slice(0, -1)) ||
        (postData?.score.slice(-1).toUpperCase() !== "M" &&
          postData?.score.slice(-1).toUpperCase() !== "K"))
    ) {
      warning(
        "Insert Score correctly! It must be a Number and a Number with K or M!",
      );
      return;
    }
    postUrl(sitemode,"/api/vip/save", postData, (result) => {
      success(result.message);
      refreshList();
      onClose();
    });
  };

  return (
    <Modal
      open={open}
      title={mode + " VIP Level"}
      onCancel={onClose}
      okText="Save"
      onOk={saveVIP}
    >
      <div className="flex flex-col gap-2 items-center justify-start w-full">
        <div className="w-full flex flex-col gap-1">
          <label>VIP Level</label>
          <Input
            value={postData?.level || ""}
            onChange={(e) =>
              setPostData((prev) => ({ ...prev, level: e.target.value }))
            }
          />
        </div>
        <div className="w-full flex flex-col gap-1">
          <label>Score</label>
          <Input
            value={postData?.score || ""}
            onChange={(e) =>
              setPostData((prev) => ({ ...prev, score: e.target.value }))
            }
          />
        </div>
        <div className="w-full flex flex-col gap-1">
          <label>Label</label>
          <Input
            value={postData?.label || ""}
            onChange={(e) =>
              setPostData((prev) => ({ ...prev, label: e.target.value }))
            }
          />
        </div>
        <div className="w-full flex flex-col gap-1">
          <label>Merge Previous</label>
          <Checkbox
            checked={postData?.batch || ""}
            onChange={(e) =>
              setPostData((prev) => ({ ...prev, batch: e.target.checked }))
            }
          />
        </div>
        {!postData?.batch && (
          <>
            <div className="w-full flex flex-col gap-1">
              <label>Color</label>
              <div className="relative w-full flex flex-col items-center justify-center">
                <div
                  className={`bg-${postData?.color || "transparent"} w-[calc(100%-2px)] my-[2px] pointer-events-none h-[30px] absolute rounded-[3px]`}
                ></div>
                <Select
                  className="w-full color-pick-selector"
                  value={postData?.color || ""}
                  onChange={(val) =>
                    setPostData((prev) => ({ ...prev, color: val }))
                  }
                  showSearch
                  placeholder="Select a person"
                  filterOption={(input, option) =>
                    (option?.value ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {normalColors.map(({ label, children }, i) => (
                    <OptGroup key={i} label={label}>
                      {children.map((color, j) => (
                        <Option key={j} value={color}>
                          <div className={`w-full h-full bg-${color}`}></div>
                        </Option>
                      ))}
                    </OptGroup>
                  ))}
                </Select>
              </div>
            </div>

            <div className="w-full flex flex-col gap-1">
              <label>Benifits</label>
              {[...(postData?.benifits || []), ""].map((benifit, index) => (
                <div className="flex items-center flex-row gap-2 w-full">
                  <span className={`text-${postData?.color} text-xl`}>
                    <i className="fa fa-check-circle"></i>
                  </span>
                  <Input
                    key={index}
                    value={benifit || ""}
                    onChange={(e) => {
                      setPostData((prev) => {
                        const temp = [...(prev.benifits || [])];
                        temp[index] = e.target.value;
                        return { ...prev, benifits: [...temp] };
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
