import React from "react";
import {
    CheckCircleOutlined,
    CloseOutlined,
    ExclamationCircleOutlined,
    StopOutlined,
    WarningOutlined
} from "@ant-design/icons";
import {List} from "antd";
import {ArgsProps} from "antd/es/notification";

type NotificationBarElementProps = {
    props: ArgsProps,
    onRemove: (props: ArgsProps) => void
}

export const NotificationBarElement: React.FC<NotificationBarElementProps> = ({props, onRemove}) => {

    const getIconByType = (type?: string) => {
        const style = {fontSize: "18", marginTop: 4};
        switch (type) {
            case "success":
                return <CheckCircleOutlined style={{...style, color: "#14fa2b"}}/>;
            case "warning":
                return <WarningOutlined style={{...style, color: "#faad14"}}/>;
            case "error":
                return <StopOutlined style={{...style, color: "#ff4d4f"}}/>;
            case "info":
            default:
                return <ExclamationCircleOutlined style={{...style, color: "#1890ff"}}/>;
        }
    };

    return (
        <List.Item
            actions={[
                <CloseOutlined
                    key="close"
                    style={{cursor: "pointer"}}
                    onClick={() => onRemove(props)}
                />
            ]}
        >
            <List.Item.Meta
                avatar={getIconByType(props.type)}
                title={props.message}
                description={props.description}
            />
        </List.Item>);
}