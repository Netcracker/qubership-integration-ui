import { commonVariablesApi } from "./commonVariablesApi";
import { securedVariablesApi } from "./securedVariablesAPI.ts";

export type Variable = {
  key: string;
  value: string;
}

export type SecretWithVariables = {
  secretName: string;
  variables: Variable[];
  isDefaultSecret: boolean;
};

export const getCommonVariables = async (): Promise<Variable[]> => {
  return await commonVariablesApi.getAll();
};

export const createCommonVariable = async (
  variable: Variable
): Promise<string[] | null> => {
  return await commonVariablesApi.create(variable);
};

export const updateCommonVariable = async (
  variable: Variable
): Promise<Variable | null> => {
  return await commonVariablesApi.update(variable);
};

export const deleteCommonVariables = async (
  keys: string[]
): Promise<boolean> => {
  return await commonVariablesApi.delete(keys);
};

export const exportVariables = async (
  keys: string[],
  asArchive: boolean = true
): Promise<boolean> => {
  return await commonVariablesApi.exportVariables(keys, asArchive);
}

export const importVariables = async (
  formData: FormData,
  isPreview: boolean
): Promise<any> => {
  return await commonVariablesApi.importVariables(formData, isPreview);
}

export const getSecuredVariables = async (): Promise<
  SecretWithVariables[]
> => {
  return await securedVariablesApi.getAll();
};

export const getSecuredVariablesForSecret = async (
  secretName: string
): Promise<Variable[]> => {
  return await securedVariablesApi.getForSecret(secretName);
};

export const createSecuredVariables = async (
  secretName: string,
  variables: Variable[]
): Promise<boolean> => {
  return await securedVariablesApi.create(secretName, variables);
};

export const updateSecuredVariables = async (
  secretName: string,
  variables: Variable[]
): Promise<boolean> => {
  return await securedVariablesApi.update(secretName, variables);
};

export const deleteSecuredVariables = async (
  secretName: string,
  keys: string[]
): Promise<boolean> => {
  return await securedVariablesApi.delete(secretName, keys);
};

export const createSecret = async (secretName: string): Promise<boolean> => {
  return await securedVariablesApi.createSecret(secretName);
};

export const downloadHelmChart = async (
  secretName: string
): Promise<void> => {
  return await securedVariablesApi.downloadHelmChart(secretName);
};