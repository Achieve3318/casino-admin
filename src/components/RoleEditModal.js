import { Modal, notification, Select, Spin } from "antd";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { postUrl } from "../utility";

export default function BalanceModal({
  open = false,
  onClose = (f) => f,
  data = null,
  setRefresh = (f) => f,
}) {
  const [role, setRole] = useState(data?.role);
  const { logout , sitemode } = useAuth();
  const onChangeRole = () => {
    postUrl(sitemode,
      "/api/user/update",
      {
        id: data._id,
        role,
      },
      (data) => {
        if (data?.message !== "success") return;
        notification.success({
          message: "Success",
          description: "Operation Successfully proceed",
        });
        setRefresh();
        onClose();
      },
      logout,
    );
  };

  useEffect(() => {
    if (data) setRole(data.role);
  }, [data]);

  return (
    <Modal
      title="Edit User Role"
      centered
      open={open}
      onOk={onChangeRole}
      onCancel={onClose}
      width={{
        xs: "90%",
        sm: "80%",
        md: "70%",
        lg: "60%",
        xl: "50%",
        xxl: "40%",
      }}
    >
      {data ? (
        <Select
          className="w-24"
          defaultValue={role}
          onChange={(value) => setRole(value)}
          value={role}
          options={[
            { value: "Admin", label: "ADMIN" },
            { value: "Common", label: "USER" },
          ]}
        />
      ) : (
        <Spin />
      )}
    </Modal>
  );
}
