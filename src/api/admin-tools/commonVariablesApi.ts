import axios, { AxiosInstance } from "axios";

export interface CommonVariable {
  key: string;
  value: string;
}

export class CommonVariablesApi {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.GATEWAY,
      timeout: 1000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getAll(): Promise<CommonVariable[]> {
    try {
      const response = await this.instance.get(
        `/api/v1/${import.meta.env.API_APP}/common-variables`
      );

      const data = response.data;

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const variables: CommonVariable[] = Object.entries(data).map(([key, value]) => ({ key, value: (value as string) || ''}) );

        return variables;
      } else {
        console.warn("Unexpected response format for common variables:", data);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch common variables:", error);
      return [];
    }
  }

  async create(variable: CommonVariable): Promise<string[] | null> {
    return this.createMany({ [variable.key]: variable.value });
  }

  async createMany(variables: Record<string, string>): Promise<string[] | null> {
    try {
      const response = await this.instance.post<string[]>(
        `/api/v1/${import.meta.env.API_APP}/common-variables`,
        variables
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create variables:", error);
      return null;
    }
  }

  async update(variable: CommonVariable): Promise<CommonVariable | null> {
    try {
      const response = await this.instance.patch<CommonVariable>(
        `/api/v1/${import.meta.env.API_APP}/common-variables/${variable.key}`,
        // `/api/v1/common-variables/${variable.key}`,
        variable.value
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
      keys.forEach(key => params.append('variablesNames', key));

      await this.instance.delete(
        `/api/v1/${import.meta.env.API_APP}/common-variables?${params.toString()}`
      );
      return true;
    } catch (error) {
      console.error("Failed to delete variables:", error);
      return false;
    }
  }
}

export const commonVariablesApi = new CommonVariablesApi();