import { SelectProps } from "antd";

export type TableFilterType = 'string' | 'number' | 'date' | 'select' | 'multipleSelect';

export class FilterConditionNew {
  public static readonly contains = {id: 'contains', name: 'Contains'};

  private constructor(
    public readonly id: string,
    public readonly name: string
  ) { }
}

export enum FilterValueType {
    LIST = 'LIST',
    LIST_WITH_CUSTOM_VALUES = 'LIST_WITH_CUSTOM_VALUES',
    STRING = 'STRING',
    DATE = 'DATE',
}

export interface FilterTypeConditions { //FilterColumnProperties
    defaultCondition: FilterConditionNew;
    allowedConditions: FilterConditionNew[];
    valueType: FilterValueType;
}

export type FilterType = {
  name: 'string' | 'number' | 'date' | 'select' | 'multipleSelect';
  conditions: FilterTypeConditions;
}

export type TableFilter = {
  id: string;
  name: string;
  type: FilterType
}

export const StringTableFilter: FilterType = {
  name: 'string',
  conditions: {
    defaultCondition: FilterConditionNew.contains,
    allowedConditions: [
      FilterConditionNew.contains
      /* FilterCondition.CONTAINS,
      FilterCondition.DOES_NOT_CONTAIN,
      FilterCondition.START_WITH,
      FilterCondition.ENDS_WITH */
    ],
    valueType: FilterValueType.STRING,
  }
};

export const s: FilterType = StringTableFilter;

export type TableFilterDropdownColumnItem = {
  name?: string;
  id?: string;
  type?: TableFilterType;
}

export type FilterModel = {
  columnOptions: SelectProps["options"];
  conditionOptions: SelectProps["options"];
  valueOptions: SelectProps["options"];
}

/* export class FilterColumnNew {
  id: string;



} */

export type FilterColumnNew = {
  id: string;
  name: string;
  type: TableFilterType;
}

export enum FilterColumn {
  STATUS = 'STATUS',
  ENGINES = 'ENGINES',
  LOGGING = 'LOGGING',
  NAME = 'NAME',
  ID = 'ID',
  DESCRIPTION = 'DESCRIPTION',
  PATH = 'PATH',
  METHOD = 'METHOD',
  TOPIC = 'TOPIC',
  EXCHANGE = 'EXCHANGE',
  QUEUE = 'QUEUE',
  PROTOCOL = 'PROTOCOL',
  SERVICE_ID = 'SERVICE_ID',
  OPERATION = 'OPERATION',
  ENTITY_ID = 'ENTITY_ID',
  ENTITY_TYPE = 'ENTITY_TYPE',
  ENTITY_NAME = 'ENTITY_NAME',
  PARENT_ID = 'PARENT_ID',
  PARENT_NAME = 'PARENT_NAME',
  REQUEST_ID = 'REQUEST_ID',
  LABELS = 'LABELS',
  ENDPOINT = 'ENDPOINT',
  TYPE = 'TYPE',
  ROLES = 'ROLES',
  CHAIN = 'CHAIN',
  CHAIN_ID = 'CHAIN_ID',
  CHAIN_NAME = 'CHAIN_NAME',
  CHAIN_STATUS = 'CHAIN_STATUS',
  ELEMENT = 'ELEMENT',
  KEY = 'KEY',
  VALUE = 'VALUE',
  START_TIME = 'START_TIME',
  FINISH_TIME = 'FINISH_TIME',
  END_TIME = 'END_TIME',
  CREATED = 'CREATED',
  SPECIFICATION_GROUP = 'SPECIFICATION_GROUP',
  SPECIFICATION_VERSION = 'SPECIFICATION_VERSION',
  URL = 'URL',
  ACTION_TIME = 'ACTION_TIME',
  ELEMENT_ID = 'ELEMENT_ID',
  ELEMENT_NAME = 'ELEMENT_NAME',
  ELEMENT_TYPE = 'ELEMENT_TYPE',
  ELEMENT_PROPERTY_NAME = 'ELEMENT_PROPERTY_NAME',
  ELEMENT_PROPERTY_SOURCE = 'ELEMENT_PROPERTY_SOURCE',
  ELEMENT_PROPERTY_TYPE = 'ELEMENT_PROPERTY_TYPE',
  ELEMENT_PROPERTY_USAGE_TYPE = 'ELEMENT_PROPERTY_USAGE_TYPE',
  INITIATOR = 'INITIATOR',
  VALIDATION_SEVERITY = 'VALIDATION_SEVERITY',
  OVERRIDDEN_BY = 'OVERRIDDEN_BY',
  INSTRUCTION_ACTION = 'INSTRUCTION_ACTION',
  MODIFIED_WHEN = 'MODIFIED_WHEN',
  DOMAINS = 'DOMAINS',
}

