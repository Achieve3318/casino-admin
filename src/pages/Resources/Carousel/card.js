import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Card } from "antd";
import { SUB_SITE } from "../../../utility";
import { useAuth } from "../../../context/AuthContext";

export default function CarouselCard({
  lang,
  data,
  onEdit = (f) => f,
  onDelete = (f) => f,
}) {
  const { sitemode } = useAuth()
  return (
    <Card
      // title={(game === 'all' ? "Game: " + data.game + "  " : "") + (lang === 'all' ? "Lang: " + data.lang : "")}
      className="w-[300px]"
      cover={
        <div className="h-[80px] overflow-hidden text-center border-solid border border-gray-200 flex flex-col items-center justify-center">
          <img
            alt="example"
            className="w-full"
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
        {lang === "all" ? "Lang: " + data.lang : ""}
      </div>
      <div className="text-[1.1em] font-bold">
        Sort : {data.title}
      </div>
    </Card>
  );
}
