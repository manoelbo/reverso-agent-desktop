import type { DossierFile, DossierTree, DossierTreeEntry } from "./dossier-loader"

const leadsGlob = import.meta.glob(
  "../../../agent/filesystem/investigation/leads/**/*.md",
  { query: "?raw", import: "default" }
) as Record<string, () => Promise<string>>

const findingsGlob = import.meta.glob(
  "../../../agent/filesystem/investigation/findings/**/*.md",
  { query: "?raw", import: "default" }
) as Record<string, () => Promise<string>>

const allegationsGlob = import.meta.glob(
  "../../../agent/filesystem/investigation/allegations/**/*.md",
  { query: "?raw", import: "default" }
) as Record<string, () => Promise<string>>

type InvestigationSection = "leads" | "findings" | "allegations"

function buildRelativePath(fullPath: string, section: InvestigationSection): string {
  const match = new RegExp(`/investigation/${section}/(.+)$`).exec(fullPath)
  return match ? `${section}/${match[1]}` : fullPath
}

function stemLabel(filename: string): string {
  return filename
    .replace(/\.md$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function loadSection(
  rawModules: Record<string, () => Promise<string>>,
  section: InvestigationSection
): DossierFile[] {
  const files: DossierFile[] = []
  for (const [fullPath, loader] of Object.entries(rawModules)) {
    const relativePath = buildRelativePath(fullPath, section)
    const filename = relativePath.split("/").at(-1) ?? ""
    files.push({
      path: fullPath,
      relativePath,
      section,
      label: stemLabel(filename),
      load: loader,
    })
  }
  return files
}

export function loadInvestigationFiles(): DossierFile[] {
  const leads = loadSection(leadsGlob, "leads")
  const findings = loadSection(findingsGlob, "findings")
  const allegations = loadSection(allegationsGlob, "allegations")
  const all = [...leads, ...findings, ...allegations]
  return all.sort((a, b) => a.relativePath.localeCompare(b.relativePath, "pt-BR"))
}

const SECTION_LABELS: Record<InvestigationSection, string> = {
  leads: "Leads",
  findings: "Findings",
  allegations: "Allegations",
}

export function buildInvestigationTrees(files: DossierFile[]): DossierTree[] {
  const sections: InvestigationSection[] = ["leads", "findings", "allegations"]
  return sections.map((section) => {
    const sectionFiles = files.filter((f) => f.section === section)
    const entries: DossierTreeEntry[] = sectionFiles.map((f) => ({
      label: f.label,
      path: f.relativePath,
      file: f,
    }))
    return {
      section,
      label: SECTION_LABELS[section],
      entries,
    }
  })
}
