export type MarkdownFrontmatter = Record<string, unknown>

export type ParsedMarkdownDocument = {
  frontmatter: MarkdownFrontmatter
  content: string
}

function parseScalar(value: string): unknown {
  const normalized = value.trim()
  if (!normalized) return ""
  if (normalized === "[]") return []
  if (normalized === "true") return true
  if (normalized === "false") return false
  if (normalized === "null") return null

  if ((normalized.startsWith('"') && normalized.endsWith('"')) || (normalized.startsWith("'") && normalized.endsWith("'"))) {
    return normalized.slice(1, -1)
  }

  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    const asNumber = Number(normalized)
    if (!Number.isNaN(asNumber)) return asNumber
  }

  return normalized
}

function parseFrontmatterYaml(yamlBlock: string): MarkdownFrontmatter {
  const data: MarkdownFrontmatter = {}
  const lines = yamlBlock.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim()) continue

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!keyMatch) continue

    const [, key, inlineValue] = keyMatch

    if (inlineValue) {
      data[key] = parseScalar(inlineValue)
      continue
    }

    const listValues: unknown[] = []
    let cursor = index + 1
    while (cursor < lines.length) {
      const candidate = lines[cursor]
      if (!candidate.trim()) {
        cursor += 1
        continue
      }

      if (/^[A-Za-z0-9_-]+:\s*/.test(candidate)) {
        break
      }

      const listItemMatch = candidate.match(/^\s*-\s+(.*)$/)
      if (listItemMatch) {
        listValues.push(parseScalar(listItemMatch[1]))
        cursor += 1
        continue
      }

      if (candidate.trim() === "[]") {
        cursor += 1
        continue
      }

      listValues.push(parseScalar(candidate.trim()))
      cursor += 1
    }

    data[key] = listValues
    index = cursor - 1
  }

  return data
}

export function parseFrontmatter(raw: string): ParsedMarkdownDocument {
  const normalized = raw.replace(/\r\n/g, "\n")
  if (!normalized.startsWith("---\n")) {
    return {
      frontmatter: {},
      content: raw,
    }
  }

  const closingIndex = normalized.indexOf("\n---\n", 4)
  if (closingIndex < 0) {
    return {
      frontmatter: {},
      content: raw,
    }
  }

  const yamlBlock = normalized.slice(4, closingIndex)
  const content = normalized.slice(closingIndex + 5)

  return {
    frontmatter: parseFrontmatterYaml(yamlBlock),
    content,
  }
}
