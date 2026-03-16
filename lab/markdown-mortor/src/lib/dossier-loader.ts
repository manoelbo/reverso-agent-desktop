export type DossierFile = {
  path: string
  relativePath: string
  section: "groups" | "people" | "places" | "timeline" | "sources"
  label: string
  load: () => Promise<string>
}

export type DossierTree = {
  section: "groups" | "people" | "places" | "timeline" | "sources"
  label: string
  entries: DossierTreeEntry[]
}

export type DossierTreeEntry = {
  file?: DossierFile
  folder?: string
  children?: DossierTreeEntry[]
  label: string
  path: string
}

const rawModules = import.meta.glob(
  "../../../agent/filesystem/dossier/**/*.md",
  { query: "?raw", import: "default" }
) as Record<string, () => Promise<string>>

function pathToSection(p: string): DossierFile["section"] | null {
  if (p.includes("/dossier/groups/")) return "groups"
  if (p.includes("/dossier/people/")) return "people"
  if (p.includes("/dossier/places/")) return "places"
  if (p.includes("/dossier/timeline/")) return "timeline"
  return null
}

function stemLabel(filename: string): string {
  return filename
    .replace(/\.md$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildRelativePath(fullPath: string): string {
  const match = /\/dossier\/(.+)$/.exec(fullPath)
  return match ? match[1] : fullPath
}

export function loadDossierFiles(): DossierFile[] {
  const files: DossierFile[] = []

  for (const [fullPath, loader] of Object.entries(rawModules)) {
    const section = pathToSection(fullPath)
    if (!section) continue

    const relativePath = buildRelativePath(fullPath)
    const parts = relativePath.split("/")
    const filename = parts[parts.length - 1]

    files.push({
      path: fullPath,
      relativePath,
      section,
      label: stemLabel(filename),
      load: loader,
    })
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath, "pt-BR"))
}

export function groupBySection(files: DossierFile[]): DossierTree[] {
  const sections: DossierFile["section"][] = ["groups", "people", "places", "timeline"]
  const sectionLabels: Record<DossierFile["section"], string> = {
    groups: "Groups",
    people: "People",
    places: "Places",
    timeline: "Timeline",
    sources: "Sources",
  }

  return sections.map((section) => {
    const sectionFiles = files.filter((f) => f.section === section)
    return {
      section,
      label: sectionLabels[section],
      entries: buildEntries(sectionFiles, section),
    }
  })
}

function buildEntries(files: DossierFile[], section: DossierFile["section"]): DossierTreeEntry[] {
  if (section !== "places" && section !== "timeline" && section !== "sources") {
    return files.map((f) => ({
      label: f.label,
      path: f.relativePath,
      file: f,
    }))
  }

  // For places and timeline, build a nested folder tree
  const root: DossierTreeEntry[] = []
  const folderMap = new Map<string, DossierTreeEntry>()

  for (const file of files) {
    const parts = file.relativePath.split("/").slice(1) // remove section prefix
    if (parts.length === 1) {
      root.push({ label: file.label, path: file.relativePath, file })
      continue
    }

    // Build intermediate folders
    let currentLevel = root
    let currentPath: string = section
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = `${currentPath}/${parts[i]}`
      let folder = folderMap.get(currentPath)
      if (!folder) {
        folder = {
          label: parts[i],
          path: currentPath,
          folder: parts[i],
          children: [],
        }
        folderMap.set(currentPath, folder)
        currentLevel.push(folder)
      }
      currentLevel = folder.children!
    }

    currentLevel.push({
      label: file.label,
      path: file.relativePath,
      file,
    })
  }

  return root
}
