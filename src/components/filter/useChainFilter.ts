import { FilterColumn, FilterModel, StringTableFilter, TableFilter } from "./tableFilter";

/* export const useChainsFilter = () => {
    const chainsFilterModel: FilterModel = {
        columnOptions: [
            { value: FilterColumn.NAME, label: "Name" },
            { value: FilterColumn.STATUS, label: "Status" }
        ],
        conditionOptions: [],
        valueOptions: []
    }
    return [ chainsFilterModel ];
} */

export const useChainFilters = () => {
    const tableFilters: TableFilter[] = [
        { id: "NAME", name: "Name", type: StringTableFilter }
    ];

    return [tableFilters];
}