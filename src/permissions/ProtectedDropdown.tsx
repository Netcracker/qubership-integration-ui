import { Dropdown, DropdownProps, MenuProps } from "antd";
import { RequiredPermissions } from "./types.ts";
import React, { ReactNode, useEffect, useState } from "react";
import { OnDenied } from "./ProtectedButton.tsx";
import { usePermissions } from "./usePermissions.tsx";
import { hasPermissions } from "./funcs.ts";
import { ItemType } from "antd/es/menu/interface";

export type ProtectedMenuItem = ItemType & {
  onDenied?: OnDenied;
  require?: RequiredPermissions;
};

export type ProtectedDropdownProps = Omit<DropdownProps, "menu"> & {
  menu: Omit<DropdownProps["menu"], "items"> & { items: ProtectedMenuItem[] };
  onItemDenied?: OnDenied;
  onAllDenied?: OnDenied;
};

export const ProtectedDropdown: React.FC<ProtectedDropdownProps> = ({
  menu,
  children,
  onItemDenied = "hide",
  onAllDenied = "hide",
  ...rest
}): ReactNode => {
  const permissions = usePermissions();
  const [menuItems, setMenuItems] = useState<MenuProps["items"]>([]);

  useEffect(() => {
    const items: ItemType[] = [];
    let isStartOrDivider: boolean = true;
    for (const item of menu.items) {
      if (item.type === "divider") {
        if (!isStartOrDivider) {
          items.push(item);
          isStartOrDivider = true;
        }
      } else if (hasPermissions(permissions, item.require ?? {})) {
        items.push(item);
        isStartOrDivider = false;
      } else if (item.onDenied ?? onItemDenied === "disable") {
        items.push({ ...item, disabled: true } as ItemType);
        isStartOrDivider = false;
      }
    }
    // If items list ends with divider then removing it.
    if (items.length > 0 && items[items.length - 1]?.type === "divider") {
      items.pop();
    }
    setMenuItems(items);
  }, [permissions, menu.items, onItemDenied]);

  return menuItems?.length === 0 && onAllDenied === "hide" ? null : (
    <Dropdown
      menu={{
        ...menu,
        items: menuItems,
      }}
      {...rest}
    >
      {children}
    </Dropdown>
  );
};
