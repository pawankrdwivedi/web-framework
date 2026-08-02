import { basePage } from 'qe-framework-core';

class PdfPage extends basePage {
  constructor(page) {
    super(page);
    // Add locators for PDF download here if needed
  }

  async downloadPdf() {
    // Implement PDF download logic here
  }
}

export default PdfPage;
export { PdfPage };
