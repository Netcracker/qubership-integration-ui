
export interface KafkaMaasFormData {
  namespace: string;
  topicClassifierName: string;
}

export interface RabbitMQMaasFormData {
  namespace: string;
  vhost: string;
  exchange: string;
  queue: string;
  routingKey: string;
}

export interface MaasInstance {
  id: string;
  address: string;
  defaultInstance: boolean;
  protocol: string;
  properties: { [key: string]: string };
}

export interface KafkaTopic {
  topic: string;
  classifierName: string;
}

export interface MaasFormActionsProps {
  createInProgress: boolean;
  isFormValid: boolean;
  onCreate: () => void;
  onReset: () => void;
}

export interface MaasPageHeaderProps {
  title: string;
  exportInProgress: boolean;
  isFormValid: boolean;
  onExport: () => void;
}
