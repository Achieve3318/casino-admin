import { useState, useEffect } from "react";
import { Button, Modal, Table, Tag, Tooltip } from "antd";
import { postUrl, SUB_SITE } from "../../../utility";
import { useAuth } from "../../../context/AuthContext";
import { getFilterColumns } from "../../../utility/table";
import { debounce } from "lodash";
import { useCallback } from "react";
import { success } from "../../../utility/notification";
import moment from "moment";
import { USER_ROLE } from "../../../constants";

const pageSizeOptions = [10, 20, 50, 100];
const Cattea = () => {
  const [data, setData] = useState([]);
  const { logout, auth , sitemode } = useAuth();
  const [detailData, setDetailData] = useState({ open: false, data: [] })
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      size: "default",
      pageSize: pageSizeOptions[1],
      total: 0,
      pageSizeOptions,
    },
    changed: false,
    filters: {},
    sorter: {},
  });

  const columns = getFilterColumns([
    ...(auth?.user?.role === USER_ROLE.ADMIN
      ? [
        {
          title: "Data ID",
          dataIndex: "_id",
          className: "text-xs sm:text-sm md:text-base",
          isFilter: true,
          align: "center",
          width: "8em",
        },
      ]
      : []),
    {
      title: 'ID',
      dataIndex: 'id',
      isFilter: true,
      key: 'id',
      align: 'center',
      width: 50,
      render: (_, row) => row.id
    },
    {
      title: "Avatar",
      dataIndex: "photo_url",
      key: "avatar",
      align: "center",
      width: 100,
      render: (v, record) => (
        <img
          src={process.env.REACT_APP_BETWALLET_URL + "/api/tgcattea/image?id=" + record.id}
          loading="lazy"
          onError={(e) => (e.target.src = "/logo512.png")}
          alt={record.username}
          width="50"
          height="50"
          style={{ borderRadius: "50%" }}
        />
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      align: "center",
      width: 150,
      render: (v, record) => (
        <>
          {
            record.id ?
              <a
                href={`https://t.me/${v}`}
                target="_blank"
                rel="noreferrer"
              >
                <Tooltip title={(record.first_name || "") + " " + (record.last_name || "")}>
                  @{v}
                </Tooltip>
              </a> : <Tooltip className="cursor-pointer" title={(record.first_name || "") + " " + (record.last_name || "")}>
                {v}
              </Tooltip>
          }
        </>
      ),
    },
    {
      title: "Code",
      dataIndex: "verifyToken",
      key: "verifyToken",
      isFilter: true,
      align: "center",
      width: 100,
    },
    {
      title: "WagerCat Coin",
      dataIndex: "totalScore",
      key: "totalScore",
      align: "right",
      width: 180,
      onHeaderCell: () => ({
        style: {
          textAlign: "center",
        },
      }),
      render: (v) => <div>
        <img src="/cattea.png" height={20} className="mr-2" />
        {v || 0}
      </div>
    },
    {
      title: "Last Score",
      dataIndex: "lastScore",
      key: "highScore",
      align: "right",
      onHeaderCell: () => ({
        style: {
          textAlign: "center",
        },
      }),
      width: 140,
      render: (v, record) => <Tooltip className="cursor-pointer" title={moment(record.lastTime).format("YYYY/MM/DD HH:mm:ss") + ", " + (record.lastWin ? "Success" : "Failed")} >
        <span className={record.lastWin ? "text-green-600" : "text-red-600"}>{v}</span>
      </Tooltip>

    },
    {
      title: "Invite Sent",
      dataIndex: "inviteSent",
      key: "inviteSent",
      width: 120,
      sorter: true,
      align: "center",
      render: (v) => v || 0,
    },
    {
      title: "Playable",
      dataIndex: "playable",
      key: "playable",
      align: "center",
      render: (v, record) =>
      (
        <div className="flex flex-col gaps-1">
          <div className="min-w-[120px]">
            {(record.dailyRemain || 0) + (record.bonusRemain || 0)} ({record.dailyRemain || 0} +{" "}
            {record.bonusRemain || 0})
          </div>
          <div className="font-bold text-md">
            Round {record.currentRound || 1}
          </div>
        </div>
      ),
    },
    {
      title: "History",
      dataIndex: "score",
      key: "score",
      align: "center",
      width: 220,
      render: (v, record) => (
        <div className="flex flex-col px-2">
          {v && v.length > 0 && (
            <div className="flex flex-col gap-1">
              {[...v].reverse().slice(0, 2).map(({ date, result }, index) => <div key={index} className="w-full flex flex-row gap-1 justify-between items-center" >
                <span className="min-w-[100px]">{date}</span>
                <span className="font-bold text-lg">{result}</span>
              </div>)}
              {
                v.length > 2 && <a onClick={() => viewMore(record.score)}>...</a>
              }
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Prize",
      dataIndex: "withdrawal",
      key: "withdrawal",
      align: "center",
      width: 220,
      render: (v, record) => (
        <div className="flex flex-col px-2">
          {v && v.length > 0 && (
            <div className="flex flex-col gap-1">
              {[...v].reverse().slice(0, 2).map(({ date, amount, status }, index) => <div key={index} className="w-full flex flex-row gap-1 justify-between items-center" >
                <span className="w-1/2 min-w-[100px]">{date}</span>
                <span className="w-1/2 text-right font-bold text-lg flex flex-row gap-1 items-center justify-end"><img src="/USDT.svg" height={20}></img>{amount}</span>
                <i className={`fa ${status ? 'fa-check text-green-600' : 'fa-times text-red-600'}`} />
              </div>)}
              {
                v.length > 2 && <a onClick={() => viewMore(record.withdrawal)}>...</a>
              }
            </div>
          )}
        </div>
      ),
    }, {
      title: 'Merged',
      key: 'merged',
      dataIndex: 'merged',
      align: 'center',
      width: 100
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 50,
      render: (v, record) => (
        <Button onClick={() => handleDelete(record)}>
          <i className="fa fa-trash"></i>
        </Button>
      ),
    },
  ]);

  const viewMore = (data) => {
    setDetailData({ open: true, data })
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete",
      content: "Are you sure to delete this user?",
      onOk: () => {
        try {
          postUrl(
            "betwallet",
            "/api/tgcattea/delete",
            { _id: record._id },
            (res) => {
              if (res) {
                success("Delete successfully");
                fetchData();
              }
            },
            logout
          );
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  const fetchDataCount = useCallback(() => {
    try {
      postUrl(
        "betwallet",
        "/api/tgcattea/count",
        {},
        (res) =>
          setTableParams({
            ...tableParams,
            pagination: {
              ...tableParams.pagination,
              total: res,
            },
          }),
        logout
      );
    } catch (error) {
      console.error(error);
    }
  }, [tableParams.changed]);

  const fetchData = useCallback(() => {
    try {
      postUrl(
        "betwallet",
        "/api/tgcattea/list",
        {
          ...tableParams.filters,
          ...tableParams.sorter,
          ...tableParams.pagination,
        },
        (res) => {
          setData(res);
        },
        logout
      );
    } catch (error) {
      console.error(error);
    }
  }, [tableParams.changed]);

  const handleTableChange = useCallback(
    debounce((pagination, filters, sorter) => {
      setTableParams({
        ...tableParams,
        pagination,
        filters: { ...tableParams.filters, ...filters },
        sorter,
        changed: !tableParams.changed,
      });
    }, 300),
    [tableParams]
  );

  useEffect(() => {
    fetchDataCount();
  }, [fetchDataCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="mt-3">
      <Table
        columns={columns}
        rowKey={(record) => record._id}
        scroll={{ x: "auto" }}
        loading={data === null}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
        dataSource={data}
        size="medium"
      />
      <Modal open={detailData.open} title={"Details"} onCancel={() => setDetailData({ open: false, data: [] })} footer={null} width={370}>
        {
          ([...(detailData.data || [])].reverse()).map(({ date, result, status, amount }, index) => <>
            {
              result ? <div key={index} className="w-full flex flex-row gap-1 justify-between items-center" >
                <span className="min-w-[100px]">{date}</span>
                <span className="font-bold text-lg">{result}</span>
              </div> : <div key={index} className="w-full flex flex-row gap-1 justify-between items-center" >
                <span className="w-1/2 min-w-[100px]">{date}</span>
                <span className="w-1/2 text-right font-bold text-lg flex flex-row gap-1 items-center justify-end"><img src="/USDT.svg" height={20}></img>{amount}</span>
                <i className={`fa ${status ? 'fa-check text-green-600' : 'fa-times text-red-600'}`} />
              </div>
            }
          </>)
        }
      </Modal>
    </div>
  );
};

export default Cattea;