/* export enum FilterCondition {
    IS = 'IS',
    IS_NOT = 'IS_NOT',
    CONTAINS = 'CONTAINS',
    DOES_NOT_CONTAIN = 'DOES_NOT_CONTAIN',
    START_WITH = 'START_WITH',
    ENDS_WITH = 'ENDS_WITH',
    IN = 'IN',
    NOT_IN = 'NOT_IN',
    EMPTY = 'EMPTY',
    NOT_EMPTY = 'NOT_EMPTY',
    IS_AFTER = 'IS_AFTER',
    IS_BEFORE = 'IS_BEFORE',
    IS_WITHIN = 'IS_WITHIN',
} */

/* export type FilterConditionItem = {
  id?: string;
  text?: string;
  disabled?: boolean;
  value?: any;
  styleClass?: string;
  customData?: T;
  [key: string]: any;
}

export const ConditionsFilterDropdownMapping: { [condition: string]: FilterConditionItem } = {
    [FilterCondition.IS]: { id: 'equals', text: 'Is', type: 'equals', customData: FilterCondition.IS },
    [FilterCondition.IS_NOT]: { id: 'not-equals', text: 'Is not', type: 'not-equals', customData: FilterCondition.IS_NOT },
    [FilterCondition.CONTAINS]: { id: 'contains', text: 'Contains', type: 'contains', customData: FilterCondition.CONTAINS },
    [FilterCondition.DOES_NOT_CONTAIN]: { id: 'does-not-contain', text: 'Does not contain', type: 'does-not-contain', customData: FilterCondition.DOES_NOT_CONTAIN },
    [FilterCondition.START_WITH]: { id: 'start-with', text: 'Starts with', type: 'start-with', customData: FilterCondition.START_WITH },
    [FilterCondition.ENDS_WITH]: { id: 'ends-with', text: 'Ends with', type: 'ends-with', customData: FilterCondition.ENDS_WITH },
    [FilterCondition.IN]: { id: 'in', text: 'In', type: 'in', customData: FilterCondition.IN },
    [FilterCondition.NOT_IN]: { id: 'not-in', text: 'Not in', type: 'in', customData: FilterCondition.NOT_IN },
    [FilterCondition.EMPTY]: { id: 'empty', text: 'Empty', type: 'empty', customData: FilterCondition.EMPTY },
    [FilterCondition.NOT_EMPTY]: { id: 'not-empty', text: 'Not empty', type: 'not-empty', customData: FilterCondition.NOT_EMPTY },
    [FilterCondition.IS_BEFORE]: { id: 'less-than', text: 'Is before', type: 'less-than', customData: FilterCondition.IS_BEFORE },
    [FilterCondition.IS_AFTER]: { id: 'greater-than', text: 'Is after', type: 'greater-than', customData: FilterCondition.IS_AFTER },
    [FilterCondition.IS_WITHIN]: { id: 'range', text: 'Is within', type: 'range', customData: FilterCondition.IS_WITHIN },
};

export const StringColumnProperties: FilterTypeConditions = {
    defaultCondition: FilterCondition.CONTAINS,
    allowedConditions: [
        FilterCondition.CONTAINS,
        FilterCondition.DOES_NOT_CONTAIN,
        FilterCondition.START_WITH,
        FilterCondition.ENDS_WITH
    ],
    valueType: FilterValueType.STRING,
};

export const DateColumnProperties: FilterTypeConditions = {
    defaultCondition: FilterCondition.IS_BEFORE,
    allowedConditions: [
        FilterCondition.IS_AFTER,
        FilterCondition.IS_BEFORE,
        FilterCondition.IS_WITHIN,
    ],
    valueType: FilterValueType.DATE,
};

export const FilterColumnPropertiesMap: { [column: string]: FilterTypeConditions } = {
    [FilterColumn.STATUS]: DefaultListColumnProperties,
    [FilterColumn.ENGINES]: ContainsStringColumnProperties,
    [FilterColumn.LOGGING]: DefaultListColumnProperties,
    [FilterColumn.NAME]: DefaultStringColumnProperties,
    [FilterColumn.ID]: IdStringColumnProperties,
    [FilterColumn.DESCRIPTION]: DescriptionColumnProperties,
    [FilterColumn.PATH]: AdvancedStringColumnProperties,
    [FilterColumn.METHOD]: DefaultListColumnProperties,
    [FilterColumn.TOPIC]: AdvancedStringColumnProperties,
    [FilterColumn.EXCHANGE]: AdvancedStringColumnProperties,
    [FilterColumn.QUEUE]: AdvancedStringColumnProperties,
    [FilterColumn.PROTOCOL]: DefaultListColumnProperties,
    [FilterColumn.SERVICE_ID]: DefaultListColumnProperties,
    [FilterColumn.OPERATION]: DefaultListColumnProperties,
    [FilterColumn.ENTITY_ID]: IdStringColumnProperties,
    [FilterColumn.ENTITY_TYPE]: DefaultListColumnProperties,
    [FilterColumn.ENTITY_NAME]: DefaultStringColumnProperties,
    [FilterColumn.PARENT_ID]: IdStringColumnProperties,
    [FilterColumn.PARENT_NAME]: DefaultStringColumnProperties,
    [FilterColumn.REQUEST_ID]: IdStringColumnProperties,
    [FilterColumn.ELEMENT]: DefaultListColumnProperties,
    [FilterColumn.LABELS]: LabelsAndRolesColumnProperties,
    [FilterColumn.KEY]: VariableKeyStringColumnProperties,
    [FilterColumn.VALUE]: VariableValueStringColumnProperties,
    [FilterColumn.CHAIN]: DefaultStringColumnProperties,
    [FilterColumn.CREATED]: DateColumnProperties,
    [FilterColumn.SPECIFICATION_GROUP]: DefaultStringColumnProperties,
    [FilterColumn.SPECIFICATION_VERSION]: DefaultStringColumnProperties,
    [FilterColumn.URL]: VariableKeyStringColumnProperties,
    [FilterColumn.ACTION_TIME]: DateColumnProperties,
    [FilterColumn.TYPE]: DefaultListColumnProperties,
    [FilterColumn.CHAIN_STATUS]: DefaultListColumnProperties,
    [FilterColumn.START_TIME]: DateColumnProperties,
    [FilterColumn.FINISH_TIME]: DateColumnProperties,
    [FilterColumn.END_TIME]: DateColumnProperties,
    [FilterColumn.ROLES]: LabelsAndRolesColumnProperties,
    [FilterColumn.ENDPOINT]: AdvancedStringColumnProperties,

    [FilterColumn.ELEMENT_NAME]: DefaultStringColumnProperties,
    [FilterColumn.ELEMENT_TYPE]: DefaultListColumnProperties,
    [FilterColumn.ELEMENT_PROPERTY_NAME]: DefaultStringColumnProperties,
    [FilterColumn.ELEMENT_PROPERTY_SOURCE]: DefaultListColumnProperties,
    [FilterColumn.ELEMENT_PROPERTY_TYPE]: DefaultListColumnProperties,
    [FilterColumn.ELEMENT_PROPERTY_USAGE_TYPE]: DefaultListColumnProperties,

    [FilterColumn.INITIATOR]: DefaultStringColumnProperties,

    [FilterColumn.VALIDATION_SEVERITY]: DefaultListColumnProperties,

    [FilterColumn.CHAIN_ID]: IdStringColumnProperties,
    [FilterColumn.CHAIN_NAME]: AdvancedStringColumnProperties,
    [FilterColumn.ELEMENT_ID]: IdStringColumnProperties,
    [FilterColumn.ELEMENT_NAME]: AdvancedStringColumnProperties,
    [FilterColumn.VALIDATION_SEVERITY]: DefaultListColumnProperties,

    [FilterColumn.INSTRUCTION_ACTION]: DefaultListColumnProperties,
    [FilterColumn.OVERRIDDEN_BY]: IdStringColumnProperties,
    [FilterColumn.MODIFIED_WHEN]: DateColumnProperties,
    [FilterColumn.DOMAINS]: DefaultListColumnProperties,

    // add properties mapping for new columns here
}; */