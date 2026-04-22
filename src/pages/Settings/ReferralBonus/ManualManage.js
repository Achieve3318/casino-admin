import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Input, Modal, notification, Radio, Switch, Table } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { BONUS_TYPE } from "../../../constants/bonus";
import { blockedEmail, postUrl } from "../../../utility";
import { getFilterColumns } from "../../../utility/table";
import HiddenUsername from "../../../utility/hiddenEmail";
import { USER_ROLE } from "../../../constants";
import { useAuth } from "../../../context/AuthContext";

const pageSizeOptions = [10, 20, 50, 100];

const ManualEditModal = ({
  open = false,
  id = 0,
  data = {},
  onClose = (f) => f,
  plans = [],
  refetch = (f) => f,
}) => {
  const [comType, setComType] = useState(null);
  const [commission, setCommission] = useState(0);
  const [isActive, setActive] = useState(null);
  const { auth , sitemode } = useAuth();

  const handleChangeCommissionType = (value) => {
    setComType(value);
  };

  const handleSubmit = () => {
    postUrl(sitemode,
      "/api/referral/updateReferralOpt",
      {
        username: data.username,
        commission: comType === "Default" ? null : commission,
        isActive,
      },
      (data) => {
        if (data.message === "success") {
          notification.success({
            message: "Success",
            description: "Edit Bonus Options Successfully",
          });
          refetch();
          onClose();
        }
      },
    );
  };

  useEffect(() => {
    if (data.commission === undefined || data.isActive === undefined) return;
    if (data.commission === null) setComType("Default");
    else setComType("Manual");
    setActive(data.isActive);
  }, [data]);

  useEffect(() => {
    if (comType === "Default") {
      const selPlan = plans.filter((plan) => plan.level === data.level);
      if (selPlan.length) {
        setCommission(selPlan[0].rewardPercentage);
      }
    } else if (comType === "Manual") {
      setCommission(data.commission);
    }
  }, [comType]);

  if (data.commission === undefined || data.isActive === undefined) return;

  return (
    <Modal
      title={'Edit Referral Bonus   "' + (auth?.user?.role === USER_ROLE.ADMIN ? data.username : HiddenUsername(data?.username)) + '"'}
      centered
      open={open}
      onClose={onClose}
      onCancel={onClose}
      onOk={handleSubmit}
    >
      <div className="">
        <div className="mt-5 flex justify-between items-center">
          <div>Level</div>
          <div className="flex-[0.75]">{data.level}</div>
        </div>
        <div className="mt-5 flex justify-between items-center">
          <div>Commission</div>
          <div className="flex justify-between">
            <Radio.Group
              block
              options={["Default", "Manual"]}
              value={comType}
              optionType="button"
              buttonStyle="solid"
              onChange={(e) => handleChangeCommissionType(e.target.value)}
            />
            <Input
              type="number"
              disabled={comType === "Default"}
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-between items-end">
          <div>Active</div>
          <div className="flex-[0.75]">
            <Switch
              checkedChildren={<CheckOutlined />}
              unCheckedChildren={<CloseOutlined />}
              value={isActive}
              onChange={(e) => setActive(e)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default function ReferralManualManage() {
  const [refresh, setRefresh] = useReducer((f) => !f);
  const [plans, setPlans] = useState([]);

  const [editModal, setEditModal] = useState({
    open: false,
    id: 0,
    data: {},
  });
  const [data, setData] = useState(null);

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: pageSizeOptions[0],
      total: 0,
      pageSizeOptions,
      showQuickJumper: true,
      showSizeChanger: true,
    },
    filters: {},
    sorter: {},
  });

  const { auth, blockLists , sitemode } = useAuth();

  const _columns = getFilterColumns([
    ...(auth?.user?.role === USER_ROLE.ADMIN
      ? [
        {
          title: "ID",
          dataIndex: "_id",
          width: "15em",
          align: "center",
        },
      ]
      : []),
    {
      title: "Username",
      width: "20em",
      dataIndex: "username",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      fixed: "left",
      isFilter: true,
      render: (text) => blockedEmail(auth?.user?.role === USER_ROLE.ADMIN ? text : HiddenUsername(text), blockLists),
    },
    {
      title: "Number Of Friends",
      width: "15em",
      dataIndex: "friends",
      align: "center",

      type: "number",
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "Level",
      width: "7em",
      dataIndex: "level",
      align: "center",

      type: "number",
      sorter: true,
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "Pending amount",
      dataIndex: "amount",
      width: "16em",
      render: (a) => <>${a}</>,
      align: "center",

      sorter: true,
      type: "number",
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "Commission",
      dataIndex: "commission",
      width: "10em",
      align: "center",

      type: "number",
      render: (data) => (data === null ? "default" : Number(data).toFixed(8)),
      className: "text-xs sm:text-sm md:text-base",
    },
    {
      title: "Active",
      dataIndex: "isActive",
      width: "10em",
      className: "text-xs sm:text-sm md:text-base",
      align: "center",
      isFilter: true,
      render: (data) => (data ? "Active" : "Dismissed"),
    },
    {
      title: "Action",
      dataIndex: "x",
      key: "10em",
      align: "center",
      fixed: "right",
    },
  ]);

  const handleTableChange = useCallback(
    debounce((pagination, filters, sorter) => {
      setTableParams({
        ...tableParams,
        pagination,
        filters,
        sorter,
      });
    }, 300),
    [tableParams]
  );

  const fetchDataCount = () => {
    postUrl(sitemode,
      "/api/referral/getReferralBalanceAllCount",
      {
        filters: tableParams.filters,
      },
      (data) =>
        setTableParams((prev) => ({
          ...prev,
          pagination: { ...prev.pagination, total: data },
        })),
    );
  };
  const fetchData = () => {
    postUrl(sitemode,
      "/api/referral/getReferralBalanceAll",
      {
        page: tableParams.pagination.current - 1,
        pageSize: tableParams.pagination.pageSize,
        filters: tableParams.filters,
        sorter: tableParams.sorter,
      },
      (data) => setData(data),
    );
  };
  useEffect(fetchDataCount, [tableParams.filters]);
  useEffect(
    fetchData,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      tableParams.filters,
      tableParams.sorter,
      tableParams.pagination.current,
      tableParams.pagination.pageSize,
      refresh,
    ],
  );

  useEffect(() => {
    postUrl(sitemode,"/api/bonus/get", { bonusType: BONUS_TYPE.Referral }, (data) => {
      setPlans(data);
    });
  }, []);

  const handleEditClick = (id, data) => {
    setEditModal({ open: true, id, data });
  };

  const handleClose = () => {
    setEditModal({ open: false, id: 0, data: {} });
  };

  const columns = useMemo(
    () =>
      _columns.map((col) =>
        col.dataIndex === "x"
          ? {
            ...col,
            render: (_, row) => (
              <a onClick={() => handleEditClick(row._id, row)}>Edit</a>
            ),
          }
          : col,
      ),
    [_columns],
  );
  return (
    <>
      <Table
        columns={columns}
        loading={data === null}
        scroll={{ x: "auto" }}
        dataSource={data}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
      />
      <ManualEditModal
        {...editModal}
        onClose={handleClose}
        plans={plans}
        refetch={setRefresh}
      />
    </>
  );
}
