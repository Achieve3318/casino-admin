import { HolderOutlined } from "@ant-design/icons";
import { DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Table } from "antd";
import React, { useContext, useEffect, useMemo, useState } from "react";
import Drawer from "../../../../components/common/Drawer";
import { useAuth } from "../../../../context/AuthContext";
import postUrl2Pro from "../../../../utility/postUrl2Pro";
const RowContext = React.createContext({});
const DragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{
        cursor: "move",
      }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};
const columns = [
  {
    key: "sort",
    align: "center",
    width: 80,
    render: () => <DragHandle />,
  },
  {
    title: "Name",
    dataIndex: "_id",
  },
  {
    title: "Description",
    dataIndex: "description",
  },
];

const Row = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });
  const style = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 9999,
        }
      : {}),
  };
  const contextValue = useMemo(
    () => ({
      setActivatorNodeRef,
      listeners,
    }),
    [setActivatorNodeRef, listeners],
  );
  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};
const OrderModal = ({
  drawerOpen = false,
  onOpenChange = (f) => f,
  setRefresh = (f) => f,
}) => {
  const { logout , sitemode } = useAuth();
  const [dataSource, setDatasource] = useState([]);

  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setDatasource((prevState) => {
        const activeIndex = prevState.findIndex(
          (record) => record._id === active?.id,
        );
        const overIndex = prevState.findIndex(
          (record) => record._id === over?.id,
        );
        return arrayMove(prevState, activeIndex, overIndex);
      });
    }
  };
  useEffect(() => {
    postUrl2Pro("/api/coin/list", {}, (data) => setDatasource(data), logout);
  }, [logout]);

  const handleSubmit = () => {
    postUrl2Pro(
      "/api/coin/changeViewOrder",
      { order: dataSource.map(({ _id }, i) => ({ viewOrder: i, name: _id })) },
      (data) => {
        if (data.message === "success") {
          onOpenChange(false);
          setRefresh();
        }
      },
      logout,
    );
  };
  return (
    <Drawer
      title={"Change Order View"}
      open={drawerOpen}
      onClose={() => onOpenChange(false)}
      onOK={handleSubmit}
    >
      <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
        <SortableContext
          items={dataSource.map((i) => i._id)}
          strategy={verticalListSortingStrategy}
        >
          <Table
            rowKey="_id"
            components={{
              body: {
                row: Row,
              },
            }}
            columns={columns}
            dataSource={dataSource}
            pagination={false}
          />
        </SortableContext>
      </DndContext>
    </Drawer>
  );
};

export default OrderModal;
