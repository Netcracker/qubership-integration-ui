import { useEffect, useState } from "react";
import { message } from "antd";
import { Variable } from "../../../api/admin-tools/variables.ts";

type UseVariablesStateParams = {
  getVariables: () => Promise<Variable[]>;
  createVariable: (v: Variable) => Promise<string[] | null>;
  updateVariable: (v: Variable) => Promise<Variable | null>;
  deleteVariables: (keys: string[]) => Promise<boolean>;
  exportVariables?: (keys: string[]) => Promise<boolean>;
};

export const useVariablesState = ({
                                    getVariables,
                                    createVariable,
                                    updateVariable,
                                    deleteVariables,
                                    exportVariables,
                                  }: UseVariablesStateParams) => {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      const data = await getVariables();
      setVariables(data);
    } catch {
      message.error("Failed to load variables");
    }
  };

  const startEditing = (key: string, value: string) => {
    setEditingKey(key);
    setEditingValue(value);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditingValue("");
  };

  const confirmEdit = async (key: string, newValue: string) => {
    try {
      await updateVariable({ key, value: newValue });
      message.success("Variable updated");
      cancelEditing();
      fetchVariables();
    } catch {
      message.error("Failed to update variable");
    }
  };

  const deleteVariable = async (key: string) => {
    try {
      await deleteVariables([key]);
      message.success(`Deleted ${key}`);
      fetchVariables();
    } catch {
      message.error(`Failed to delete ${key}`);
    }
  };

  const addVariable = async (key: string, value: string) => {
    try {
      await createVariable({ key, value });
      message.success("Variable added");
      setIsAddingNew(false);
      fetchVariables();
    } catch {
      message.error("Failed to add variable");
    }
  };

  const handleExport = async (keys: string[]) => {
    if (!exportVariables) return;
    try {
      await exportVariables(keys);
      message.success("Exported");
    } catch {
      message.error("Failed to export");
    }
  };

  return {
    variables,
    editingKey,
    editingValue,
    isAddingNew,
    setIsAddingNew,
    onStartEditing: startEditing,
    onChangeEditingValue: setEditingValue,
    onCancelEditing: cancelEditing,
    onConfirmEdit: confirmEdit,
    onDelete: deleteVariable,
    onAdd: addVariable,
    onExport: handleExport,
    fetchVariables,
  };
};