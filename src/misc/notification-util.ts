import {Event, ObjectType} from "../api/apiTypes.ts";
import {ArgsProps} from "antd/es/notification";

export function getNotificationConfiguration(event: Event, notificationType: ObjectType): ArgsProps {
    switch (notificationType) {
        case ObjectType.DEPLOYMENT:
            return getDeploymentNotificationConfiguration(event);
        default :
            return getGeneralNotificationConfiguration(event);
    }

}

function getDeploymentNotificationConfiguration(event: Event): ArgsProps  {
    const deploymentEventStatus = event.data.state.status;
    const chainName = event.data.chainName;
    switch (deploymentEventStatus) {
        case "DEPLOYED": {
            return {
                type: "success",
                message: `${chainName}`,
                description: "Has been deployed successfully",
            }
        }
        case 'PROCESSING':
            return {
                type: "warning",
                message: `${chainName} is progressing`,
            }
        case  'FAILED' : {
            return {
                type: "error",
                message: `${chainName} has been failed`,
            }
        }
        case 'REMOVED': {
            return {
                type: "info",
                message: `${chainName} has been removed successfully`,
            }
        }
    }
    return {
        type: "info",
        message: "default"
    }
}


function getGeneralNotificationConfiguration(event: Event): ArgsProps {
    //TODO For dev purposes
    console.log("Unrecognized event", event);
    return {
        message: "Stub message",
        description: "Stub description",
    }
}