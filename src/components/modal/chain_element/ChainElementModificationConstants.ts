export const INITIAL_UI_SCHEMA = {
  "ui:submitButtonOptions": {
    norender: true,
  },
  "ui:order": ["*", "name", "description"],
  properties: {
    "ui:order": [
      "contextPath",
      "httpBinding",
      "rejectRequestIfNonNullBodyGetDelete",
      "enableIdempotency",
      "idempotencyKeyExpression",
      "idempotencyKeyExpiry",
      "*",
    ],
    contextPath: {
      "ui:widget": "uri",
      "ui:placeholder": "e.g. /api/v1/resource",
    },
    handlerContainer: {
      exportFileExtension: {
        "ui:widget": "hidden",
      },
      propertiesToExportInSeparateFile: {
        "ui:widget": "hidden",
      },
      propertiesFilename: {
        "ui:widget": "hidden",
      },
      script: {
        "ui:widget": "textarea",
      },
    },
    invalidURI: {
      "ui:widget": "hidden",
    },
    httpBinding: {
      "ui:widget": "hidden",
    },
    chainFailureHandlerContainer: {
      exportFileExtension: {
        "ui:widget": "hidden",
      },
      propertiesToExportInSeparateFile: {
        "ui:widget": "hidden",
      },
      propertiesFilename: {
        "ui:widget": "hidden",
      },
      script: {
        "ui:widget": "textarea",
      },
    },
    exportFileExtension: {
      "ui:widget": "hidden",
    },
    propertiesToExportInSeparateFile: {
      "ui:widget": "hidden",
    },
    propertiesFilename: {
      "ui:widget": "hidden",
    },
    validationSchema: {
      "ui:widget": "textarea",
    },
    roles: {
      "ui:widget": "tagsWidget",
    },
    script: {
      "ui:widget": "textarea",
    },
    allowedContentTypes: {
      "ui:widget": "tagsWidget",
    },
    httpMethodRestrict: {
      "ui:widget": "multipleSelectWidget",
    },
    abacResource: {
      "ui:tab": "Access Control",
    },
    replyTo: {
      "ui:widget": "tagsWidget",
    },
    cc: {
      "ui:widget": "tagsWidget",
    },
    bcc: {
      "ui:widget": "tagsWidget",
    },
    to: {
      "ui:widget": "tagsWidget",
    },
    idempotency: {
      keyExpiry: {
        "ui:widget": "oneOfExpressionInputWidget",
      },
    },
    connectTimeout: {
      "ui:widget": "oneOfExpressionInputWidget",
    },
  },
  id: { "ui:widget": "hidden" },
  elementType: { "ui:widget": "hidden" },
  type: { "ui:widget": "hidden" },
  folder: { "ui:widget": "hidden" },
  propertiesFilename: { "ui:widget": "hidden" },
  swimlaneId: { "ui:widget": "hidden" },
};

export const pathToTabMap = {
  "properties.contextPath": "Endpoint",
  "properties.oneOf_select": "Endpoint",
  "properties.integrationOperationId": "Endpoint",
  "properties.integrationSpecificationGroupId": "Endpoint",
  "properties.integrationSpecificationId": "Endpoint",
  "properties.integrationSystemId": "Endpoint",
  "properties.integrationOperationMethod": "Endpoint",
  "properties.integrationOperationPath": "Endpoint",
  "properties.httpMethodRestrict": "Endpoint",
  "properties.handleValidationAction": "Handle Validation Failure",
  "properties.handlerContainer": "Handle Validation Failure",
  "properties.handlerContainer.script": "Handle Validation Failure",
  "properties.handleChainFailureAction": "Failure Response Mapping",
  "properties.chainFailureHandlerContainer": "Failure Response Mapping",
  "properties.chainFailureHandlerContainer.elementId":
    "Failure Response Mapping",
  "properties.chainFailureHandlerContainer.script": "Failure Response Mapping",
  "properties.validationSchema": "Validate Request",
  "properties.roles": "Access Control",
  "properties.abacResource": "Access Control",
  "properties.accessControlType": "Access Control",
  "properties.allowedContentTypes": "Validate Request",
  "properties.rejectRequestIfNonNullBodyGetDelete": "Validate Request",
  "properties.idempotency": "Idempotency",
  "properties.idempotency.enabled": "Idempotency",
  "properties.idempotency.keyExpiry": "Idempotency",
  "properties.idempotency.contextExpression": "Idempotency",
  "properties.idempotency.keyExpression": "Idempotency",
  "properties.idempotency.actionOnDuplicate": "Idempotency",
  "properties.idempotency.chainTriggerParameters": "Idempotency",
  "properties.idempotency.chainTriggerParameters.triggerElementId":
    "Idempotency",
  "properties.idempotency.chainTriggerParameters.chainCallTimeout":
    "Idempotency",
};

export const desiredTabOrder = [
  "Endpoint",
  "Validate Request",
  "Handle Validation Failure",
  "Failure Response Mapping",
  "Access Control",
  "Idempotency",
  "Parameters",
];
