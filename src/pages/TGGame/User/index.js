import { Input, Modal, Table } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { TruncateMiddle } from "../../../utility/address";
import { success } from "../../../utility/notification";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";
import postUrl2Pro from "../../../utility/postUrl2Pro";

const pageSizeOptions = [10, 20, 50, 100];

const User = () => {
    const [data, setData] = useState(null);
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            size: "default",
            pageSize: pageSizeOptions[1],
            total: 0,
            pageSizeOptions
        },
        changed: false,
        filters: {},
        sorter: {}
    });
    const [modal, setModal] = useState({
        open: false,
        data: { note: "", id: "" }
    });
    const { logout, auth , sitemode } = useAuth();

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
            title: "ID",
            dataIndex: "id",
            sorter: true,
            className: "text-xs sm:text-sm md:text-base",
            isFilter: true,
            align: "center",
            width: "8em",
        },
        {
            title: "Username",
            dataIndex: "username",
            sorter: true,
            className: "text-xs sm:text-sm md:text-base",
            isFilter: true,
            align: "center",
            width: "8em",
        },
        {
            title: "First Name",
            dataIndex: "first_name",
            sorter: true,
            className: "text-xs sm:text-sm md:text-base",
            isFilter: true,
            align: "center",
            width: "15em",
        },
        {
            title: "Last Name",
            dataIndex: "last_name",
            sorter: true,
            className: "text-xs sm:text-sm md:text-base",
            isFilter: true,
            align: "center",
            width: "15em",
        },
        {
            title: "Address",
            dataIndex: "address",
            sorter: true,
            className: "text-xs sm:text-sm md:text-base",
            align: "center",
            width: "8em",
            render: (value, record) => <div className="flex flex-col gap-2">
                {
                    value.map(v => <div className="flex items-center gap-4 justify-end">
                        <div className="flex items-center gap-2">
                            <TruncateMiddle showTooltip={true} text={v} key={v} />
                        </div>
                        <i className="fa fa-trash cursor-pointer hover:text-red-300 text-red-500 text-lg" onClick={() => {
                            postUrl2Pro("/api/tg/address/remove", { id: record.id, address: v }, (data) => {
                                success(data.message)
                                fetchData()
                            }, logout)
                        }}></i>
                    </div>
                    )}
            </div>
        },
        {
            title: "Note",
            dataIndex: "note",
            className: "text-xs sm:text-sm md:text-base",
            align: "center",
            width: "15em",
            render: (value, record) => <Input.TextArea value={value} readOnly resize={false}
                className="bg-transparent !resize-none shadow-none hover:shadow-none focus:shadow-none !hover:border-none !focus:border-none !border-none hover:bg-transparent focus:bg-transparent w-full h-full" />,
            onCell: (record) => ({
                onClick: () => {
                    setModal(prev => ({
                        ...prev,
                        open: true,
                        data: { note: record.note, id: record.id }
                    }))
                }
            })
        },
    ]);

    const fetchDataCount = useCallback(() => {
        postUrl2Pro(
            "/api/tg/user/count",
            {
                filters: tableParams.filters,
                sorter: tableParams.sorter,
            },
            (res) =>
                setTableParams({
                    ...tableParams,
                    pagination: { ...tableParams.pagination, total: res },
                }),
            logout
        );
    }, [tableParams.changed]);
    const fetchData = useCallback(() => {
        if (modal.open) return;
        setData(null);
        postUrl2Pro(
            "/api/tg/user/list",
            {
                page: tableParams.pagination.current - 1,
                pageSize: tableParams.pagination.pageSize,
                filters: tableParams.filters,
                sorter: tableParams.sorter,
            },
            (res) => setData(res.map(v => ({
                ...v,
                key: v.id,
                children1: v.children,
                children: undefined
            }))),
            logout
        );
    }, [tableParams.changed]);

    useEffect(() => {
        fetchDataCount();
    }, [fetchDataCount]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleTableChange = useCallback(
        debounce((pagination, filters, sorter) => {
            setTableParams({
                ...tableParams,
                pagination,
                filters,
                sorter,
                changed: !tableParams.changed,
            });
        }, 300),
        [tableParams]
    );
    return <div className="mt-4">
        <Table
            size="small"
            columns={columns}
            scroll={{ x: "auto" }}
            dataSource={data}
            loading={data === null}
            pagination={tableParams.pagination}
            onChange={handleTableChange}
        />

        <Modal open={modal.open} onCancel={() => setModal(prev => ({ ...prev, open: false }))} title="Make a note..."
            okText="Save" onOk={() => {
                postUrl2Pro("/api/tg/user/update", { id: modal.data.id, note: modal.data.note }, (data) => {
                    success(data.message)
                    setModal(prev => ({ ...prev, open: false }))
                    fetchData()
                }, logout)
            }}
        >
            <Input.TextArea value={modal.data.note} onChange={(e) => setModal(prev => ({ ...prev, data: { ...prev.data, note: e.target.value } }))} rows={10} />
        </Modal>
    </div>;
};

export default User;    
