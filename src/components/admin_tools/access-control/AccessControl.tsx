import React, {useState, UIEvent, useMemo} from "react";
import {
    Flex,
    Table,
    Typography,
    Button,
    Dropdown,
    MenuProps,
    FloatButton,
    Tag,
    Drawer,
    Descriptions,
} from "antd";
import {useResizeHeight} from "../../../hooks/useResizeHeigth.tsx";
import {ResizableTitle} from "../../ResizableTitle.tsx";
import commonStyles from "../CommonStyle.module.css";
import {OverridableIcon} from "../../../icons/IconProvider.tsx";
import {makeEnumColumnFilterDropdown} from "../../EnumColumnFilterDropdown.tsx";
import {AccessControlType, AccessControlProperty, AccessControlResponse, AccessControl as AccessControlData} from "../../../api/apiTypes.ts";
import {useAccessControl} from "../../../hooks/useAccessControl.tsx";
import {ColumnsType} from "antd/es/table";
import {useModalsContext} from "../../../Modals.tsx";
import {AbacAttributesPopUp} from "./AbacAttributesPopUp.tsx";
import {ModificationPopUp} from "./ModificationPopUp.tsx";
import {useNavigate} from "react-router";
import {DeploymentsCumulativeState} from "../../deployment_runtime_states/DeploymentsCumulativeState.tsx";
import FloatButtonGroup from "antd/lib/float-button/FloatButtonGroup";
import {useNotificationService} from "../../../hooks/useNotificationService.tsx";

const {Title} = Typography;

const columnVisibilityMenuItems: MenuProps["items"] = [
    {label: "Endpoint", key: "endpoint"},
    {label: "Type", key: "type"},
    {label: "Access Control Type", key: "accessControlType"},
    {label: "Roles", key: "roles"},
    {label: "Attributes", key: "attributes"},
    {label: "Chain", key: "chain"},
    {label: "Chain Status", key: "chainStatus"},
];

const accessControlTypeOptions = Object.values(AccessControlType).map(
    (value) => ({
        label: value,
        value,
    }),
);

