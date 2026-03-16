import { readFile } from 'node:fs/promises'

const PDF_LOCAL_RUNTIME_ERROR_CODE = 'PDF_LOCAL_RUNTIME_UNSUPPORTED'

function buildLocalRuntimeError(cause: unknown): Error {
  const raw = cause instanceof Error ? cause.message : String(cause)
  const message = [
    `${PDF_LOCAL_RUNTIME_ERROR_CODE}: local PDF parsing is unavailable in this environment.`,
    `Root cause: ${raw}`,
    'Mitigation: run document processing with --mode deep (Mistral OCR) for large PDFs.'
  ].join(' ')
  const err = new Error(message)
  err.name = 'PdfLocalRuntimeError'
  return err
}

/**
 * Extrai texto bruto de um PDF localmente usando pdfjs-dist.
 * Executa sem chamadas de API para suportar PDFs grandes.
 */
export async function extractTextFromPdf(pdfPath: string): Promise<string> {
  const pdfBytes = await readFile(pdfPath)
  let pdfjs: typeof import('pdfjs-dist/legacy/build/pdf.mjs')
  try {
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  } catch (error) {
    throw buildLocalRuntimeError(error)
  }

  let pdf: Awaited<ReturnType<(typeof pdfjs)['getDocument']>['promise']>
  try {
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBytes)
    })
    pdf = await loadingTask.promise
  } catch (error) {
    throw buildLocalRuntimeError(error)
  }

  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    let textContent: Awaited<ReturnType<typeof page.getTextContent>>
    try {
      textContent = await page.getTextContent()
    } catch (error) {
      throw buildLocalRuntimeError(error)
    }
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim()
    if (pageText.length > 0) {
      pages.push(pageText)
    }
  }

  return pages.join('\n\n')
}
