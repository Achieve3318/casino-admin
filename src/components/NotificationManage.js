import { Button, Modal, Table } from "antd";
import React, { useEffect, useState } from "react";
import { success } from "toastr";
import { useAuth } from "../context/AuthContext";
import { postUrl } from "../utility";
import { warning } from "../utility/notification";
import { getFilterColumns } from "../utility/table";
import EditNotificationModal from "./EditNotificationModal";
import { USER_ROLE } from "../constants";

const { confirm } = Modal;



const NotificationManage = ({ type }) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedData, setSelectedData] = useState({});
  const { logout, auth , sitemode } = useAuth();

  const columns = getFilterColumns([
    ...(auth?.user?.role === USER_ROLE.ADMIN
      ? [
        {
          title: "ID",
          dataIndex: "_id",
          sorter: true,
          width: "16em",
          align: "center",
          className: "text-sm",
        },
      ]
      : []),
    {
      title: "To",
      dataIndex: "username",
      sorter: (a, b) => a.level - b.level,
      className: "text-xs sm: text-sm md:text-base",
      align: "center",
    },
    {
      title: "Title",
      dataIndex: "title",
      // width : '4em',
      sorter: (a, b) => a.level - b.level,
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
    },
    {
      title: "Message",
      dataIndex: "message",
      sorter: (a, b) => a.name > b.name,
      className: "text-xs sm:text-sm md:text-base",
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
    {
      title: "Read",
      dataIndex: "markAsRead",
      width: "10em",
      render: (data) => <>{(data || []).length}</>,
      onHeaderCell: () => ({ style: { textAlign: "center" } }),
    },
  ]);

  const getData = () => {
    postUrl(sitemode,
      "/api/notification/get",
      {},
      (d) => setData(d.map((v) => ({ ...v, key: v._id }))),
      logout,
    );
  };

  const deleteNotifications = () => {
    let count = selectedRowKeys.length;
    postUrl(sitemode,
      "/api/notification/delete",
      { ids: selectedRowKeys },
      (data) => {
        if (data?.message !== "success") return;
        success(count + " rows is deleted.");
        getData();
      },
      logout,
    );
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  useEffect(getData, []);

  return (
    <>
      <div className="w-full flex justify-end mt-4">
        <Button.Group>
          <Button
            color="primary"
            icon={<i className="fa fa-plus"></i>}
            variant="solid"
            className="w-[6em]"
            onClick={() => {
              setOpen(true);
              setSelectedData(null);
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
              setOpen(true);
            }}
          >
            Update
          </Button>
          <Button
            color="danger"
            icon={<i className="fa fa-trash"></i>}
            variant="outlined"
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
                  deleteNotifications();
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
        scroll={{ y: window.innerHeight - 250 }}
        rowSelection={rowSelection}
        size="small"
        dataSource={data}
        columns={columns}
        pagination={{ size: "default" }}
      />
      <EditNotificationModal
        getData={getData}
        setSelectedData={setSelectedData}
        selectedData={selectedData}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default NotificationManage;
