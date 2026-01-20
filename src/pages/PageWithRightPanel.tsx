import Sider from "antd/lib/layout/Sider";
import styles from "../components/elements_library/ElementsLibrarySidebar.module.css";
import {SidebarSearch} from "../components/elements_library/SidebarSearch.tsx";
import React, {useCallback, useRef, useState} from "react";
import {MenuItem} from "../components/elements_library/ElementsLibrarySidebar.tsx";
import { Flex, Tabs } from "antd";
import {OverridableIcon} from "../icons/IconProvider.tsx";
import { FilterButton } from "../components/table/filter/FilterButton.tsx";
import {useChainFilters} from "../hooks/useChainFilter.ts";
import {Filter} from "../components/table/filter/Filter.tsx";
import {FilterItemState} from "../components/table/filter/FilterItem.tsx";
import {FolderFilter} from "../api/apiTypes.ts";
import {useModalsContext} from "../Modals.tsx";

export const PageWithRightPanel = () => {
    const allItems = useRef<MenuItem[]>([]);
    const [isSearch, setIsSearch] = useState(false);
    const { filterColumns, filterItemStates, setFilterItemStates } =
        useChainFilters();
    const [openKeysState, setOpenKeysState] = useState<string[]>();
    const openKeysBeforeSearch = useRef<string[]>();
    const [items, setItems] = useState<MenuItem[]>([]);
    const { showModal } = useModalsContext();
    const [filters, setFilters] = useState<FolderFilter[]>([]);

    const handleSearch = useCallback(
        (filtered: MenuItem[], openKeys: string[]) => {
            if (!isSearch) {
                setIsSearch(true);
                openKeysBeforeSearch.current = openKeysState;
            }
            setOpenKeysState(openKeys);
            setItems(filtered);

        },
        [isSearch, openKeysState],
    );

    const applyFilters = (filterItems: FilterItemState[]) => {
        setFilterItemStates(filterItems);

        const f = filterItems.map(
            (filterItem): FolderFilter => ({
                column: filterItem.columnValue!,
                condition: filterItem.conditionValue!,
                value: filterItem.value,
            }),
        );
        setFilters(f);
    };

    const addFilter = () => {
        showModal({
            component: (
                <Filter
                    filterColumns={filterColumns}
                    filterItemStates={filterItemStates}
                    onApplyFilters={applyFilters}
                />
            ),
        });
    };

    return (
        <Sider width={240} className={styles.sideMenu}>
            <Flex vertical={false} justify="left" style={{ width: '100%' }}>
            <Tabs
                className={styles['spacedTabs']}
                items={[
                  {
                    key: "listElements",
                    label: <OverridableIcon name="unorderedList" />
                  },
                  {
                    key: "elementProperties",
                    label: <OverridableIcon name="block" />
                  },
                ]}
            ></Tabs>
            </Flex>
            <Flex vertical={false} gap={8} style={{ paddingLeft: '12px' }}>
                <SidebarSearch
                    items={allItems.current}
                    onSearch={handleSearch}
                    onClear={() => {
                        setItems(allItems.current);
                        setIsSearch(false);
                        setOpenKeysState(openKeysBeforeSearch.current);
                    }}
                />
                <FilterButton count={filterItemStates.length} onClick={addFilter} />
            </Flex>
        </Sider>
    );
};
