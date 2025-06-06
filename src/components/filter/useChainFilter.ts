import { FilterColumn, FilterModel } from "./tableFilter";

export const useChainsFilter = () => {
    const chainsFilterModel: FilterModel = {
        columnOptions: [
            { value: FilterColumn.NAME, label: "Name" },
            { value: FilterColumn.STATUS, label: "Status" }
        ],
        conditionOptions: [],
        valueOptions: []
    }
    return [ chainsFilterModel ];
}