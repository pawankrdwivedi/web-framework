import { GoogleSearchPage } from './google-search-page.js';
import { DemoAppPage } from './demo-app-page.js';
import {ParaBankPage} from './para-bank-page.js';
import { PdfPage } from './pdf-page.js';

class PageManager {
  constructor(page) {
    this.page = page;
    this.googleSearchPage = new GoogleSearchPage(page);
    this.demoAppPage = new DemoAppPage(page);
    this.paraBankPage = new ParaBankPage(page);
    this.pdfPage = new PdfPage(page);
  }
}

export default PageManager;
export { PageManager };
