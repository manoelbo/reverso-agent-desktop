import React, { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  FilterHorizontalIcon,
  MoreHorizontalCircle01Icon,
  Search01Icon
} from '@hugeicons/core-free-icons'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import type { PeopleCategory, PeopleRow } from './people-mocks'
import { peopleActionCommands } from './people-mocks'

type PeopleTableShellProps = {
  rows: PeopleRow[]
}

const categoryLabelMap: Record<PeopleCategory, string> = {
  person: 'Person',
  'public-agent': 'Public agent',
  contractor: 'Contractor',
  witness: 'Witness',
  unknown: 'Unknown'
}

const categoryToneMap: Record<PeopleCategory, string> = {
  person: 'bg-muted text-muted-foreground',
  'public-agent': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  contractor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  witness: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  unknown: 'bg-red-500/10 text-red-700 dark:text-red-300'
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function RowActionsMenu(): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type='button' size='icon-sm' variant='ghost' aria-label='Open row actions'>
          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} size={16} strokeWidth={1.8} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <DropdownMenuLabel>Quick Action</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Add to Chat</DropdownMenuItem>
        <DropdownMenuItem>View</DropdownMenuItem>
        <DropdownMenuItem className='text-destructive focus:text-destructive'>Delete</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Commands</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {peopleActionCommands.map((command) => (
          <DropdownMenuItem key={command} className='whitespace-nowrap font-mono text-xs'>
            {command}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PeopleTableShell({ rows }: PeopleTableShellProps): React.JSX.Element {
  const [search, setSearch] = useState('')
  const [showPublicAgents, setShowPublicAgents] = useState(true)
  const [showContractors, setShowContractors] = useState(true)
  const [showWitnesses, setShowWitnesses] = useState(true)
  const [showUnknown, setShowUnknown] = useState(true)

  const visibleRows = useMemo(() => {
    const allowedCategories = new Set<PeopleCategory>(['person'])

    if (showPublicAgents) {
      allowedCategories.add('public-agent')
    }
    if (showContractors) {
      allowedCategories.add('contractor')
    }
    if (showWitnesses) {
      allowedCategories.add('witness')
    }
    if (showUnknown) {
      allowedCategories.add('unknown')
    }

    return rows.filter((row) => {
      const searchMatch = row.name.toLowerCase().includes(search.toLowerCase())
      return searchMatch && allowedCategories.has(row.category)
    })
  }, [rows, search, showPublicAgents, showContractors, showWitnesses, showUnknown])

  return (
    <TooltipProvider>
      <section className='space-y-3 rounded-xl border border-border/70 bg-card/70 p-4'>
        <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex flex-1 flex-wrap items-center gap-2'>
            <div className='relative min-w-[18rem] flex-1'>
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                strokeWidth={1.8}
                className='pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground'
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className='pl-8'
                placeholder='Search people by name'
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type='button' variant='outline' size='sm' className='gap-1.5'>
                  <HugeiconsIcon icon={FilterHorizontalIcon} size={14} strokeWidth={1.8} />
                  <span>Filters</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='w-56'>
                <DropdownMenuLabel>Category visibility</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showPublicAgents}
                  onCheckedChange={(checked) => setShowPublicAgents(Boolean(checked))}
                >
                  Public agent
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showContractors}
                  onCheckedChange={(checked) => setShowContractors(Boolean(checked))}
                >
                  Contractor
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showWitnesses}
                  onCheckedChange={(checked) => setShowWitnesses(Boolean(checked))}
                >
                  Witness
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showUnknown}
                  onCheckedChange={(checked) => setShowUnknown(Boolean(checked))}
                >
                  Unknown
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className='overflow-x-auto rounded-lg border border-border/70'>
          <table className='w-full border-collapse text-sm'>
            <thead className='bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground'>
              <tr>
                <th className='px-3 py-2 text-left'>Name</th>
                <th className='px-3 py-2 text-left'>Category</th>
                <th className='px-3 py-2 text-left'>N of Mentions</th>
                <th className='px-3 py-2 text-left'>Updated</th>
                <th className='px-3 py-2 text-left'>View</th>
                <th className='px-3 py-2 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className='border-t border-border/60'>
                  <td className='max-w-96 px-3 py-2 align-middle'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className='truncate whitespace-nowrap font-medium text-foreground'>{row.name}</p>
                      </TooltipTrigger>
                      <TooltipContent side='top' align='start' className='text-xs'>
                        {row.name}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className='px-3 py-2 align-middle'>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryToneMap[row.category]}`}>
                      {categoryLabelMap[row.category]}
                    </span>
                  </td>
                  <td className='px-3 py-2 align-middle text-xs text-muted-foreground'>{row.mentionsCount}</td>
                  <td className='px-3 py-2 align-middle text-xs text-muted-foreground'>{formatDate(row.updatedAt)}</td>
                  <td className='px-3 py-2 align-middle text-xs'>
                    <a href={row.viewPath} className='inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline'>
                      <HugeiconsIcon icon={ArrowDown01Icon} size={12} strokeWidth={1.8} className='-rotate-90' />
                      <span>View</span>
                    </a>
                  </td>
                  <td className='px-3 py-2 align-middle text-right'>
                    <RowActionsMenu />
                  </td>
                </tr>
              ))}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={6} className='px-3 py-6 text-center text-sm text-muted-foreground'>
                    No people matched your current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </TooltipProvider>
  )
}

type PeopleHeaderProps = {
  title: string
  subtitle: string
}

export function PeoplePageHeader({ title, subtitle }: PeopleHeaderProps): React.JSX.Element {
  return (
    <header className='space-y-1 rounded-xl border border-border/70 bg-card/60 px-5 py-4'>
      <h1 className='text-2xl font-semibold tracking-tight text-foreground'>{title}</h1>
      <p className='text-sm text-muted-foreground'>{subtitle}</p>
    </header>
  )
}

export function PeopleSummaryBadge({ rows }: { rows: PeopleRow[] }): React.JSX.Element {
  const mentionsTotal = useMemo(() => rows.reduce((total, row) => total + row.mentionsCount, 0), [rows])

  return (
    <Badge variant='outline' className='h-8 rounded-md px-2 text-xs'>
      {rows.length} entities · {mentionsTotal} mentions
    </Badge>
  )
}
