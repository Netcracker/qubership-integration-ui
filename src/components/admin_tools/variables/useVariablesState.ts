import { useEffect, useState } from "react";
import { message } from "antd";
import { Variable, ApiResponse, ApiError } from "../../../api/admin-tools/variables";

export const NEW_VARIABLE_KEY = "__new__";

type UseVariablesStateParams = {
  getVariables: () => Promise<Variable[]>;
  createVariable: (v: Variable) => Promise<ApiResponse<string[]>>;
  updateVariable: (v: Variable) => Promise<ApiResponse<Variable>>;
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
      const cleanedData = data.map(v => ({
        ...v,
        value: v.value
          .replace(/^["']|["']$/g, '')
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
      }));
      setVariables(cleanedData);
    } catch {
      message.error("Failed to load variables");
    }
  };

  const startEditing = (key: string, value: string) => {
    setEditingKey(key);
    setEditingValue(value
      .replace(/^["']|["']$/g, '')
      .replace(/\\"/g, '"')
    );
  };

  const cancelEditing = () => {
    if (editingKey === null) {
      setIsAddingNew(false);
    }
    setEditingKey(null);
    setEditingValue("");
  };

  const confirmEdit = async (key: string, newValue: string) => {
    try {
      const response = await updateVariable({ key, value: newValue });
      if (response.success) {
        message.success("Variable updated");
        cancelEditing();
        fetchVariables();
      } else {
        message.error(response.error?.errorMessage || "Failed to update variable");
      }
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
    if (key === NEW_VARIABLE_KEY) {
      message.error(`Cannot save variable with key '${NEW_VARIABLE_KEY}'`);
      return;
    }
    try {
      const response = await createVariable({ key, value: value });
      if (response.success) {
        message.success("Variable added");
        setIsAddingNew(false);
        fetchVariables();
      } else {
        message.error(response.error?.errorMessage || "Failed to add variable");
      }
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