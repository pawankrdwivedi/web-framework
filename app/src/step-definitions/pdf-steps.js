import { Then } from '@cucumber/cucumber';
import { waitForPdfDownload, verifyPdfContainsText, getChromeDownloadsPath } from 'qe-framework-core';

Then('pdf file {string} should be downloaded in Chrome Downloads path and should not be empty', async function (fileName) {
  const downloadedPdf = await waitForPdfDownload(fileName);
  this.runtime.set('lastDownloadedPdfPath', downloadedPdf.absolutePath);
  this.logger.info(`Verified PDF download in ${getChromeDownloadsPath()}: ${downloadedPdf.absolutePath}`);
});

Then('downloaded pdf file should contain text {string}', async function (expectedText) {
  const pdfPath = this.runtime.get('lastDownloadedPdfPath');
  if (!pdfPath) {
    throw new Error('No downloaded PDF path found. Verify PDF download first in the scenario.');
  }

  await verifyPdfContainsText(pdfPath, expectedText);
  this.logger.info(`Verified expected text in PDF: ${pdfPath}`);
});

Then('pdf file {string} should contain text {string}', async function (fileName, expectedText) {
  const downloadedPdf = await waitForPdfDownload(fileName);
  this.runtime.set('lastDownloadedPdfPath', downloadedPdf.absolutePath);
  await verifyPdfContainsText(downloadedPdf.absolutePath, expectedText);
  this.logger.info(`Verified expected text in PDF: ${downloadedPdf.absolutePath}`);
});
