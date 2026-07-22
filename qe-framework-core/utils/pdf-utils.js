import fs from 'fs';
import os from 'os';
import path from 'path';
import pdfParse from 'pdf-parse';

function getChromeDownloadsPath() {
  if (process.env.CHROME_DOWNLOADS_PATH) {
    return process.env.CHROME_DOWNLOADS_PATH;
  }

  return path.join(os.homedir(), 'Downloads');
}

function listPdfFiles(downloadsPath, fileName = '') {
  const normalizedFileName = fileName.toLowerCase();
  const allFiles = fs.readdirSync(downloadsPath);

  return allFiles
    .filter((name) => name.toLowerCase().endsWith('.pdf'))
    .filter((name) => {
      if (!normalizedFileName) {
        return true;
      }

      return name.toLowerCase() === normalizedFileName;
    })
    .map((name) => {
      const absolutePath = path.join(downloadsPath, name);
      const fileStats = fs.statSync(absolutePath);
      return { name, absolutePath, size: fileStats.size, mtimeMs: fileStats.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

async function waitForPdfDownload(fileName = '', timeoutMs = 30000, pollIntervalMs = 500) {
  const downloadsPath = getChromeDownloadsPath();

  if (!fs.existsSync(downloadsPath)) {
    throw new Error(`Chrome Downloads path does not exist: ${downloadsPath}`);
  }

  const endTime = Date.now() + timeoutMs;
  while (Date.now() <= endTime) {
    const matchedPdfFiles = listPdfFiles(downloadsPath, fileName);
    if (matchedPdfFiles.length > 0) {
      const latestPdf = matchedPdfFiles[0];
      if (latestPdf.size > 0) {
        return latestPdf;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    fileName
      ? `Timed out waiting for non-empty PDF "${fileName}" in Chrome Downloads path: ${downloadsPath}`
      : `Timed out waiting for a non-empty PDF in Chrome Downloads path: ${downloadsPath}`
  );
}

async function getPdfTextContent(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file does not exist: ${filePath}`);
  }

  const pdfBuffer = fs.readFileSync(filePath);
  if (pdfBuffer.length === 0) {
    throw new Error(`PDF file is empty: ${filePath}`);
  }

  const parsedPdf = await pdfParse(pdfBuffer);
  return parsedPdf.text || '';
}

async function verifyPdfContainsText(filePath, expectedText) {
  const pdfText = await getPdfTextContent(filePath);
  if (!pdfText.includes(expectedText)) {
    throw new Error(`Expected text "${expectedText}" not found in PDF: ${filePath}`);
  }
}

export {
  getChromeDownloadsPath,
  waitForPdfDownload,
  getPdfTextContent,
  verifyPdfContainsText,
};
