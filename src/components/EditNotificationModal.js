import { Form, Input, Modal } from "antd";
import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { postUrl } from "../utility";
import { success } from "../utility/notification";

const EditNotificationModal = ({
  open = false,
  onClose = (f) => f,
  selectedData = null,
  setSelectedData = (f) => f,
  getData = (f) => f,
}) => {
  const { logout, sitemode } = useAuth();
  const [form] = Form.useForm();
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (selectedData) {
          postUrl(sitemode,
            "/api/notification/update",
            { ...values, id: selectedData._id },
            () => {
              onClose();
              getData();
              success("Update plan suceessfully.");
            },
            logout,
          );
        } else {
          postUrl(sitemode,
            "/api/notification/create",
            values,
            () => {
              onClose();
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
    onClose();
    setSelectedData(null);
  };
  useEffect(() => {
    form.setFieldsValue(selectedData);
  }, [selectedData, form]);
  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      title={selectedData ? "Update" : "Add"}
    >
      <Form
        form={form}
        layout="vertical"
        name="addForm"
        initialValues={
          selectedData
            ? selectedData
            : {
                username: "all",
                title: "",
                message: "",
              }
        }
      >
        <Form.Item
          name="username"
          label="To"
          rules={[{ required: true, message: "Please input the username!" }]}
        >
          <Input placeholder='Enter "all" to everyone' />
        </Form.Item>
        <Form.Item name="title" label="Title">
          <Input placeholder="Enter title" />
        </Form.Item>
        <Form.Item
          name="message"
          label="Message"
          rules={[{ required: true, message: "Please input the message!" }]}
        >
          <Input placeholder="Enter message" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditNotificationModal;
