import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Card } from "antd";
import { SUB_SITE } from "../../../utility";
import { useAuth } from "../../../context/AuthContext";

export default function SeoCard({
  game,
  lang,
  data,
  onEdit = (f) => f,
  onDelete = (f) => f,
}) {
  const {sitemode} = useAuth()
  return (
    <Card
      // title={(game === 'all' ? "Game: " + data.game + "  " : "") + (lang === 'all' ? "Lang: " + data.lang : "")}
      className="w-[300px]"
      cover={
        <div className="h-[200px] overflow-hidden text-center border-solid border border-gray-200">
          <img
            alt="example"
            className="h-full"
            src={SUB_SITE[sitemode] + "/" + data.image}
          />
        </div>
      }
      actions={[
        <EditOutlined key="edit" onClick={onEdit} />,
        <DeleteOutlined key="delete" onClick={onDelete} />,
      ]}
    >
      <div className="text-[1.1em] font-bold">
        {game === "all" ? "Game: " + data.game + "  " : ""}
      </div>
      <div className="text-[1.1em] font-bold">
        {lang === "all" ? "Lang: " + data.lang : ""}
      </div>
    </Card>
  );
}
