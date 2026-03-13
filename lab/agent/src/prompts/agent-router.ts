export type AgentRouterIntent =
  | 'continue_session'
  | 'start_deep_dive'
  | 'run_init'
  | 'request_context'
  | 'describe_investigation'
  | 'create_lead'
  | 'plan_inquiry'
  | 'run_inquiry'
  | 'unknown'

export function buildAgentRouterSystemPrompt(): string {
  return `
You classify the next action for an investigative CLI agent.

Return ONLY valid JSON:
{
  "intent": "continue_session|start_deep_dive|run_init|request_context|describe_investigation|create_lead|plan_inquiry|run_inquiry|unknown",
  "targetSlug": "lead-slug-optional",
  "targetTitle": "lead title optional",
  "targetIndex": 1,
  "targetScope": "one|all",
  "targetCount": 3,
  "idea": "optional lead idea",
  "confidence": 0.8,
  "reason": "one short sentence"
}

Rules:
- Prefer continue_session when the user is clearly continuing a previously suggested step ("plan all", "execute first", "redo", "continue").
- Use start_deep_dive for requests to inspect sources, discover lines, suggest leads, or "start investigation".
- Use run_init for requests focused on initial context setup.
- Use request_context when user asks to review documents/sources and summarize current context.
- Use describe_investigation when user is mostly describing the case context and not requesting a concrete action.
- Use create_lead only when the user explicitly asks to create a lead outside deep-dive flow.
- Use plan_inquiry when the user asks to create/update inquiry plans for existing leads.
- Use run_inquiry when the user asks to execute investigation/inquiry for lead(s), including plural forms.
- targetSlug is optional and should be provided when the user names a lead slug.
- targetTitle is optional if user references lead by title text.
- targetIndex is optional and 1-based when the user references first/second/third.
- targetScope should be "all" for "all leads"/"3 leads", else "one".
- targetCount is optional when user mentions a specific quantity.
- confidence must be a number between 0 and 1.
`.trim()
}

export function buildAgentRouterUserPrompt(input: {
  userText: string
  sessionStage?: 'awaiting_plan_decision' | 'awaiting_inquiry_execution' | 'completed'
  hasAgentContext: boolean
  availableLeads: Array<{ index: number; slug: string; title: string; status: 'draft' | 'planned' }>
}): string {
  const leads =
    input.availableLeads.length > 0
      ? input.availableLeads
          .map((lead) => `${lead.index}. ${lead.title} (${lead.slug}) [${lead.status}]`)
          .join('\n')
      : '(none)'
  return `
Session stage: ${input.sessionStage ?? 'none'}
Has agent context (agent.md): ${input.hasAgentContext ? 'yes' : 'no'}

Available leads:
${leads}

User message:
${input.userText}
`.trim()
}
