import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Card } from "antd";

export default function LangCard({
  game,
  lang,
  data,
  onEdit = (f) => f,
  onDelete = (f) => f,
}) {
  return (
    <Card
      title={
        (game === "all" ? "Game: " + data.game + "  " : "") +
        (lang === "all" ? "Lang: " + data.lang : "")
      }
      className="w-[300px]"
      actions={[
        <EditOutlined key="edit" onClick={onEdit} />,
        <DeleteOutlined key="delete" onClick={onDelete} />,
      ]}
    >
      <div className="max-h-16 overflow-y-auto">{data.text}</div>
    </Card>
  );
}

export const PlusCard = ({ onClick = (f) => f }) => {
  return (
    <Card
      className="w-[300px] h-full flex justify-center items-center hover:text-blue-600 cursor-pointer hover:border-blue-300"
      onClick={onClick}
    >
      <div className="text-[5em] text-blue-500">
        <i className="fa fa-plus" />
      </div>
    </Card>
  );
};
