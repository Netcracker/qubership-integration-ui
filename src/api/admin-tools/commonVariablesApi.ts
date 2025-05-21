import axios, { AxiosInstance } from "axios";
import { Variable } from "./variables.ts";


export class CommonVariablesApi {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY,
      timeout: 1000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getAll(): Promise<Variable[]> {
    try {
      const response = await this.instance.get(
        `/api/v1/${import.meta.env.VITE_API_APP}/common-variables`,
      );

      const data = response.data;

      if (data && typeof data === "object" && !Array.isArray(data)) {
        return Object.entries(data).map(([key, value]) => ({
          key,
          value: (value as string) || "",
        }));
      } else {
        console.warn("Unexpected response format for common variables:", data);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch common variables:", error);
      return [];
    }
  }

  async create(variable: Variable): Promise<string[] | null> {
    return this.createMany({ [variable.key]: variable.value });
  }

  async createMany(
    variables: Record<string, string>,
  ): Promise<string[] | null> {
    try {
      const response = await this.instance.post<string[]>(
        `/api/v1/${import.meta.env.VITE_API_APP}/common-variables`,
        variables,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create variables:", error);
      return null;
    }
  }

  async update(variable: Variable): Promise<Variable | null> {
    try {
      const response = await this.instance.patch<Variable>(
        `/api/v1/${import.meta.env.VITE_API_APP}/common-variables/${variable.key}`,
        variable.value,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to update variable:", error);
      return null;
    }
  }

  async delete(keys: string[]): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      keys.forEach((key) => params.append("variablesNames", key));

      await this.instance.delete(
        `/api/v1/${import.meta.env.VITE_API_APP}/common-variables?${params.toString()}`,
      );
      return true;
    } catch (error) {
      console.error("Failed to delete variables:", error);
      return false;
    }
  }

  async exportVariables(keys: string[], asArchive = true): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      if (keys.length > 0) {
        keys.forEach((key) => params.append("variablesNames", key));
      }
      params.append("asArchive", String(asArchive));

      const response = await this.instance.get(
        `/api/v1/${import.meta.env.VITE_API_APP}/common-variables/export?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      const blob = new Blob([response.data], {
        type: asArchive ? "application/zip" : "application/x-yaml",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = asArchive
        ? "common-variables.zip"
        : "common-variables.yaml";
      document.body.appendChild(link);
      link.click();
      return true;
    } catch (error) {
      console.error("Failed to delete variables:", error);
      return false;
    }
  }

  async importVariables(formData: FormData, isPreview: boolean): Promise<any> {
    if (!formData) {
      return
    }
    try {
       const result = await axios.post(
        `/api/${isPreview ? "v1" : "v2"}/${import.meta.env.VITE_API_APP}/common-variables/${isPreview ? "preview" : "import"}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        });
       return result.data;
    } catch (error) {
      const message: string = `Failed to ${isPreview ? "preview" : "import"}:`;
      console.error(message, error);
    }
  }
}

export const commonVariablesApi = new CommonVariablesApi();