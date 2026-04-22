import { Button, Modal, Table } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { success } from "toastr";
import { USER_ROLE } from "../constants";
import { useAuth } from "../context/AuthContext";
import { postUrl } from "../utility";
import { warning } from "../utility/notification";
import { getFilterColumns } from "../utility/table";
import AddBonusModal from "./AddBonusModal";

const { confirm } = Modal;

const BonusManage = ({ type, columns = [] }) => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedData, setSelectedData] = useState({});
  const { auth, logout, sitemode, prices, siteCurrency } = useAuth();
  
  const _columns = [
    {
      title: "Level",
      dataIndex: "level",
      width: "4em",
      align: "center",
      type: "number",
      required: true,
      sorter: (a, b) => a.level - b.level,
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "Name",
      width: "8em",
      dataIndex: "name",
      align: "center",
      type: "text",
      required: true,
      sorter: (a, b) => a.name > b.name,
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "PointsRequired($)",
      dataIndex: "pointsRequired",
      width: "12em",
      type: "number",
      sorter: (a, b) => a.pointsRequired - b.pointsRequired,
      render: (data) => "$" + data,
      required: true,
      className: "text-xs sm:text-sm md:text-base",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value, all) => (
        <>
          {value.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
            useGrouping: true,
          })} &nbsp;
          $
        </>
      ),
    },
    {
      title: "PointsRequired(" + (prices[siteCurrency] ? siteCurrency: "USD") + ")",
      dataIndex: "pointsRequired",
      width: "12em",
      type: "number",
      sorter: (a, b) => a.pointsRequired - b.pointsRequired,
      render: (data) => "$" + data,
      required: true,
      mode: 'calc',
      className: "text-xs sm:text-sm md:text-base",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value, all) => (
        <>
          {(value/(prices[siteCurrency]?prices[siteCurrency]: 1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
            useGrouping: true,
          })} &nbsp;
          {
            (prices[siteCurrency]? siteCurrency: "USD")
          }
        </>
      ),
    },
    {
      title: "FixedReward($)",
      dataIndex: "fixedReward",
      width: "12em",
      type: "number",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value, all) => (
        <>
          {value.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
            useGrouping: true,
          })} &nbsp;
          $
        </>
      ),
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "FixedReward(" + (prices[siteCurrency]?siteCurrency: "USD") + ")",
      dataIndex: "fixedReward",
      width: "12em",
      type: "number",
      align: "right",
      mode: 'calc',
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      render: (value, all) => (
        <>
          {(value/(prices[siteCurrency]?prices[siteCurrency]: 1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
            useGrouping: true,
          })} &nbsp;
          {
           prices[siteCurrency]? siteCurrency: 1
        }
        </>
      ),
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "RewardPercentage",
  
      dataIndex: "rewardPercentage",
      type: "number",
      width: "6em",
      render: (data) => data + "%",
      className: "text-xs sm:text-sm md:text-base",
      align: "right",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Description",
      dataIndex: "description",
      type: "textarea",
      width: "20em",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
      className: "text-xs sm:text-sm md:text-base",
      isFilter: true,
    },
  ];
  const tableColumns = useMemo(
    () => getFilterColumns(columns.length ? columns : _columns),
    [type, columns],
  );

  const getData = () =>
    postUrl(sitemode,
      "/api/bonus/get",
      { bonusType: type },
      (d) => setData(d.map((v, index) => ({ ...v, key: v._id }))),
      logout,
    );

  const deletePlans = () => {
    let count = selectedRowKeys.length;
    postUrl(sitemode,
      "/api/bonus/delete",
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
  }, [type]);

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  return (
    <>
      {auth.user.role === USER_ROLE.ADMIN && (
        <div className="w-full flex justify-end">
          <Button.Group>
            <Button
              color="primary"
              icon={<i className="fa fa-plus"></i>}
              variant="solid"
              className="w-[6em]"
              onClick={() => {
                setVisible(true);
                setSelectedData(null);
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
                  onCancel() {},
                });
              }}
            >
              Delete
            </Button>
          </Button.Group>
        </div>
      )}
      <Table
        bordered
        className="w-full mt-3 text-[0.9em]"
        scroll={{ y: window.innerHeight - 250 }}
        rowSelection={auth.user.role === USER_ROLE.ADMIN ? rowSelection : null}
        size="small"
        dataSource={data}
        loading={data === null}
        pagination={{ size: "default" }}
        columns={tableColumns}
      />
      <AddBonusModal
        getData={getData}
        setSelectedData={setSelectedData}
        selectedData={selectedData}
        visible={visible}
        setVisible={setVisible}
        bonusType={type}
        columns={tableColumns}
      />
    </>
  );
};

export default BonusManage;
