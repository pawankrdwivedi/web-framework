import { Then } from '../support/world.js';
import { waitForPdfDownload, verifyPdfContainsText, getChromeDownloadsPath } from 'qe-framework-core';

Then('pdf file {string} should be downloaded in Chrome Downloads path and should not be empty', async ({ world }, fileName) => {
  const downloadedPdf = await waitForPdfDownload(fileName);
  world.runtime.set('lastDownloadedPdfPath', downloadedPdf.absolutePath);
  world.logger.info(`Verified PDF download in ${getChromeDownloadsPath()}: ${downloadedPdf.absolutePath}`);
});

Then('downloaded pdf file should contain text {string}', async ({ world }, expectedText) => {
  const pdfPath = world.runtime.get('lastDownloadedPdfPath');
  if (!pdfPath) {
    throw new Error('No downloaded PDF path found. Verify PDF download first in the scenario.');
  }

  await verifyPdfContainsText(pdfPath, expectedText);
  world.logger.info(`Verified expected text in PDF: ${pdfPath}`);
});

Then('pdf file {string} should contain text {string}', async ({ world }, fileName, expectedText) => {
  const downloadedPdf = await waitForPdfDownload(fileName);
  world.runtime.set('lastDownloadedPdfPath', downloadedPdf.absolutePath);
  await verifyPdfContainsText(downloadedPdf.absolutePath, expectedText);
  world.logger.info(`Verified expected text in PDF: ${downloadedPdf.absolutePath}`);
});

