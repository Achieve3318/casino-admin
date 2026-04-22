import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Upload,
} from "antd";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { success, warning } from "../../../../utility/notification";
import postUrl2Pro from "../../../../utility/postUrl2Pro";

const CoinModal = ({
  columns,
  visible,
  setVisible,
  selectedData = null,
  complete = false,
  addApi = "",
  updateApi = "",
  isForm = false,
  network = [],
  setSelectedData = (f) => f,
  setRefresh = (f) => f,
}) => {
  const { logout } = useAuth();
  const [token, setToken] = useState("token");
  const [fileList, setFileList] = useState([
    {
      uid: "-1",
      name: "image.png",
      status: "done",
      url: "",
    },
  ]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedData?.image) {
      setFileList([
        {
          uid: "-1",
          name: "upload",
          status: "done",
          url: process.env.REACT_APP_PROVIDER_URL + "/" + selectedData.image, // ✅ Use backend image URL
        },
      ]);
    } else {
      setFileList([]); // Reset if no image exists
    }
  }, [selectedData]);

  const handleOk = (completed) => {
    form
      .validateFields()
      .then((values) => {
        const formData = new FormData();
        let sendData1 =
          selectedData && selectedData.name !== ""
            ? { ...values, id: selectedData._id }
            : { ...values };

        if (isForm) {
          Object.keys(sendData1).forEach((v) => {
            formData.append(v, sendData1[v]);
          });
          formData.append("isCompleted", completed);
          if (fileList.length > 0 && fileList[0].originFileObj) {
            formData.append("file", fileList[0].originFileObj); // ✅ Send the actual file
          }
        }
        if (
          selectedData &&
          selectedData.name !== undefined &&
          selectedData.chain !== undefined
        ) {
          postUrl2Pro(
            updateApi,
            isForm ? formData : sendData1,
            (data) => {
              setVisible(false);
              form.resetFields();
              setRefresh();
              success("Update plan suceessfully.");
            },
            logout,
          );
        } else {
          postUrl2Pro(
            addApi,
            isForm ? formData : sendData1,
            (data) => {
              setVisible(false);
              setRefresh();
              form.resetFields();
              success("Add plan suceessfully.");
            },
            logout,
          );
        }
      })

      .catch((info) => {});
  };
  const handleCancel = () => {
    setVisible(false);
    setSelectedData(null);
  };
  useEffect(() => {
    form.setFieldsValue(selectedData);
  }, [selectedData, form]);

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
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      title={selectedData && selectedData._id ? "Update" : "Add"}
      footer={
        <>
          <Button onClick={handleCancel}>Cancel</Button>
          {complete ? (
            <Button
              color="pink"
              variant="solid"
              onClick={() => {
                handleOk(false);
              }}
            >
              Draft
            </Button>
          ) : (
            ""
          )}
          <Button
            type="primary"
            onClick={() => {
              handleOk(true);
            }}
          >
            {" "}
            Save
          </Button>
        </>
      }
    >
      <>
        <Form
          className="mt-5"
          form={form}
          name="addForm"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onValuesChange={(changedValues, allValues) => {
            if (changedValues.type === "native") {
              form.setFieldsValue({ contract: "" });
            }
          }}
        >
          {columns.map((column) =>
            column.dataIndex === "isCompleted" ||
            column.dataIndex === "image" ||
            column.dataIndex === "viewOrder" ||
            column.editable === false ? (
              ""
            ) : (
              <Form.Item
                name={column.dataIndex}
                label={column.title}
                rules={[
                  {
                    required: column.required,
                    message: "Please input the " + column.title,
                  },
                  { type: column.type },
                ]}
                valuePropName={column.type === "check" ? "checked" : "value"}
              >
                {column.type === "type" ? (
                  <Select
                    onChange={(e) => {
                      setToken(e);
                    }}
                  >
                    <Select.Option key="token" value="token">
                      token
                    </Select.Option>
                    <Select.Option key="native" value="native">
                      native
                    </Select.Option>
                  </Select>
                ) : column.type === "number" ? (
                  <InputNumber style={{ width: "100%" }} />
                ) : column.type === "chain" ? (
                  <Select>
                    {network.map((v) => (
                      <Select.Option key={v._id} value={v.symbol}>
                        {v.symbol}
                      </Select.Option>
                    ))}
                  </Select>
                ) : column.type === "check" ? (
                  <Checkbox />
                ) : column.dataIndex === "contract" ? (
                  <Input
                    style={{ width: "100%" }}
                    disabled={token === "native"}
                  />
                ) : (
                  <Input style={{ width: "100%" }} />
                )}
              </Form.Item>
            ),
          )}
        </Form>
        <div className="flex">
          <div className="text-end w-1/4 pr-2">Image :</div>
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
      </>
    </Modal>
  );
};

export default CoinModal;
