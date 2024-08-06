import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


import { Injectable, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
// service allows to export data from current view
@Injectable({
  providedIn: 'root'
})
export class DataExportService {

  datePipe: DatePipe = inject(DatePipe)

  constructor() { }

  filetype: string = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  fileExtension: string = 'xlsx';

  // 
  public exportData(data: any, fileName: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    // 
    const excelBuffer: any = XLSX.write(wb, { type: 'array' });
    this.saveAsExcelFile(excelBuffer, fileName);
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: this.filetype });
    saveAs(data, fileName + '_export_' + new Date().getTime() + '.' + this.fileExtension);
  }

  // Function to format date 
  public formatDate(dateString: string): string {
    return this.datePipe.transform(dateString, 'dd-MM-yyyy');
  }



}
