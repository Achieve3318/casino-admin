import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Space } from "antd";
import React from "react";

const getFilterColumns = (columns) =>
  columns.map((column) =>
    !column.isFilter
      ? column
      : {
        ...column,
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              placeholder={`${column.title}`}
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={confirm}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Space>
              <Button
                type="primary"
                onClick={confirm}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                Search
              </Button>
              <Button
                onClick={() => {
                  clearFilters();
                  confirm();
                }}
                size="small"
                style={{ width: 90 }}
              >
                Reset
              </Button>
            </Space>
          </div>
        ),
        filterIcon: (filtered) => (
          <SearchOutlined
            style={{ color: filtered ? "#1677ff" : undefined }}
          />
        ),
        onFilter: (value, record) =>
          (record[column.dataIndex] || "").toString()
            .toLowerCase()
            .includes(value.toLowerCase()),
      },
  );

export { getFilterColumns };
