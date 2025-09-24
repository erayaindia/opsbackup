declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface UserOptions {
    head?: any[][];
    body?: any[][];
    foot?: any[][];
    startY?: number;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    theme?: 'striped' | 'grid' | 'plain';
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      textColor?: number | [number, number, number];
      fillColor?: number | [number, number, number] | false;
      fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    headStyles?: {
      fontSize?: number;
      cellPadding?: number;
      textColor?: number | [number, number, number];
      fillColor?: number | [number, number, number] | false;
      fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    columnStyles?: {
      [key: number]: {
        cellWidth?: number;
        halign?: 'left' | 'center' | 'right';
        valign?: 'top' | 'middle' | 'bottom';
      };
    };
  }

  function autoTable(doc: jsPDF, options: UserOptions): void;
  export default autoTable;
}

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}