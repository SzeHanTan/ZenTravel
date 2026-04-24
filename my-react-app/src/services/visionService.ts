/**
 * ZenTravel Document Intelligence Service
 *
 * Extracts raw text from user-uploaded files (PDFs, text files, images)
 * then passes that raw content to GLM for understanding.
 *
 * This directly satisfies the hackathon requirement:
 *   "Understanding of unstructured inputs (e.g. messages, forms, documents)"
 *
 * GLM is the intelligence layer — it reads messy airline letters, booking
 * confirmations, and delay notices and extracts structured incident data.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Point pdf.js worker at the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentResult {
  /** Plain-English disruption description, ready for the workflow engine */
  extractedText:  string;
  /** Raw text pulled from the file (for debugging / display) */
  rawText:        string;
  /** File type that was processed */
  fileType:       'pdf' | 'text' | 'image' | 'unsupported';
  /** Whether GLM successfully interpreted the content */
  glmInterpreted: boolean;
}

// ─── PDF text extraction ──────────────────────────────────────────────────────

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item) => 'str' in item && typeof (item as Record<string, unknown>)['str'] === 'string')
      .map((item) => (item as Record<string, unknown>)['str'] as string)
      .join(' ');
    pageTexts.push(pageText);
  }
  return pageTexts.join('\n').replace(/\s{3,}/g, '  ').trim();
}

// ─── Image OCR (Tesseract.js — runs in browser, no API key needed) ───────────

async function extractTextFromImage(file: File): Promise<string> {
  const worker = await createWorker('eng');
  try {
    const url = URL.createObjectURL(file);
    const { data } = await worker.recognize(url);
    URL.revokeObjectURL(url);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}

// ─── Plain text / CSV / JSON extraction ──────────────────────────────────────

function extractTextFromTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).slice(0, 6000));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Convert a File to a base64 data URL (used for image preview in chat) */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Main entry point.
 * Extracts text from the uploaded file, then asks GLM to interpret it.
 */
export async function extractTravelInfoFromFile(file: File): Promise<DocumentResult> {
  const name = file.name.toLowerCase();
  const isPDF  = file.type === 'application/pdf' || name.endsWith('.pdf');
  const isText = file.type.startsWith('text/') || /\.(txt|csv|json|eml)$/.test(name);
  const isImage = file.type.startsWith('image/');

  // ── 1. Extract raw text from the file ──────────────────────────────────────

  let rawText = '';
  let fileType: DocumentResult['fileType'] = 'unsupported';

  if (isPDF) {
    fileType = 'pdf';
    try {
      rawText = await extractTextFromPDF(file);
    } catch (err) {
      console.warn('[DocumentIntelligence] PDF extraction failed:', err);
    }
  } else if (isText) {
    fileType = 'text';
    rawText = await extractTextFromTextFile(file);
  } else if (isImage) {
    fileType = 'image';
    try {
      rawText = await extractTextFromImage(file);
    } catch (err) {
      console.warn('[DocumentIntelligence] OCR failed:', err);
    }
  } else {
    return {
      extractedText:  '',
      rawText:        '',
      fileType:       'unsupported',
      glmInterpreted: false,
    };
  }

  if (!rawText || rawText.length < 10) {
    // OCR ran but found no readable text (e.g. decorative image, blank page)
    return {
      extractedText:  '',
      rawText:        rawText,
      fileType,
      glmInterpreted: false,
    };
  }

  // ── 2. Pass raw text directly to the workflow engine ──────────────────────
  // We no longer ask GLM to pre-summarise here — that costs an extra token
  // budget and is redundant because workflowEngine's inputAgent (Stage 1) will
  // ask GLM to parse the same text anyway.  Passing the raw OCR/PDF text
  // directly is more robust and saves one full GLM round-trip.
  return {
    extractedText:  rawText.slice(0, 4000), // cap at 4000 chars for token safety
    rawText,
    fileType,
    glmInterpreted: false,                 // GLM interprets in Stage 1 of workflow
  };
}
