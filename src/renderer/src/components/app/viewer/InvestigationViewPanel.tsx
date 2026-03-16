"use client"

import type { JSX } from "react"
import type { InvestigationDocumentKind, InvestigationIndexPayload } from "../../../../../shared/workspace-investigation"

type InvestigationViewPanelProps = {
  documentKind: InvestigationDocumentKind
  investigationIndex: InvestigationIndexPayload | null
  investigationIndexLoading: boolean
  investigationIndexError: string | null
  investigationIndexStale: boolean
  onOpenDocument: (relativePath: string) => void
}

export function InvestigationViewPanel({
  documentKind,
  investigationIndex,
  investigationIndexLoading,
  investigationIndexError,
  investigationIndexStale,
  onOpenDocument,
}: InvestigationViewPanelProps): JSX.Element {
  const files = documentKind === "allegation" ? investigationIndex?.allegations ?? [] : investigationIndex?.findings ?? []
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6">
      <section className="rounded-xl border border-border/60 bg-card/70 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {documentKind === "allegation" ? "Allegations" : "Findings"}
        </h2>
        {investigationIndexLoading ? <p className="mt-2 text-xs text-muted-foreground">Loading index...</p> : null}
        {investigationIndexStale && !investigationIndexLoading ? (
          <p className="mt-2 text-xs text-muted-foreground">Refreshing data...</p>
        ) : null}
        {investigationIndexError ? <p className="mt-2 text-xs text-destructive">{investigationIndexError}</p> : null}
      </section>
      <section className="overflow-hidden rounded-xl border border-border/60 bg-card/70">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-border/60 bg-muted/35 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.relativePath} className="border-b border-border/40 last:border-b-0">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="max-w-full truncate text-left font-medium text-foreground hover:underline"
                    onClick={() => onOpenDocument(file.relativePath)}
                  >
                    {file.fileName}
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{file.leadSlug ?? "n/a"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(file.updatedAt).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!files.length ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            {documentKind === "allegation" ? "No allegations available." : "No findings available."}
          </div>
        ) : null}
      </section>
    </div>
  )
}