export const AccessControl: React.FC = () => {
    const {
        isLoading,
        accessControlData,
        setAccessControlData,
        getAccessControl,
        updateAccessControl
    } = useAccessControl();
    const { showModal } = useModalsContext();
    const navigate = useNavigate();
    const notificationService = useNotificationService();

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [containerRef, containerHeight] = useResizeHeight<HTMLElement>();
    const [currentRecord, setCurrentRecord] = useState<AccessControlData | null>(null);
    const [openSidebar, setOpenSidebar] = useState(false);

    const [selectedKeys, setSelectedKeys] = useState<string[]>([
        "endpoint",
        "type",
        "accessControlType",
        "roles",
        "attributes",
        "chain",
        "chainStatus",
    ]);

    const [columnsWidth, setColumnsWidth] = useState<{ [key: string]: number }>({
        checkbox: 50,
        endpoint: 200,
        type: 100,
        accessControlType: 160,
        roles: 100,
        attributes: 100,
        chain: 190,
        chainStatus: 110,
    });

    const totalColumnsWidth = Object.values(columnsWidth).reduce(
        (acc, width) => acc + width,
        0,
    );

    const {filterDropdown: accessControlTypeFilter} =
        makeEnumColumnFilterDropdown(accessControlTypeOptions, "accessControlType", true);

    const accessControlTypeOnFilter = (
        value: AccessControlType | React.Key | number | boolean,
        record: AccessControlProperty,
    ) => record.accessControlType === value;

    const onScroll = async (event: UIEvent<HTMLDivElement>) => {

    };

    const showDrawer = (record: AccessControlData) => {
        setCurrentRecord(record);
        setOpenSidebar(true);
    };

    const onClose = () => {
        setOpenSidebar(false);
        setCurrentRecord(null);
    };

    const columns: ColumnsType<AccessControlData>["columns"] = [
        {
            title: "Endpoint",
            dataIndex: "endpoint",
            key: "endpoint",
            render: (_, record: AccessControlData) => {
                if (record.chainId) {
                    return (
                        <a onClick={() => void navigate(`/chains/${record.chainId}/graph/${record.elementId}`)}>
                            {record.properties?.contextPath || "—"}
                        </a>
                    );
                }
                return <>—</>;
            }
        },
        {
            title: "Type",
            key: "type",
            render: (_, record: AccessControlData) => {
                const { externalRoute, privateRoute } = record.properties || {};
                return <>{
                    externalRoute && privateRoute ? "External, Private" :
                        externalRoute ? "External" :
                            privateRoute ? "Private" :
                                "Internal"
                }</>;
            },
        },
        {
            title: "Access Control Type",
            key: "accessControlType",
            dataIndex: "accessControlType",
            hidden: !selectedKeys.includes("accessControlType"),
            render: (_, record: AccessControlData) => {
                return <>{record.properties?.accessControlType || "—"}</>;
            }
        },
        {
            title: "Roles",
            key: "roles",
            render: (_, record: AccessControlData) => {
                const roles = record.properties?.roles;
                if (roles && Array.isArray(roles) && roles.length > 0) {
                    return (
                        <span>
                            {roles.map((role, idx) => (
                                <Tag key={`${role}-${idx}`} color="blue">
                                    {role}
                                </Tag>
                            ))}
                        </span>
                    );
                }
                return <>—</>;
            }
        },
        {
            title: "Attributes",
            key: "attributes",
            render: (_, record: AccessControlData) => {
                if(record.properties?.accessControlType === "ABAC") {
                    return (
                        <span
                            style={{ cursor: "pointer", color: "#1890ff" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                showModal({
                                    component: <AbacAttributesPopUp record={record} />,
                                });
                            }}
                        >Details</span>
                    );
                }
                else return <>{"—"}</>;
            }
        },
        {
            title: "Chain",
            key: "chain",
            render: (_, record: AccessControlData) => {
                if (record.chainId) {
                    return (
                        <a onClick={() => void navigate(`/chains/${record.chainId}`)}>
                            {record.chainName}
                        </a>
                    );
                }
                return <>—</>;
            }
        },
        {
            title: "Chain Status",
            key: "chainStatus",
            render: (_, record: AccessControlData) => {
                if (record.chainId) {
                    return <DeploymentsCumulativeState chainId={record.chainId} />;
                }
                return <>—</>;
            }
        },
        {
            title: "ID",
            key: "id",
            hidden: true,
        },
    ];

    return (
        <Flex vertical className={commonStyles["container"]}>
            <Flex className={commonStyles["header"]}>
                <Title level={4} className={commonStyles["title"]}>
                    <OverridableIcon name="settings" className={commonStyles["icon"]}/>
                    Access Control
                </Title>
                <Flex vertical={false} gap={8} className={commonStyles["actions"]}>
                    <Dropdown
                        menu={{
                            items: columnVisibilityMenuItems,
                            selectable: true,
                            multiple: true,
                            selectedKeys,
                            onSelect: ({selectedKeys}) => setSelectedKeys(selectedKeys),
                            onDeselect: ({selectedKeys}) => setSelectedKeys(selectedKeys),
                        }}
                    >
                        <Button icon={<OverridableIcon name="settings"/>}/>
                    </Dropdown>
                </Flex>
            </Flex>
            <Flex
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "8px",
                    overflowY: "auto",
                }}
            >
                {currentRecord && (
                    <Drawer
                        title="Access Control Details"
                        placement="right"
                        open={openSidebar}
                        closable={false}
                        onClose={onClose}
                    >
                        <Descriptions column={1} size="small" layout="vertical">
                            <Descriptions.Item label="Endpoint">
                                {currentRecord.chainId ? (
                                    <a onClick={() => void navigate(`/chains/${currentRecord.chainId}/graph/${currentRecord.elementId}`)}>
                                        {currentRecord.properties?.contextPath || "—"}
                                    </a>
                                ) : (
                                    "—"
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Type">
                                {(() => {
                                    const { externalRoute, privateRoute } = currentRecord.properties || {};
                                    return externalRoute && privateRoute ? "External, Private" :
                                        externalRoute ? "External" :
                                            privateRoute ? "Private" :
                                                "Internal";
                                })()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Access Control Type">
                                {currentRecord.properties?.accessControlType || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Roles">
                                {currentRecord.properties?.roles && Array.isArray(currentRecord.properties.roles) && currentRecord.properties.roles.length > 0 ? (
                                    <span>
                                        {currentRecord.properties.roles.map((role, idx) => (
                                            <Tag key={`${role}-${idx}`} color="blue" style={{ marginBottom: 4 }}>
                                                {role}
                                            </Tag>
                                        ))}
                                    </span>
                                ) : (
                                    "—"
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Attributes">
                                {currentRecord.properties?.accessControlType === "ABAC" ? (
                                    <span
                                        style={{ cursor: "pointer", color: "#1890ff" }}
                                        onClick={() => {
                                            showModal({
                                                component: <AbacAttributesPopUp record={currentRecord} />,
                                            });
                                        }}
                                    >
                                        Details
                                    </span>
                                ) : (
                                    "—"
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chain">
                                {currentRecord.chainId ? (
                                    <a onClick={() => void navigate(`/chains/${currentRecord.chainId}`)}>
                                        {currentRecord.chainName}
                                    </a>
                                ) : (
                                    "—"
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chain Status">
                                {currentRecord.chainId ? (
                                    <DeploymentsCumulativeState chainId={currentRecord.chainId} />
                                ) : (
                                    "—"
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chain ID">
                                {currentRecord.chainId || "—"}
                            </Descriptions.Item>
                        </Descriptions>
                    </Drawer>
                )}
                <Flex
                    style={{
                        width: "100%",
                        maxWidth: "100%",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        overflow: "hidden",
                        height: "100%",
                    }}
                >
                    <div
                        ref={containerRef as unknown as React.Ref<HTMLDivElement>}
                        style={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Table<AccessControlData>
                            className="flex-table"
                            size="small"
                            columns={columns}
                            dataSource={accessControlData?.roles}
                            scroll={{
                                x: totalColumnsWidth,
                                y: containerHeight - 59 || 400,
                            }}
                            pagination={false}
                            rowKey={(record) => `${record.chainId}-${record.elementId}`}
                            loading={isLoading}
                            onScroll={(event) => void onScroll(event)}
                            rowSelection={{
                                selectedRowKeys,
                                onChange: (newSelectedRowKeys) => {
                                    setSelectedRowKeys(newSelectedRowKeys);
                                },
                            }}
                            components={{
                                header: {
                                    cell: ResizableTitle,
                                },
                            }}
                            onRow={(row) => {
                                return {
                                    onClick: (event: React.MouseEvent<HTMLElement>) => {
                                        const target = event.target as HTMLElement;
                                        if (
                                            target.closest('button') ||
                                            target.closest('.ant-dropdown') ||
                                            target.closest('input') ||
                                            target.closest('a') ||
                                            target.closest('.ant-checkbox-wrapper') ||
                                            target.closest('span[style*="cursor: pointer"]')
                                        ) {
                                            return;
                                        }
                                        showDrawer(row);
                                    },
                                };
                            }}
                        />
                    </div>
                </Flex>
            </Flex>
            <FloatButtonGroup trigger="hover" icon={<OverridableIcon name="more" />}>
                <FloatButton
                    tooltip={{ title: "Redeploy", placement: "left" }}
                    icon={<OverridableIcon name="send" />}
                />
                <FloatButton
                    tooltip={{ title: "Add", placement: "left" }}
                    icon={<OverridableIcon name="plus" />}
                    onClick={() => {
                        if (selectedRowKeys.length === 0) {
                            notificationService.info("No selection", "Please select at least one row to modify");
                            return;
                        }
                        const selectedRecord = accessControlData?.roles?.find((record) => {
                            const rowKey = `${record.chainId}-${record.elementId}`;
                            return selectedRowKeys.includes(rowKey);
                        });
                        if (selectedRecord) {
                            const accessControlType = (selectedRecord.properties as any)?.accessControlType;
                            if (accessControlType === "ABAC") {
                                notificationService.info("Error", "Can't apply roles to ABAC endpoint");
                                return;
                            }
                            showModal({
                                component: (
                                    <ModificationPopUp
                                        record={selectedRecord}
                                        onSuccess={() => void getAccessControl()}
                                    />
                                ),
                            });
                        } else {
                            notificationService.info("Error", "Selected record not found");
                        }
                    }}
                />
                <FloatButton
                    tooltip={{ title: "Delete", placement: "left" }}
                    icon={<OverridableIcon name="minus" />}
                    onClick={() => {
                        if (selectedRowKeys.length === 0) {
                            notificationService.info("No selection", "Please select at least one row to delete roles");
                            return;
                        }
                        const selectedRecord = accessControlData?.roles?.find((record) => {
                            const rowKey = `${record.chainId}-${record.elementId}`;
                            return selectedRowKeys.includes(rowKey);
                        });
                        if (selectedRecord) {
                            const accessControlType = (selectedRecord.properties as any)?.accessControlType;
                            if (accessControlType === "ABAC") {
                                notificationService.info("Error", "Can't apply roles to ABAC endpoint");
                                return;
                            }
                            showModal({
                                component: (
                                    <ModificationPopUp
                                        record={selectedRecord}
                                        mode="delete"
                                        onSuccess={() => void getAccessControl()}
                                    />
                                ),
                            });
                        } else {
                            notificationService.info("Error", "Selected record not found");
                        }
                    }}
                />
                <FloatButton
                    tooltip={{ title: "Refresh", placement: "left" }}
                    icon={<OverridableIcon name="redo" />}
                    onClick={() => void getAccessControl()}
                />
            </FloatButtonGroup>
        </Flex>
    );
};

