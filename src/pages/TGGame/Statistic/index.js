import { Button, DatePicker, Input, Radio, Table } from "antd";
import { debounce } from "lodash";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import DoubleDescription from "../../../components/common/DoubleDescription";
import { useAuth } from "../../../context/AuthContext";
import { isEmpty } from "../../../utility";
import { getFilterColumns } from "../../../utility/table";
import DetailTable from "./DetailTable";
import postUrl2Pro from "../../../utility/postUrl2Pro";
const { RangePicker } = DatePicker;
const pageSizeOptions = [10, 20, 50, 100];
const dateType = { date: "daily", week: "weekly", month: "monthly" }
const formatDate = (all, type) => {
  if (type === "date") {
    return all?.date;
  }
  if (type === "week") {
    return `${all.year} ${all.weekOrdinal} week (${all.dateRange})`;
  }
  return all.date + " (" + all.dateRange + ")";
};


const TGStatistic = () => {
  const [selected, setSelected] = useState("date");
  const { logout , sitemode } = useAuth();
  const [date, setDate] = useState(null);
  const [data, setData] = useState([]);
  const [user, setUser] = useState(undefined);
  const [search, setSearch] = useState(undefined);
  const columns = getFilterColumns([
    {
      title:
        selected.charAt(0).toUpperCase() + selected.slice(1),
      dataIndex: "_id",
      align: "center",
      sorter : true,
      width: "15em",
      render: (value, all) => {
        return formatDate(all, selected)
      },
    },
    {
      title: "Count",
      dataIndex: "betCount",
      align: "center",
      width: "2em"
    },
    {
      title: "Played Users",
      dataIndex: "player",
      align: "center",
      width: "2em"
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      align: "center",
      width: "4em",
      render: (value) => value?.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true,
      })
    },
    {
      title: "Total Payback",
      dataIndex: "totalPayback",
      align: "center",
      width: "4em",
      render: (value) => value?.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true,
      })
    },
  ]);

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: pageSizeOptions[1],
      total: 0,
      pageSizeOptions,
    },
    changed: false,
    sorter: { field: "date", order: "descend" },
  });

  const handleTableChange = useCallback(
    debounce((pagination, filters, sorter) => {
    setTableParams({
      ...tableParams,
      pagination,
      changed: !tableParams.changed,
      sorter: { field: sorter.field, order: sorter.order },
      });
    }, 300),
    [tableParams]
  );
  const fetchDataCount = useCallback(() => {
    if (!isEmpty(date)) {
      return
    }
    postUrl2Pro(
      "/api/tg/statistics/count",
      {
        type: dateType[selected],
        user
      },
      (res) =>
        setTableParams({
          ...tableParams,
          pagination: { ...tableParams.pagination, total: res },
        }),
      logout
    );
  }, [selected, date, user, tableParams.changed]);
  const fetchData = useCallback(() => {
   
    if (!isEmpty(date)) {
      return
    }
    setData(null);
    postUrl2Pro(
      "/api/tg/statistics/get",
      {
        type: dateType[selected],
        user,
        page: tableParams.pagination.current - 1,
        pageSize: tableParams.pagination.pageSize,
        sorter: { field: tableParams.sorter.field, order: tableParams.sorter.order },
      },  

      (res) =>
        setData(res)
      ,
      logout
    );
  }, [tableParams.changed,selected,date,user]);

  useEffect(() => {
    fetchDataCount();
  }, [fetchDataCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUser(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };
  return (
    <div className="mt-4 px-4">
      <div className="flex flex-col md:flex-row gap-5 md:justify-between items-start md:items-center">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center w-full">
          <Radio.Group
            defaultValue="daily"
            buttonStyle="solid"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setDate(null);
            }}
            className="flex flex-wrap"
          >
            {[...Object.keys(dateType)].map((type) => (
              <Radio.Button
                key={type}
                value={type}
                type="primary"
                className="w-[80px] text-center"
              >
                {dateType[type].charAt(0).toUpperCase() + dateType[type].slice(1)}
              </Radio.Button>
            ))}
          </Radio.Group>
          
          {date &&
            <div className="w-full flex items-center md:w-auto">
              <Button className="mr-2" onClick={() => {
                setDate(null);
              }}><i className="fa fa-arrow-left" /></Button>
              <Button className="rounded-r-none" onClick={() => setDate(moment.utc(date).subtract(1, selected === "date" ? "day" : selected === "week" ? "week" : "month"))}><i className="fa fa-angle-left"></i></Button>
              <div className="text-lg font-bold border-solid border-y border-x-0 border-gray-300 px-3">{selected === "date" ? moment.utc(date).format("YYYY-MM-DD") : (selected === "week" ? moment.utc(date).format("YYYY") + " " + moment.utc(date).week() + "th week" : moment.utc(date).format("YYYY-MM"))}</div>
              <Button className="rounded-l-none" onClick={() => setDate(moment.utc(date).add(1, selected === "date" ? "day" : selected === "week" ? "week" : "month"))}><i className="fa fa-angle-right"></i></Button>
            </div>
          }
        </div>
        <div className="flex gap-2 w-full md:w-[700px]">
          <Button
            onClick={handlePaste}
            className="px-3  border rounded-md hover:bg-gray-100"
            title="Paste from clipboard"
          >
            <i className="fa fa-paste"></i>
          </Button>
          <Input.Search
            className="w-full"
            placeholder="Search Wallet Address of User"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={() => {
              setUser(search);
            }}
          />
        </div>
      </div>
      <div className="mt-4 w-full">
        {isEmpty(date) ?
          <div className="w-full">
            <Table
              loading={!data}
              columns={columns}
              dataSource={data}
              pagination={tableParams.pagination}
              onChange={handleTableChange}
              scroll={{ x: 'auto' }}
              onRow={(record) => ({
                onDoubleClick: () => {
                  setDate(selected === "date" ? record.date : record.dateRange.split(" ~ ")[0]);
                },
              })}
            />
            <DoubleDescription />
          </div>
          : <DetailTable selected={dateType[selected]} date={date} user={user} />
        }
      </div>
    </div>
  );
};

export default TGStatistic;
