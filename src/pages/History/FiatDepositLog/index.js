import { Table, Tag, Tooltip } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { dateFormat } from "../../../utility/date";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";
import postUrl2Pro from "../../../utility/postUrl2Pro";
import { postUrl } from "../../../utility";

const pageSizeOptions = [10, 20, 50, 100, 500];
const DEFAULT_SORTER = { field: "createdAt", order: "descend" };

export default function FiatDepositLog({ username = "" }) {
  const [fiatData, setFiatData] = useState(null);
  const { sitemode } = useAuth();
  const [fiatParams, setFiatParams] = useState({
    pagination: {
      size: "default",
      current: 1,
      pageSize: pageSizeOptions[0],
      total: 0,
      pageSizeOptions,
      showQuickJumper: true,
      showSizeChanger: true,
    },
    filters: { username: username ? [username] : [] },
    sorter: DEFAULT_SORTER,
  });
  const { logout, auth } = useAuth();

  const fiatColumns = useMemo(
    () =>
      getFilterColumns([
        ...(auth?.user?.role === USER_ROLE.ADMIN
          ? [
            {
              title: "Order Number",
              dataIndex: "orderNum",
              align: "center",
              width: "12em",
              isFilter: true,
              className: "text-xs sm:text-sm md:text-base",
            },
          ]
          : []),
        {
          title: "User Name",
          dataIndex: "username",
          width: "10em",
          align: "center",
          isFilter: true,
          className: "text-xs sm:text-sm md:text-base",
        },
        {
          title: "Amount",
          dataIndex: "amount",
          sorter: true,
          width: "10em",
          align: "right",
          className: "text-xs sm:text-sm md:text-base",
          render: (amount, record) =>
            `${Number(amount || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${sitemode === 'mx' ? 'MXN' : sitemode === 'taka' ? 'BDT' : sitemode === 'brazil' || sitemode === 'grupo25' ? 'BRL' : sitemode === 'cop' ? 'COP' : 'GHS'}`,
        },

        {
          title: "Deposit Time",
          dataIndex: "createdAt",
          sorter: true,
          width: "12em",
          align: "center",
          className: "text-xs sm:text-sm md:text-base",
          render: (dataPoint) => dateFormat(dataPoint),
        },
        {
          title: "Status",
          dataIndex: "status",
          width: "8em",
          align: "center",
          isFilter: true,
          className: "text-xs sm:text-sm md:text-base",
          render: (status) => (
            <Tag color={status === "01" ? "green" : status === "04" ? "default" : status === "07" ? "blue" : "red"}>
              {status === "01" ? "Success" : status === "04" ? "In Progress" : status === "07" ? "Refunded" : "Failed"}
            </Tag>
          ),
        },
        {
          title: "Checkout URL",
          dataIndex: "checkoutUrl",
          width: "14em",
          align: "center",
          className: "text-xs sm:text-sm md:text-base",
          render: (value) =>
            value ? (
              <Tooltip title={value}>
                <a href={value} target="_blank" rel="noreferrer">
                  View invoice
                </a>
              </Tooltip>
            ) : (
              "-"
            ),
        },
      ]),
    [auth?.user?.role]
  );

  const fetchFiatCount = useCallback(() => {
    postUrl(
      sitemode,
      `/api/${sitemode === 'mx' ? 'toppay' : sitemode === 'taka' ? 'worldpay' : (sitemode === 'brazil' || sitemode === 'grupo25') ? 'winpay' : sitemode === 'cop' ? 'wePay' : 'wepay'}/getCollectionHistoryCount`,
      {
        filters: fiatParams.filters,
        sorter: fiatParams.sorter,
      },
      (res) =>
        setFiatParams((prev) => ({
          ...prev,
          pagination: { ...prev.pagination, total: res || 0 },
        })),
      logout
    );
  }, [sitemode, fiatParams.filters, fiatParams.sorter, logout]);

  const fetchFiatData = useCallback(() => {
    setFiatData(null);
    postUrl(
      sitemode,
      `/api/${sitemode === 'mx' ? 'toppay' : sitemode === 'taka' ? 'worldPay' : (sitemode === 'brazil' || sitemode === 'grupo25') ? 'winpay' : sitemode === 'cop' ? 'wePay' : 'wepay'}/getCollectionHistory`,
      {
        filters: fiatParams.filters,
        sorter: fiatParams.sorter,
        page: fiatParams.pagination.current - 1,
        pageSize: fiatParams.pagination.pageSize,
        },
        (res) => setFiatData(Array.isArray(res) ? res : []),
        logout
      );
  }, [sitemode,
    fiatParams.filters,
    fiatParams.sorter,
    fiatParams.pagination.current,
    fiatParams.pagination.pageSize,
    sitemode,
    logout,
  ]);

  useEffect(() => {
    if (username) {
      setFiatParams((prev) => ({
        ...prev,
        filters: { ...prev.filters, username: [username] },
      }));
    }
  }, [username]);

  useEffect(() => fetchFiatCount(), [fetchFiatCount]);
  useEffect(() => fetchFiatData(), [fetchFiatData]);

  const handleFiatChange = useCallback(
    debounce((pagination, filters, sorter) => {
      setFiatParams({
        ...fiatParams,
        pagination,
        filters: { ...fiatParams.filters, ...filters },
        sorter: { field: sorter.field, order: sorter.order },
      });
    }, 300),
    [fiatParams]
  );

  return (
    <div className="flex flex-col gap-8 mt-5">
      <Table
        size="small"
        bordered
        columns={fiatColumns}
        scroll={{ x: "auto" }}
        rowKey={(record) => record.orderNumber || record._id}
        dataSource={fiatData || []}
        loading={fiatData === null}
        pagination={fiatParams.pagination}
        onChange={handleFiatChange}
      />
    </div>
  );
}
