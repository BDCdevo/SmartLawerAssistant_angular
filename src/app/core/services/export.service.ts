import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  exportToExcel(data: any[], filename: string): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  exportToPDF(data: any[], columns: { header: string; dataKey: string }[], filename: string, title: string = ''): void {
    const doc = new jsPDF();

    // Add title if provided
    if (title) {
      doc.setFontSize(16);
      doc.text(title, 14, 15);
    }

    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.dataKey])),
      startY: title ? 25 : 15,
      styles: {
        font: 'helvetica',
        fontSize: 10
      },
      headStyles: {
        fillColor: [0, 150, 136]
      }
    });

    doc.save(`${filename}.pdf`);
  }

  exportTableToPDF(tableId: string, filename: string, title: string = ''): void {
    const doc = new jsPDF();

    if (title) {
      doc.setFontSize(16);
      doc.text(title, 14, 15);
    }

    const table = document.getElementById(tableId);
    if (table && table instanceof HTMLTableElement) {
      autoTable(doc, {
        html: table,
        startY: title ? 25 : 15,
        styles: { font: 'helvetica' },
        headStyles: { fillColor: [0, 150, 136] }
      });
      doc.save(`${filename}.pdf`);
    }
  }
}
