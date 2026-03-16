export interface NextCommandHint {
  command: string
  description: string
  alternatives?: string[]
}

export function printNextCommand(hint: NextCommandHint): void {
  console.log(`\n${'─'.repeat(60)}`)
  console.log('  PRÓXIMO COMANDO SUGERIDO')
  console.log('─'.repeat(60))
  console.log(`  $ ${hint.command}`)
  console.log(`  ${hint.description}`)
  if (hint.alternatives && hint.alternatives.length > 0) {
    console.log('\n  Alternativas:')
    for (const alt of hint.alternatives) {
      console.log(`    $ ${alt}`)
    }
  }
  console.log(`${'─'.repeat(60)}\n`)
}
