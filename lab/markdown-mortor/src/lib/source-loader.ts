import type { DossierFile, DossierTree, DossierTreeEntry } from "./dossier-loader"

const rawModules = import.meta.glob(
  "../../../agent/filesystem/source/.artifacts/*/preview.md",
  { query: "?raw", import: "default" }
) as Record<string, () => Promise<string>>

function artifactIdFromPath(fullPath: string): string {
  // fullPath: ".../.artifacts/2021-talude-rua-jose-martins-veiga-f345e9ef/preview.md"
  const parts = fullPath.split("/")
  const previewIdx = parts.lastIndexOf("preview.md")
  return previewIdx > 0 ? parts[previewIdx - 1] : fullPath
}

function labelFromArtifactId(artifactId: string): string {
  // Remove trailing hash: last dash + 8 hex chars
  const withoutHash = artifactId.replace(/-[0-9a-f]{8}$/, "")
  return withoutHash
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function loadSourceFiles(): DossierFile[] {
  const files: DossierFile[] = []

  for (const [fullPath, loader] of Object.entries(rawModules)) {
    const artifactId = artifactIdFromPath(fullPath)
    const relativePath = `sources/${artifactId}`
    const label = labelFromArtifactId(artifactId)

    files.push({
      path: fullPath,
      relativePath,
      section: "sources",
      label,
      load: loader,
    })
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath, "pt-BR"))
}

export function buildSourceTree(sourceFiles: DossierFile[]): DossierTree {
  const entries: DossierTreeEntry[] = sourceFiles.map((f) => ({
    label: f.label,
    path: f.relativePath,
    file: f,
  }))

  return {
    section: "sources",
    label: "Sources",
    entries,
  }
}
