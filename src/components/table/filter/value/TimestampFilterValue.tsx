import { FilterValueProps } from "./FilterValue";
import { FilterCondition } from "../filter";
import { DatePicker } from "antd";
import { useEffect, useState } from "react";
import { toDayjs, toEpochMillis } from "../../../../misc/date-utils";

export const TimestampFilterValue = (props: FilterValueProps) => {
  const [value, setValue] = useState<number[]>(buildInitialValue());
  const isRange = props.condition?.id === FilterCondition.IS_WITHIN.id;

  useEffect(() => {
    if ((isRange && value.length === 1) || !isRange && value.length === 2) {
      setValue([]);
      props.handleStringValue(undefined);
    }
  }, [isRange]);

  function buildInitialValue(): number[] {
    return props.value ? props.value.split(',').map(stringValue => Number(stringValue)) : [];
  }

  if (isRange) {
    return (
      <DatePicker.RangePicker
        format="YYYY-MM-DD"
        value={[toDayjs(value[0]), toDayjs(value[1])]}
        onChange={(newValue) => {
          const newState = newValue?.map(v => toEpochMillis(v)) ?? [];
          props.handleStringValue(newState.join());
          setValue(newState);
        }}
      />
    );
  } else {
    return (
      <DatePicker
        showTime={{ format: 'HH:mm' }}
        format="YYYY-MM-DD HH:mm"
        value={toDayjs(value[0])}
        style={{width: "100%"}}
        onChange={(newValue) => {
          const newState = [toEpochMillis(newValue)];
          props.handleStringValue(newState.join());
          setValue(newState);
        }}
      />
    )
  }
}
