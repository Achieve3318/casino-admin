import { Button, Checkbox, Modal, Table, Tag } from "antd";
import React, { useEffect, useReducer, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { dateFormat } from "../../../../utility/date";
import { success, warning } from "../../../../utility/notification";
import CoinModal from "./CoinModal";
import OrderModal from "./OrderModal";
import postUrl2Pro from "../../../../utility/postUrl2Pro";

const { confirm } = Modal;

const Coins = ({
  getData = (f) => f,
  data = [],
  network = [],
  loading = false,
}) => {
  const [refresh, setRefresh] = useReducer((f) => !f);
  const [visible, setVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedData, setSelectedData] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { logout , siteCurrency, prices } = useAuth();
  const columns = ([
    {
      title: "Complete",
      dataIndex: "isCompleted",
      width: "7em",
      key: "isCompleted",
      type: "check",
      align: "center",
      sorter: (a, b) =>
        Number(b.isCompleted ?? false) - Number(a.isCompleted ?? false),
      filters: [
        { text: "true", value: true },
        { text: "false", value: false },
      ],
      onFilter: (value, record) =>
        (record.isCompleted === undefined ? false : record.isCompleted) ===
        value,
      render: (v) => (
        <Tag color={v === true ? "green" : "red"}>
          {v === true ? "Completed" : "Not"}
        </Tag>
      ),
      fixed: "left",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      align: "center",
      sorter: (a, b) => (b.name > a.name ? 1 : -1),
      width: "8em",
      isFilter: true,
      fixed: "left",
    },
    {
      title: "Symbol",
      dataIndex: "symbol",
      key: "name",
      align: "center",
      sorter: (a, b) => (b.symbol > a.symbol ? 1 : -1),
      width: "8em",
      isFilter: true,
    },
    {
      title: "Price ($)",
      dataIndex: "price",
      sorter: (a, b) => (b.price > a.price ? 1 : -1),

      editable: false,
      width: "20em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, all) => (
        <>
          {(value || 0).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 5,
            useGrouping: true,
          })}
        </>
      ),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: `Price (${siteCurrency})`,
      dataIndex: "price",
      sorter: (a, b) => (b.price > a.price ? 1 : -1),

      editable: false,
      width: "40em",
      className: "text-xs sm:text-sm md:text-base",
      render: (value, all) => (
        <>
          {((value || 0)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 5,
            useGrouping: true,
          }) + " " + (prices[siteCurrency]?siteCurrency:"USD")}
        </>
      ),
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Updated Time",
      dataIndex: "updated",
      editable: false,

      width: "10em",
      render: (v) => v? dateFormat(v): '',
      align: "center",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      align: "center",
      width: "18em",
    },
    {
      title: "Chain",
      dataIndex: "chain",
      key: "chain",
      align: "center",
      type: "chain",
      sorter: (a, b) => (b.chain > a.chain ? 1 : -1),
      width: "10em",
      isFilter: true,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      type: "type",
      align: "center",
      width: "10em",
      sorter: (a, b) => (b.type > a.type ? 1 : -1),
      filters: [
        { text: "token", value: "token" },
        { text: "native", value: "native" },
      ],
      onFilter: (value, record) => record.type === value,
      render: (v) =>
        v === "token" ? (
          <Tag color="red">{v}</Tag>
        ) : (
          <Tag color="blue">{v}</Tag>
        ),
    },
    {
      title: "Contract",
      dataIndex: "contract",
      width: "20em",
      key: "contract",
      render: (contract) => (
        <span style={{ fontSize: "12px", color: "#888" }}>{contract}</span>
      ),
      align: "center",
      sorter: (a, b) => (b.contract > a.contract ? 1 : -1),
    },
    {
      title: "Digits",
      dataIndex: "digits",
      key: "digits",
      align: "center",
      sorter: (a, b) => (b.digits || 0) * 1 > (a.digits || 0) * 1 ? 1 : -1,
      type: "number",
      width: "10em",
    },
    {
      title: "Fee",
      dataIndex: "fee",
      width: "7em",
      key: "fee",
      type: "number",
      sorter: (a, b) => (b.fee > a.fee ? 1 : -1),
      align: "center",
    },
    {
      title: "Min",
      dataIndex: "min",
      width: "7em",
      key: "min",
      type: "number",
      sorter: (a, b) => (b.min > a.min ? 1 : -1),
      align: "center",
    },
    {
      title: "Threshold",
      dataIndex: "threshold",
      key: "threshold",
      align: "center",
      width: "10em",
      type: "number",
      render: (v, all) => (all.price ? (v * all.price).toFixed(5) + "$" : v),
    },
    {
      title: "Tatum",
      dataIndex: "digital",
      key: "digital",
      align: "center",
      sorter: (a, b) => (b.digital || "" > a.digital || "" ? 1 : -1),
      width: "15em",
      isFilter: true,
    },
    {
      title: "MoonPay",
      dataIndex: "code1",
      width: "7em",
      key: "code1",
      align: "center",
    },
    {
      title: "Swapped",
      dataIndex: "code2",
      width: "7em",
      key: "code1",
      align: "center",
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
    {
      title: "Visible",
      dataIndex: "visible",
      key: "visible",
      width: "5em",
      type: "check",
      align: "center",
      render: (visible) => <Checkbox checked={visible} />,
      filters: [
        { text: "true", value: true },
        { text: "false", value: false },
      ],
      onFilter: (value, record) =>
        (record.visible === undefined ? false : record.visible) === value,
    },
    {
      title: "Order",
      dataIndex: "viewOrder",
      key: "viewOrder",
      width: "5em",
      align: "center",
      type: "number",
      sorter: (a, b) => (b.viewOrder || 0) * 1 > (a.viewOrder || 0) * 1 ? 1 : -1,
    },
  ]);

  const deletePlans = () => {
    let count = selectedRowKeys.length;
    postUrl2Pro(
      "/api/coin/delete",
      { ids: selectedRowKeys },
      () => {
        success(count + " rows is deleted.");
        setRefresh();
      },
      logout,
    );
  };
  const showPlans = (visible = true) => {
    // let count = selectedRowKeys.length;
    postUrl2Pro(
      "/api/coin/makeVisible",
      { ids: selectedRowKeys, visible },
      () => {
        // success(count + " rows is updated.");
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
      <p className="text-[20px] font-bold">Coin</p>

      <div className="w-full flex flex-col md:flex-row justify-end items-end gap-1 md:gap-3">
        <Button.Group>
          <Button icon = {<i className="fa fa-undo"></i>}
            className="w-auto"
            onClick={() => {
              postUrl2Pro("/api/coin/refresh", (data) => setRefresh())
            }}
          >
            Refresh Price
          </Button>
          <Button
            color="primary"
            variant="solid"
            icon={<i className="fa fa-plus"></i>}
            className="w-[6em]"
            onClick={() => {
              setSelectedData({
                name: undefined,
                description: undefined,
                digital: undefined,
                type: "token",
                contract: undefined,
                image: undefined,
                chain: undefined,
                threshold: undefined,
                fee: null,
                min: null,
              });
              setVisible(true);
            }}
          >
            Add
          </Button>
          <Button
            color="pink"
            icon={<i className="fa fa-pencil"></i>}
            variant="solid"
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

          <Button
            color="green"
            variant="solid"
            icon={<i className="fa fa-sort"></i>}
            className="w-[8em]"
            onClick={() => setDrawerOpen(true)}
          >
            ViewOrder
          </Button>
          <Button
            color="blue"
            variant="solid"
            icon={<i className="fa fa-eye"></i>}
            className="w-[6em]"
            onClick={() => {
              if (selectedRowKeys.length === 0) {
                warning("You have to select row.");
                return;
              }
              showPlans(true);
            }}
          >
            Show
          </Button>
          <Button
            color="purple"
            variant="solid"
            icon={<i className="fa fa-eye-slash"></i>}
            className="w-[6em]"
            onClick={() => {
              if (selectedRowKeys.length === 0) {
                warning("You have to select row.");
                return;
              }
              showPlans(false);
            }}
          >
            Hide
          </Button>
        </Button.Group>
      </div>
      <Table
        bordered
        className="w-full mt-3 text-[0.9em]"
        scroll={{ x: "auto" }}
        rowSelection={rowSelection}
        loading={loading}
        size="small"
        dataSource={data}
        pagination={{
          size: "default",
          pageSizeOptions: [10, 20, 50],
          showSizeChanger: true,
        }}
        columns={columns}
      />
      <CoinModal
        addApi="/api/coin/create"
        updateApi="/api/coin/update"
        setRefresh={setRefresh}
        setSelectedData={setSelectedData}
        selectedData={selectedData}
        visible={visible}
        setVisible={setVisible}
        columns={columns}
        network={network}
        complete={true}
        isForm={true}
      />
      <OrderModal
        drawerOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        setRefresh={setRefresh}
      />
    </>
  );
};

export default Coins;
