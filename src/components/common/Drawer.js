import { Button, Drawer, Space } from "antd";
import React from "react";

const CustomDrawer = ({
  title,
  open,
  onClose = (f) => f,
  onOK = (f) => f,
  ...props
}) => (
  <Drawer
    title={title}
    // width={720}
    onClose={onClose}
    open={open}
    styles={{
      body: {
        paddingBottom: 80,
      },
    }}
    extra={
      <Space>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onOK} type="primary">
          Save
        </Button>
      </Space>
    }
  >
    {props.children}
  </Drawer>
);
export default CustomDrawer;
