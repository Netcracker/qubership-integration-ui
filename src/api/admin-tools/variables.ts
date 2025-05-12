import { commonVariablesApi } from "./commonVariablesApi";
import { CommonVariable } from "./commonVariablesApi";

export const getCommonVariables = async (): Promise<CommonVariable[]> => {
  return await commonVariablesApi.getAll();
};

export const createCommonVariable = async (
  variable: CommonVariable
): Promise<CommonVariable | null> => {
  return await commonVariablesApi.create(variable);
};

export const updateCommonVariable = async (
  variable: CommonVariable
): Promise<CommonVariable | null> => {
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