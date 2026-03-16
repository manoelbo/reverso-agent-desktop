export type ClaimType = "CLAIM" | "RED_FLAG" | "DISCREPANCY"

export type ClaimBlock = {
  type: ClaimType
  page: string
  quote: string
  tags: string
  explanation: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const CLAIM_TYPE_CLASSES: Record<ClaimType, { container: string; badge: string }> = {
  CLAIM: {
    container: "border-l-sky-500/60 bg-sky-500/5",
    badge: "border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  RED_FLAG: {
    container: "border-l-destructive/60 bg-destructive/5",
    badge: "border-destructive/30 bg-destructive/15 text-destructive",
  },
  DISCREPANCY: {
    container: "border-l-amber-500/60 bg-amber-500/5",
    badge: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
}

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  CLAIM: "Claim",
  RED_FLAG: "Red Flag",
  DISCREPANCY: "Discrepancy",
}

function buildClaimHtml(block: ClaimBlock): string {
  const styles = CLAIM_TYPE_CLASSES[block.type]
  const typeKey = block.type.toLowerCase().replace("_", "-")

  const tagsHtml = block.tags
    ? `<span class="reverso-claim-tags text-[10px] text-muted-foreground/60 ml-auto truncate max-w-[40ch]">${escapeHtml(block.tags)}</span>`
    : ""

  const explanationHtml = block.explanation
    ? `<p class="reverso-claim-explanation mt-2 text-[13px] leading-6 text-muted-foreground">${escapeHtml(block.explanation)}</p>`
    : ""

  return [
    `<div class="reverso-claim reverso-claim--${typeKey} my-3 overflow-hidden rounded-lg border-l-2 px-4 py-3 ${styles.container}" data-claim-type="${block.type}">`,
    `<div class="reverso-claim-header flex items-center gap-2 flex-wrap">`,
    `<span class="reverso-claim-badge inline-flex h-5 shrink-0 items-center rounded-full border px-2 text-[10px] font-semibold tracking-wide ${styles.badge}">${escapeHtml(CLAIM_TYPE_LABELS[block.type])}</span>`,
    block.page ? `<span class="reverso-claim-page text-[11px] font-mono text-muted-foreground/70">${escapeHtml(block.page)}</span>` : "",
    tagsHtml,
    `</div>`,
    block.quote
      ? `<blockquote class="reverso-claim-quote mt-2 border-0 p-0 text-sm leading-7 text-foreground/80 italic">&ldquo;${escapeHtml(block.quote)}&rdquo;</blockquote>`
      : "",
    explanationHtml,
    `</div>`,
  ].join("")
}

/**
 * Transforms CLAIM/RED_FLAG/DISCREPANCY list items in "Generated notes" sections
 * into styled HTML cards. Runs before markdown-it as a text preprocessor.
 *
 * Input pattern (quote may span multiple lines):
 *   - **TYPE** — Page N: "quoted text possibly
 *     multiline" [tag1, tag2]
 *     - Explanation text.
 */
export function transformClaimBlocks(raw: string): string {
  const lines = raw.split("\n")
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const claimMatch = line.match(/^- \*\*(CLAIM|RED_FLAG|DISCREPANCY)\*\* — (.*)$/)

    if (!claimMatch) {
      result.push(line)
      i++
      continue
    }

    const type = claimMatch[1] as ClaimType
    let rest = claimMatch[2] // "Page N: "quote..." [tags]" or beginning thereof
    i++

    // Collect continuation lines of the quote (until we find closing `" [` or `"` at EOL)
    // A continuation line is NOT a new claim or explanation (doesn't start with `- **` or `  - `)
    while (i < lines.length) {
      const nextLine = lines[i]
      if (
        nextLine.startsWith("- **") ||
        nextLine.startsWith("  - ") ||
        nextLine === "" ||
        nextLine.match(/^#+\s/)
      ) {
        break
      }
      // Check if current accumulated rest already closed the quote
      if (rest.match(/"[^"]*"\s*(?:\[[^\]]*\])?\s*$/) && !rest.endsWith('",')) {
        break
      }
      rest += "\n" + nextLine
      i++
    }

    // Parse: Page N: "quote" [tags]
    const pageMatch = rest.match(/^(Page \d+): "([\s\S]*?)"(?:\s*\[([^\]]*)\])?\s*$/)

    if (!pageMatch) {
      // Fallback: emit as-is (don't transform if parse fails)
      result.push(`- **${type}** — ${rest}`)
      continue
    }

    const page = pageMatch[1]
    const quote = pageMatch[2]
    const tags = pageMatch[3] ?? ""

    // Collect explanation: immediately following lines starting with `  - `
    let explanation = ""
    while (i < lines.length && lines[i].startsWith("  - ")) {
      explanation += (explanation ? " " : "") + lines[i].slice(4).trim()
      i++
    }

    result.push(buildClaimHtml({ type, page, quote, tags, explanation }))
  }

  return result.join("\n")
}
