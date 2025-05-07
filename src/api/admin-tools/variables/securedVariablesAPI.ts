import axios, { AxiosInstance } from "axios";

import { Variable, SecretWithVariables, ApiResponse, ApiError } from "./types.ts";

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

  async create(secretName: string, variables: Variable[]): Promise<ApiResponse<Variable[]>> {
    try {
      const keyRegex = /^[a-zA-Z0-9_-]+$/; // Пример. Замените на реальный ENTITY_NAME_REGEXP.
      for (const v of variables) {
        if (!keyRegex.test(v.key)) {
          console.error(`Invalid key: ${v.key}`);
          return { success: false, error: { serviceName: "Secured Variables API", errorMessage: `Invalid key: ${v.key}`, errorDate: new Date().toISOString() } };
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

      // Assuming successful creation means we should return the variables that were created
      return { success: true, data: variables };
    } catch (error: any) {
      console.error("Failed to create secured variables:", error);
      if (axios.isAxiosError(error) && error.response?.data) {
         // Return the backend error response if available and matches ApiError structure
         // Need to ensure the backend error structure matches ApiError or adapt it
         // For now, assuming it might match or we can map necessary fields
         const backendError = error.response.data as ApiError;
         // Basic check if it looks like an ApiError, adapt if structure is different
         if (backendError.errorMessage && backendError.serviceName) {
           return { success: false, error: backendError };
         }
         // If not a standard ApiError from backend, maybe extract a message
         if (typeof error.response.data === 'string') {
             return { success: false, error: { serviceName: "Secured Variables API", errorMessage: error.response.data, errorDate: new Date().toISOString() } };
         }

      }
      // Fallback for other errors or unexpected response formats
      return { 
        success: false,
        error: { 
          serviceName: "Secured Variables API", 
          errorMessage: error.message || "An unknown error occurred.", 
          errorDate: new Date().toISOString() 
        }
      };
    }
  }

  async update(secretName: string, variables: Variable[]): Promise<ApiResponse<Variable[]>> {
    try {
      const payload = {
        secretName,
        variables: Object.fromEntries(
          variables.map((v) => [v.key, v.value])
        ),
      };

      const response = await this.instance.patch(
        `/api/v2/${import.meta.env.VITE_API_APP}/secured-variables`,
        payload
      );

      // Assuming successful update means we should return the variables that were updated
      return { success: true, data: variables };
    } catch (error: any) {
      console.error("Failed to update secured variables:", error);
       if (axios.isAxiosError(error) && error.response?.data) {
         const backendError = error.response.data as ApiError;
         if (backendError.errorMessage && backendError.serviceName) {
           return { success: false, error: backendError };
         }
         if (typeof error.response.data === 'string') {
             return { success: false, error: { serviceName: "Secured Variables API", errorMessage: error.response.data, errorDate: new Date().toISOString() } };
         }
      }
      return { 
        success: false,
        error: { 
          serviceName: "Secured Variables API", 
          errorMessage: error.message || "An unknown error occurred.", 
          errorDate: new Date().toISOString() 
        }
      };
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
    } catch (error: any) { // Added error: any for consistency
      console.error("Failed to delete secured variables:", error);
       // Need to return ApiResponse here too if we want consistent error handling
       // For now, keeping as boolean as per original signature
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