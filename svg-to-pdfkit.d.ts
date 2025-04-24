declare module 'svg-to-pdfkit' {
  import PDFDocument from 'pdfkit';
  
  export default function SVGtoPDF(
    doc: PDFDocument,
    svg: string,
    x: number,
    y: number,
    options?: {
      width?: number;
      height?: number;
      preserveAspectRatio?: string;
      useCSS?: boolean;
      fontCallback?: (family: string, bold: boolean, italic: boolean) => string;
      fontRegistrationCallback?: (font: string, data: any) => void;
    }
  ): void;
}