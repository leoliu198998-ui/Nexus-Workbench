import * as ExcelJS from 'exceljs';

/**
 * Generates an Excel buffer from the provided data array.
 * 
 * @param data Array of objects to be written as rows
 * @returns Promise resolving to a Buffer containing the Excel file
 */
export async function generateExcel(data: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  // Hardcoded columns mapping as per original ExcelService
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
  ];

  worksheet.addRows(data);

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
