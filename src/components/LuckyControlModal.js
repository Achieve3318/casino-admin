import { Form, Input, InputNumber, Modal, Switch } from "antd";
import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { postUrl } from "../utility";
import { success } from "../utility/notification";

const LuckyControlModal = ({
  columns,
  visible,
  setVisible,
  selectedData = null,
  setSelectedData = (f) => f,
  getData = (f) => f,
}) => {
  const { logout , sitemode } = useAuth();
  const [form] = Form.useForm();
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (selectedData && selectedData.username !== "") {
          postUrl(sitemode,
            "/api/user/updateLuckyUser",
            { ...values, id: selectedData._id },
            (data) => {
              setVisible(false);
              getData();
              success("Update plan suceessfully.");
            },
            logout,
          );
        } else {
          postUrl(sitemode,
            "/api/user/createLuckyUser ",
            { ...values },
            (data) => {
              setVisible(false);
              getData();
              success("Add plan suceessfully.");
            },
            logout,
          );
        }
        form.resetFields();
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
  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      title={selectedData ? "Update" : "Add"}
    >
      <Form form={form} layout="vertical" name="addForm">
        {columns.map((column) => (
          <Form.Item
            key={column.dataIndex}
            name={column.dataIndex}
            label={column.title}
            rules={[
              {
                required: column.required,
                message: "Please input the " + column.title,
              },
              { type: column.type },
            ]}
          >
            {column.type === "number" ? (
              <InputNumber
                disabled={column.dataIndex === "level" && selectedData}
                style={{ width: "100%" }}
              />
            ) : column.type === "textarea" ? (
              <Input.TextArea placeholder={"Enter " + column.title} rows={4} />
            ) : column.type === "switch" ? (
              <Switch />
            ) : (
              <Input
                disabled={column.dataIndex === "level" && selectedData}
                style={{ width: "100%" }}
              />
            )}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
};

export default LuckyControlModal;
