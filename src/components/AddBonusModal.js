import { Form, Input, InputNumber, Modal } from "antd";
import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { postUrl } from "../utility";
import { success } from "../utility/notification";

const AddBonusModal = ({
  columns,
  visible,
  setVisible,
  bonusType,
  selectedData = null,
  setSelectedData = (f) => f,
  getData = (f) => f,
}) => {
  const { logout, sitemode, siteCurrency, prices } = useAuth();
  const [form] = Form.useForm();
  const handleOk = () => {
    form
      .validateFields()
      .then((vals) => {
        const keys = Object.keys(vals)
        const filteredKyes = keys.filter((key) => !key.endsWith("calc"))
        const values = {}
        filteredKyes.forEach(key => values[key] = vals[key])
        if (selectedData) {
          postUrl(sitemode,
            "/api/bonus/update",
            { ...values, bonusType },
            (data) => {
              setVisible(false);
              getData();
              success("Update plan suceessfully.");
            },
            logout,
          );
        } else {
          postUrl(sitemode,
            "/api/bonus/create",
            { ...values, bonusType },
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

      .catch((info) => { });
  };
  const handleCancel = () => {
    setVisible(false);
    setSelectedData(null);
  };
  useEffect(() => {
    console.log( selectedData)
    if(selectedData)
    {
      const filteredColumn = columns.filter(({ mode }) => mode === "calc")
      const addition = filteredColumn.reduce((result, {dataIndex}) => {
        return ({ ...result, [dataIndex + "calc"]: selectedData[dataIndex] / (prices[siteCurrency]?prices[siteCurrency]:1)})
      }, {})
      form.setFieldsValue({...selectedData, ...addition})
    }else{
      form.setFieldsValue(selectedData);
    }
  
  }, [selectedData, form]);
  return (
    <Modal
      open={visible}
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
              level: 1,
              name: "",
              pointsRequired: 0,
              rewardPercentage: 0,
              fixedReward: 0,
              description: "",
            }
        }
      >
        {columns.map((column) => {
          if (column.mode === "calc") {
            return <Form.Item
            name={column.dataIndex+ "calc"}
            label={column.title}
            shouldUpdate = {() => true}
          >
              <InputNumber
                disabled={column.dataIndex === "level" && selectedData}
                style={{ width: "100%" }}
                onChange={(val) => {
                  // update original field as half
                  form.setFieldValue(
                    column.dataIndex, val ? val * ((prices[siteCurrency]?prices[siteCurrency]:1)) : 0,
                  );
                }}
              />
            
          </Form.Item>
          }


          return <Form.Item
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
                onChange={(value) => form.setFieldValue(column.dataIndex+ "calc", value / (prices[siteCurrency]?prices[siteCurrency]:1))}
              />
            ) : column.type === "textarea" ? (
              <Input.TextArea placeholder={"Enter " + column.title} rows={4} />
            ) : (
              <Input
                disabled={column.dataIndex === "level" && selectedData}
                style={{ width: "100%" }}
              />
            )}
          </Form.Item>
        })}
      </Form>
    </Modal>
  );
};

export default AddBonusModal;
