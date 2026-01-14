import {Button, Form, Input, Modal} from "antd";
import React, {useState} from "react";
import {useModalContext} from "../../../ModalContextProvider.tsx";
import {AccessControl as AccessControlData} from "../../../api/apiTypes.ts";
import {OverridableIcon} from "../../../icons/IconProvider.tsx";
import styles from "./AbacAttributesPopUp.module.css";

export type AbacAttributesPopUpProps = {
    record: AccessControlData;
};

export const AbacAttributesPopUp: React.FC<AbacAttributesPopUpProps> = ({record}) => {
    const {closeContainingModal} = useModalContext();

    return (
        <Modal
            title="ABAC Parameters"
            open={true}
            onCancel={closeContainingModal}
            footer={[
                <Button key="close" onClick={closeContainingModal}>
                    Close
                </Button>,
            ]}
            width={600}
        >
            <Form
                layout="vertical"
                disabled
                labelCol={{flex: "23px"}}
                wrapperCol={{flex: "auto"}}
                labelWrap
            >
                <Form.Item label="Resource Type">
                    <Input
                        value={record.properties?.abacParameters?.resourceType || ""}
                        placeholder="—"
                    />
                </Form.Item>
                <Form.Item label="Operation">
                    <Input
                        value={record.properties?.abacParameters?.operation || ""}
                        placeholder="—"
                    />
                </Form.Item>
                <Form.Item label="Resource Data Type">
                    <Input
                        value={record.properties?.abacParameters?.resourceDataType || ""}
                        placeholder="—"
                    />
                </Form.Item>
                {record.properties?.abacParameters?.resourceMap && (
                    <Form.Item>
                        <ResourceMapDisplay resourceMap={record.properties.abacParameters.resourceMap}/>
                    </Form.Item>
                )}
                {record.properties?.abacParameters?.resourceString && (
                    <Form.Item label="Resource String">
                        <Input
                            value={record.properties.abacParameters.resourceString}
                            placeholder="—"
                        />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

const ResourceMapDisplay: React.FC<{ resourceMap: Record<string, unknown> }> = ({resourceMap}) => {
    const rowCount = Object.entries(resourceMap).length;
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div>
            <div className={styles.header}>
                <div
                    className={styles.leftHeader}
                    onClick={() => setCollapsed((s) => !s)}
                >
          <span className={styles.iconWrapper}>
            {collapsed ? (
                <OverridableIcon name="right"/>
            ) : (
                <OverridableIcon name="down"/>
            )}
          </span>
                    <span>Resource Map</span>
                    <span className={styles.badge}>{rowCount}</span>
                </div>
            </div>
            {!collapsed &&
                (rowCount === 0 ? (
                    <div className={styles.noEntries}>
                        No entries.
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th className={styles.th}>Name</th>
                            <th className={styles.th}>Value</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.entries(resourceMap).map(([key, value], idx) => (
                            <tr key={idx}>
                                <td className={styles.td}>
                                    <Input
                                        value={key}
                                        disabled
                                        placeholder="Name"
                                    />
                                </td>
                                <td className={styles.td}>
                                    <Input
                                        value={String(value)}
                                        disabled
                                        placeholder="Value"
                                    />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ))}
        </div>
    );
};

