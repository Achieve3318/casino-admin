
import { Button, Checkbox, Modal, Table } from "antd";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { success, warning } from "../../../../utility/notification";
import { getFilterColumns } from "../../../../utility/table";
import CoinModal from "../Coin/CoinModal";
import postUrl2Pro from "../../../../utility/postUrl2Pro";

const { confirm } = Modal;
const pageSizeOptions = [10, 20, 50, 100, 500];

const Network = ({ getData = (f) => f, data = [], loading = false }) => {
  const [visible, setVisible] = useState(false);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [selectedData, setSelectedData] = useState({});
  const { logout , sitemode } = useAuth();
  const columns = getFilterColumns([
    {
      title: "Symbol",
      dataIndex: "symbol",
      key: "symbol",
      align: "center",
      sorter: (a, b) => (b.symbol > a.symbol ? 1 : -1),

      width: "8em",
      isFilter: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (b.name > a.name ? 1 : -1),

      align: "center",
      width: "8em",
    },
    {
      title: "NativeCurrency",
      dataIndex: "nativeCurrency",
      sorter: (a, b) => (b.nativeCurrency > a.nativeCurrency ? 1 : -1),

      key: "nativeCurrency",
      align: "center",

      width: "10em",
      isFilter: true,
    },
    {
      title: "LedgerCurrency",
      dataIndex: "ledgerCurrency",
      key: "ledgerCurrency",
      align: "center",
      sorter: (a, b) => (b.ledgerCurrency > a.ledgerCurrency ? 1 : -1),

      width: "10em",
      isFilter: true,
    },
    {
      title: "CreateWalletLink",
      dataIndex: "createWalletLink",
      key: "createWalletLink",
      align: "center",
      width: "8em",
    },
    {
      title: "UsingOffchain",
      dataIndex: "usingOffchain",
      key: "usingOffchain",
      align: "center",
      width: "10em",
      filters: [
        { text: "true", value: true },
        { text: "false", value: false },
      ],
      onFilter: (value, record) =>
        (record.usingOffchain === undefined ? false : record.usingOffchain) === value,
      type: "check",
      render: (v) => <Checkbox checked={v} />,
    },
    {
      title: "Chain",
      dataIndex: "chain",
      key: "chain",
      align: "center",
      sorter: (a, b) => (b.chain > a.chain ? 1 : -1),

      width: "8em",
    },
    {
      title: "UTXO",
      dataIndex: "isUTXO",
      key: "chain",
      align: "center",
      type: "check",
      width: "6em",
      filters: [
        { text: "true", value: true },
        { text: "false", value: false },
      ],
      onFilter: (value, record) => record.isUTXO === value,

      render: (v) => <Checkbox checked={v} />,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      align: "center",
      width: "15em",
    },
    {
      title: "EVM",
      dataIndex: "isEVM",
      key: "isEVM",
      align: "center",
      type: "check",
      width: "5em",
      filters: [
        { text: "true", value: true },
        { text: "false", value: false },
      ],
      onFilter: (value, record) => record.isEVM === value,
      render: (v) => <Checkbox checked={v} />,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      align: "center",
      type: "number",
      sorter: (a, b) =>  (b.type ?? -1) * 1 > (a.type ?? -1) * 1 ? 1 : -1,
      width: "8em",
      isFilter: true,
    },
  ]);

  const deletePlans = () => {
    let count = selectedRowKeys.length;
    postUrl2Pro(
      "/api/chain/delete",
      { ids: selectedRowKeys },
      () => {
        success(count + " rows is deleted.");
        getData();
      },
      logout,
    );
  };

  useEffect(() => {
    getData();
  }, []);

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  return (
    <>
      <p className="text-[20px] font-bold">Chain</p>
      <div className="w-full flex justify-end">
        <Button.Group>
          <Button
            color="primary"
            variant="solid"
            className="w-[6em]"
            icon={<i className="fa fa-plus"></i>}
            onClick={() => {
              setSelectedData({
                name: "",
                symbol: "",
                nativeCurrency: "",
                ledgerCurrency: "",
                createWalletLink: "",
                usingOffchain: false,
                chain: "",
                isUTXO: false,
                description: "",
                isEVM: false,
                type: null,
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
      <CoinModal
        addApi="/api/chain/create"
        updateApi="/api/chain/update"
        getData={getData}
        setSelectedData={setSelectedData}
        selectedData={selectedData}
        visible={visible}
        setVisible={setVisible}
        columns={columns}
      />
    </>
  );
};

export default Network;
