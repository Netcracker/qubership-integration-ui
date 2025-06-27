import Cell from "exceljs/index";
import { api } from "../api/api.ts";
import { LogExportRequestParams } from "../api/apiTypes.ts";
import ExcelJS from "exceljs";
import { downloadFile } from "./download-utils.ts";

const exportLogSources = [
  api.exportSystemCatalogActionsLog,
  api.exportRuntimeCatalogActionsLog,
  api.exportVariablesManagementActionsLog,
];

export async function exportActionsLogAsExcel(dateFrom: Date, dateTo: Date) {
  const requestParams: LogExportRequestParams = {
    actionTimeFrom: dateFrom.getTime(),
    actionTimeTo: dateTo.getTime(),
  };

  const allResponses = await Promise.all(
    exportLogSources.map((actionLogSource) => actionLogSource(requestParams)),
  );

  const filename = `audit-${new Date().toISOString()}.xlsx`;
  const mergedRows: Record<string, Cell.CellValue>[] = [];

  for (const response of allResponses) {
    const buffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    const headerRow = sheet.getRow(1);
    const headers: string[] =
      // @ts-expect-error remove zero element - ExcelJS specific
      headerRow.values?.slice(1).map((cell) => String(cell)) || [];

    sheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;
      const rowData: Record<string, Cell.CellValue> = {};
      row.eachCell((cell, colIndex) => {
        rowData[headers[colIndex - 1]] = cell.value;
      });
      mergedRows.push(rowData);
    });
  }

  mergedRows.sort((actionLogLeft, actionLogRight) => {
    return (
      new Date(actionLogRight["Action Time"]).getTime() -
      new Date(actionLogLeft["Action Time"]).getTime()
    );
  });

  const outWorkbook = new ExcelJS.Workbook();
  const outSheet = outWorkbook.addWorksheet("Action Log");

  if (mergedRows.length > 0) {
    outSheet.columns = Object.keys(mergedRows[0]).map((key) => ({
      header: key,
      key,
      width: 20,
    }));

    mergedRows.forEach((row) => outSheet.addRow(row));
  }

  const outBuffer = await outWorkbook.xlsx.writeBuffer();
  const result = new File([outBuffer], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadFile(result);
}
