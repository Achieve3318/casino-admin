
import { Button, Checkbox, Modal, Table } from "antd";
import React, { useEffect, useReducer, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { success, warning } from "../../../../utility/notification";
import { getFilterColumns } from "../../../../utility/table";
import FiatModal from "./FiatModal";
import postUrl2Pro from "../../../../utility/postUrl2Pro";

const { confirm } = Modal;
const pageSizeOptions = [10, 20, 50, 100, 500];

const Fiat = ({ getData = (f) => f, data = [], loading = false }) => {
  const [visible, setVisible] = useState(false);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [selectedData, setSelectedData] = useState({});
  const { logout , prices, siteCurrency } = useAuth();
  const [refresh, setRefresh] = useReducer((f) => !f);
  const columns = getFilterColumns([
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      align: "center",
      sorter: (a, b) => (b.name > a.name ? 1 : -1),

      width: "8em",
      isFilter: true,
    },
    {
      title: "Symbol",
      dataIndex: "symbol",
      key: "symbol",
      sorter: (a, b) => (b.symbol > a.symbol ? 1 : -1),

      align: "center",
      width: "8em",
    },
    {
      title: "Country",
      dataIndex: "chain",
      sorter: (a, b) => (b.chain > a.chain ? 1 : -1),
      key: "chain",
      align: "center",
      width: "10em",
      isFilter: true,
    },
    {
      title: "Price($)",
      dataIndex: "price",
      sorter: (a, b) => (b.price > a.price ? 1 : -1),
      key: "price",
      type:"number",
      align: "center",
      width: "8em",
      render: (value, all) => (
        <>
          {(value || 0).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 10,
            useGrouping: true,
          })}
        </>
      ),
    },
    {
      title: "Price("+siteCurrency+")",
      dataIndex: "price",
      sorter: (a, b) => (b.price > a.price ? 1 : -1),
      key: "price",
      type:"number",
      align: "center",
      width: "8em",
      render: (value, all) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 10,
            useGrouping: true,
          }) + " " + (prices[siteCurrency]?siteCurrency:"USD")}
        </>
      ),
    },
    {
      title: "Fee",
      dataIndex: "fee",
      sorter: (a, b) => (b.fee > a.fee ? 1 : -1),
      key: "fee",
      type:"number",
      align: "center",
      width: "8em",
    },
    {
      title: "Min",
      dataIndex: "min",
      sorter: (a, b) => (b.min > a.min ? 1 : -1),
      key: "min",
      type:"number",
      align: "center",
      width: "8em",
    },
    {
      title: "Max",
      dataIndex: "max",
      sorter: (a, b) => (b.max > a.max ? 1 : -1),
      key: "max",
      type:"number",
      align: "center",
      width: "8em",
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: "10em",
      render: (image) =>
        image ? (
          <img
            src={process.env.REACT_APP_PROVIDER_URL + "/" + image}
            alt="Token"
            style={{ width: 30, height: 30 }}
          />
        ) : (
          "No Image"
        ),
      align: "center",
    },
    
  ]);

  const deletePlans = () => {
    let count = selectedRowKeys.length;
    postUrl2Pro(
      "/api/fiat/delete",
      { ids: selectedRowKeys },
      () => {
        success(count + " rows is deleted.");
        setRefresh();
      },
      logout,
    );
  };

  useEffect(() => {
    getData();
  }, [refresh]);

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  return (
    <>
      <p className="text-[20px] font-bold">Fiat</p>
      <div className="w-full flex justify-end">
        <Button.Group>
          <Button
            color="primary"
            variant="solid"
            className="w-[6em]"
            icon={<i className="fa fa-plus"></i>}
            onClick={() => {
              setSelectedData({
                name: undefined,
                symbol: undefined,
                chain: undefined,
                price: undefined,
              });
              setVisible(true);
            }}
          >
            Add
          </Button>
          <Button
            color="pink"
            variant="solid"
            icon={<i className="fa fa-pencil"></i>}
            className="w-[6em]"
            onClick={() => {
              if (selectedRowKeys.length > 1) {
                warning("You can change only one row.");
                return;
              }
              if (selectedRowKeys.length === 0) {
                warning("You have to select row.");
                return;
              }

              setSelectedData(
                data.filter((v) => v._id === selectedRowKeys[0])[0],
              );
              setVisible(true);
            }}
          >
            Update
          </Button>
          <Button
            color="danger"
            variant="outlined"
            icon={<i className="fa fa-trash"></i>}
            className="w-[6em]"
            onClick={() => {
              if (selectedRowKeys.length === 0) {
                warning("You have to select row.");
                return;
              }
              confirm({
                title: "Do you want to delete these items?",
                content: "Once deleted, the items cannot be recovered.",
                okText: "Yes",
                okType: "danger",
                cancelText: "No",
                onOk() {
                  deletePlans();
                },
                onCancel() { },
              });
            }}
          >
            Delete
          </Button>
        </Button.Group>
      </div>
      <Table
        bordered
        className="w-full mt-3 text-[0.9em]"
        scroll={{ x: "auto" }}
        rowSelection={rowSelection}
        size="small"
        loading={loading}
        dataSource={data}
        pagination={{ size: "default" }}
        columns={columns}
      />
      <FiatModal
        addApi="/api/fiat/create"
        updateApi="/api/fiat/update"
        getData={getData}
        setRefresh={setRefresh}
        setSelectedData={setSelectedData}
        selectedData={selectedData}
        visible={visible}
        setVisible={setVisible}
        columns={columns}
      />
    </>
  );
};

export default Fiat;
