import * as ExcelJS from 'exceljs';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Generates an Excel buffer from the provided data array.
 * 
 * @param data Array of objects to be written as rows
 * @param columns Optional array of column definitions. If not provided, defaults to ID, Name, Email.
 * @returns Promise resolving to a Buffer containing the Excel file
 */
export async function generateExcel(data: any[], columns?: ExcelColumn[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  if (columns) {
    worksheet.columns = columns;
  } else {
    // Hardcoded columns mapping as per original ExcelService (Backward compatibility)
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
    ];
  }

  worksheet.addRows(data);

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}