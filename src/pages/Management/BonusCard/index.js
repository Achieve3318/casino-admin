import { Button, Modal, Table, Tag } from "antd";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { postUrl } from "../../../utility";
import { getFilterColumns } from "../../../utility/table";
import { USER_ROLE } from "../../../constants";
import { warning, success } from "../../../utility/notification";
import moment from "moment";
import ButtonGroup from "antd/es/button/button-group";
import EditModal from "./EditModal";

const { confirm } = Modal;
const pageSizeOptions = [10, 20, 50, 100];

export default () => {
    const [refresh, setRefresh] = useReducer((f) => !f);
    const [dataSource, setDataSource] = useState(null);
    const { logout, auth , sitemode } = useAuth();
    const [open, setOpen] = useState(false);
    const [editedData, setEditedData] = useState({});
    const columns = getFilterColumns([
        ...(auth?.user?.role === USER_ROLE.ADMIN
            ? [
                {
                    title: "ID",
                    dataIndex: "_id",
                    sorter: true,
                    width: "15em",
                    align: "center",
                },
            ]
            : []),
        {
            title: "Reciever",
            dataIndex: "username",
            sorter: true,
            className: "text-xs",
            width: "13em",
            align: "center",
            isFilter: true,
        },
        {
            title: "Title",
            dataIndex: "title",
            className: "text-xs",
            align: "center",
            sorter: true,
        },
        {
            title: "Amount",
            dataIndex: "amount",
            className: "text-xs",
            align: "center",
            sorter: true,
        },
        { 
            title : "Currency",
            dataIndex: "currency",
            className: "text-xs",
            align: "center",
            sorter: true,
        },
        {
            title: "Description",
            dataIndex: "description",
            className: "text-xs",
            align: "center",
            sorter: true,
        },
        {
            title: "Claimed",
            dataIndex: "claimed",
            className: "text-xs",
            align: "center",
            sorter: true,
            render: (value, row) => {
                if (value) {
                    return <Tag color="green">Claimed({moment(row.claimedDate).format("YYYY-MM-DD HH:mm:ss")})</Tag>
                } else return <Tag color="red"> Not</Tag>
            }
        },
        {
            title: "Enabled",
            dataIndex: "draft",
            className: "text-xs",
            align: "center",
            sorter: true,
            render: (value) => {
                if (value) {
                    return <Tag color='red'>Not</Tag>
                } else return <Tag color="green">Enabled</Tag>
            }
        },

    ]);

    const [tableParams, setTableParams] = useState({
        pagination: {
            size: "default",
            current: 1,
            pageSize: pageSizeOptions[1],
            total: 0,
            pageSizeOptions,
            showQuickJumper: true,
            showSizeChanger: true,
        },
        changed: false,
        filters: {},
        sorter: {},
    });

    const fetchDataCount = () => {
        postUrl(sitemode,
            "/api/bonus/card/get/count",
            {
                filters: tableParams.filters,
                sorter: tableParams.sorter,
            },
            (data) =>
                setTableParams({
                    ...tableParams,
                    pagination: { ...tableParams.pagination, total: data },
                }),
            logout,
        );
    };
    const fetchData = () => {
        setDataSource(null);

        postUrl(sitemode,
            "/api/bonus/card/get",
            {
                page: tableParams.pagination.current - 1,
                pageSize: tableParams.pagination.pageSize,
                filters: tableParams.filters,
                sorter: tableParams.sorter,
            },
            (data) => {
                setDataSource(data);
            },
            logout,
        );
    };

    const deletePlans = () => {
        let count = selectedRowKeys.length;
        postUrl(sitemode,
            "/api/bonus/card/del",
            { ids: selectedRowKeys },
            () => {
                success(count + " rows is deleted.");
                setRefresh();
            },
            logout,
        );
    };

    useEffect(fetchDataCount, [tableParams.changed, refresh]);
    useEffect(
        fetchData,
        [
            tableParams.changed, refresh
        ],
    );
    const handleTableChange = useCallback(
        debounce((pagination, filters, sorter) => {
            setTableParams({
                ...tableParams,
                changed: !tableParams.changed,
                pagination,
                filters,
                sorter,
            });
        }, 300),
        [tableParams]
    );

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const onSelectChange = (keys) => {
        setSelectedRowKeys(keys);
    };

    const showPlans = (draft) => {
        if (dataSource.filter((v) => v._id === selectedRowKeys[0])[0].claimed) {
            warning("This bonus card is claimed.");
            return;
        }
        let count = selectedRowKeys.length;
        postUrl(sitemode,
            draft ? "/api/bonus/card/enable" : "/api/bonus/card/disable",
            { ids: selectedRowKeys, draft },
            () => {
                success(count + " rows is " + (draft ? "enabled" : "disabled") + ".");
                setRefresh();
            },
            logout,
        );
    };

    return (
        <>
            <div className="flex justify-end mt-4">
                <ButtonGroup>
                    <Button
                        color="primary"
                        variant="solid"
                        icon={<i className="fa fa-plus"></i>}
                        className="w-[6em]"
                        onClick={() => {
                            setEditedData({})
                            setOpen(true)
                        }}
                    >
                        Add
                    </Button>
                    <Button
                        color="pink"
                        icon={<i className="fa fa-pencil"></i>}
                        variant="solid"
                        className="w-[6em]"
                        onClick={() => {
                            if (selectedRowKeys.length > 1) {
                                warning("You can change only one row.");
                                return;
                            }
                            if (selectedRowKeys.length === 0) {
                                warning("You have to select row.");
                                return;
                            }
                            if (dataSource.filter((v) => v._id === selectedRowKeys[0])[0].claimed) {
                                warning("This bonus card is claimed.");
                                return;
                            }
                            setEditedData(
                                dataSource.filter((v) => v._id === selectedRowKeys[0])[0],
                            );
                            setOpen(true);
                        }}
                    >
                        Update
                    </Button>
                    <Button
                        color="danger"
                        variant="outlined"
                        icon={<i className="fa fa-trash"></i>}
                        className="w-[6em]"
                        onClick={() => {
                            if (selectedRowKeys.length === 0) {
                                warning("You have to select row.");
                                return;
                            }
                            confirm({
                                title: "Do you want to delete these items?",
                                content: "Once deleted, the items cannot be recovered.",
                                okText: "Yes",
                                okType: "danger",
                                cancelText: "No",
                                onOk() {
                                    deletePlans();
                                },
                                onCancel() { },
                            });
                        }}
                    >
                        Delete
                    </Button>

                    <Button
                        color="blue"
                        variant="solid"
                        icon={<i className="fa fa-eye"></i>}
                        className="w-[6em]"
                        onClick={() => {
                            if (selectedRowKeys.length === 0) {
                                warning("You have to select row.");
                                return;
                            }
                            showPlans(true);
                        }}
                    >
                        Enable
                    </Button>
                    <Button
                        color="purple"
                        variant="solid"
                        icon={<i className="fa fa-eye-slash"></i>}
                        className="w-[6em]"
                        onClick={() => {
                            if (selectedRowKeys.length === 0) {
                                warning("You have to select row.");
                                return;
                            }
                            showPlans(false);
                        }}
                    >
                        Disable
                    </Button>
                </ButtonGroup>
            </div>
            <Table
                className="mt-3 w-full"
                bordered
                size="small"
                scroll={{ x: "auto" }}
                columns={columns}
                rowKey={(record) => record._id}
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                }}
                dataSource={dataSource}
                loading={dataSource === null}
                pagination={tableParams.pagination}
                onChange={handleTableChange}
            />
            <EditModal open={open} data={editedData} setRefresh={setRefresh} onClose={() => setOpen(false)} />
        </>
    );
}
