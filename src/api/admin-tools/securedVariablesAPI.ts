import axios, { AxiosInstance } from "axios";

import { SecretWithVariables, Variable } from "./variables.ts";

export class SecuredVariablesApi {
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

  async getAll(): Promise<SecretWithVariables[]> {
    try {
      const response = await this.instance.get(
        `/api/v2/${import.meta.env.VITE_API_APP}/secured-variables`
      );

      const secrets = response.data as {
        secretName: string;
        variablesNames: string[];
        defaultSecret: boolean;
      }[];

      return secrets.map(({ secretName, variablesNames, defaultSecret }) => ({
        secretName,
        variables: variablesNames.map((key) => ({
          key,
          value: "******",
        })),
        isDefaultSecret: defaultSecret,
      }));
    } catch (error) {
      console.error("Failed to fetch secured variables:", error);
      return [];
    }
  }

  async getForSecret(secretName: string): Promise<Variable[]> {
    try {
      const response = await this.instance.get(
        `/api/v2/${import.meta.env.VITE_API_APP}/secured-variables/${secretName}`
      );

      const variables = response.data as string[];
      return variables.map((key) => ({ key, value: "******" }));
    } catch (error) {
      console.error("Failed to fetch secret variables:", error);
      return [];
    }
  }

  async create(secretName: string, variables: Variable[]): Promise<boolean> {
    try {
      const keyRegex = /^[a-zA-Z0-9_-]+$/; // Пример. Замените на реальный ENTITY_NAME_REGEXP.
      for (const v of variables) {
        if (!keyRegex.test(v.key)) {
          console.error(`Invalid key: ${v.key}`);
          return false;
        }
      }

      const payload = {
        secretName,
        variables: Object.fromEntries(variables.map(v => [v.key, v.value])),
      };

      const response = await this.instance.post(
        `/api/v2/${import.meta.env.VITE_API_APP}/secured-variables`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error("Failed to create secured variables:", error);
      return false;
    }
  }

  async update(secretName: string, variables: Variable[]): Promise<boolean> {
    try {
      const payload = {
        secretName,
        variables: Object.fromEntries(
          variables.map((v) => [v.key, v.value])
        ),
      };

      await this.instance.patch(
        `/api/v2/${import.meta.env.VITE_API_APP}/secured-variables`,
        payload
      );

      return true;
    } catch (error) {
      console.error("Failed to update secured variables:", error);
      return false;
    }
  }

  async delete(secretName: string, keys: string[]): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      keys.forEach((k) => params.append("variablesNames", k));

      await this.instance.delete(
        `/api/v2/${import.meta.env.VITE_API_APP}/secured-variables/${secretName}?${params.toString()}`
      );

      return true;
    } catch (error) {
      console.error("Failed to delete secured variables:", error);
      return false;
    }
  }

  async createSecret(secretName: string): Promise<boolean> {
    try {
      await this.instance.post(
        `/api/v2/${import.meta.env.VITE_API_APP}/secret/${secretName}`
      );
      return true;
    } catch (error) {
      console.error("Failed to create secret:", error);
      return false;
    }
  }

  async downloadHelmChart(secretName: string): Promise<void> {
    try {
      const response = await this.instance.get(
        `/api/v2/${import.meta.env.VITE_API_APP}/secret/template/${secretName}`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/x-yaml",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${secretName}.yaml`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.error("Failed to download Helm chart:", error);
    }
  }
}

export const securedVariablesApi = new SecuredVariablesApi();