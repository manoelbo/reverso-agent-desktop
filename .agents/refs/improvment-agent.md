# Improvement Agent — O que não está funcionando no aplicativo

Documento vivo que lista **todas as coisas que não estão funcionando** ou estão incompletas no Reverso Agent (app Electron + Agent Lab + interface de chat). Use este arquivo para priorizar correções e, quando tiver imagens/evidências, adicione na seção **A partir de imagens/evidências** e vá completando a lista.

**Fontes usadas:** `agente-improvments-ideas.md`, `workflow-report.md`, `test-registry.md`, inspeção de código.

---

## 1. Backend / Agent Lab

### Alta prioridade

| # | Item | Descrição |
|---|------|-----------|
| 1 | Sessão global única de deep-dive | `deep-dive-session.json` é único; risco de colisão e baixa escalabilidade. |
| 2 | Verificação de evidência heurística | Localização textual aproximada pode superestimar confiança. |
| 3 | Fallback de contrato quebrado | Resposta negativa quando o contrato quebra pode mascarar problema técnico como "não há evidência". |
| 4 | Roteamento no modo `agent` | Pode sequestrar intenção do usuário quando existe sessão ativa. |
| 5 | Conjunto de tools investigativas | Ainda limitado para inquiry complexa. |

### Média prioridade

| # | Item | Descrição |
|---|------|-----------|
| 6 | Governança editorial | Incompleta (sem revisão formal, trilha de aprovação e estado jurídico/editorial). |
| 7 | Não determinismo em previews | Dificulta reprodutibilidade da apuração. |
| 8 | Tipagem no doc-processing | Lacunas de tipagem estrita em partes do processamento documental. |
| 9 | Testes inquiry ponta a ponta | Cobertura parcial para concorrencia, falhas prolongadas e fluxo inquiry completo. |

### Bugs conhecidos (já documentados)

| # | Item | Descrição |
|---|------|-----------|
| 10 | Upload: `accepted[]` vazio | `POST /api/upload` salva o arquivo em source corretamente, mas a resposta devolve `accepted[]` vazio (bug na serialização da lista de aceitos). |

---

## 2. Interface / Chat (lab/agent/interface)

### Resiliência (severidade média)

| # | Item | Descrição |
|---|------|-----------|
| G1 | Reconexão SSE automática | Se o stream cair (rede instável, servidor reiniciado), a UI não reconecta. Falta wrapper com retry + backoff (ex.: 1s→2s→4s→8s) e `Last-Event-ID`. |
| G2 | Persistência de rich parts | Ao recarregar, só parts do tipo `text` são restaurados. Parts `artifact`, `lead-suggestion`, `allegation`, `queue`, `suggestions`, `retry` são perdidos. |
| G3 | Context compaction | Só sliding-window (6k tokens). Falta prune/trim/compact de tool outputs e mensagens antigas para investigações longas. |

### Polish / UX (severidade baixa)

| # | Item | Descrição |
|---|------|-----------|
| G4 | RetryIndicator sem botões | Exibe contagem regressiva e snippet de erro, mas não tem "Retry Now" e "Cancel". |
| G5 | ArtifactDisplay sem "Abrir" | Tem copiar; falta ação para abrir o arquivo no viewer/editor do app. |
| G6 | PromptInput sem `onStop` explícito | Cancel durante streaming funciona via submit do form; `PromptInput` não recebe `onStop` como prop (não canônico com AI Elements). |

### Validação

| # | Item | Descrição |
|---|------|-----------|
| G7 | Sprints sem registro no test-registry | Sprints 4, 5, 6, 7 e 9 implementados mas sem cenários registrados em `.agents/test-registry.md` — não há regressão formal. |

### Etapa E13 (parcial)

| # | Item | Descrição |
|---|------|-----------|
| E13 | Polish E13 | Reconexão SSE, botões no RetryIndicator e restauração de rich parts na sessão persistida estão parcialmente ausentes. |

---

## 3. App Electron principal

| # | Item | Descrição |
|---|------|-----------|
| — | Integração chat no app | A shell de chat está em `lab/agent/interface` (isolada). Falta integrar ao app principal: servidor HTTP/SSE via IPC, `IpcAgentTransport` real, chat no Application Shell 9. |

*(Itens específicos do Electron principal serão adicionados conforme descoberta.)*

---

## 4. A partir de imagens/evidências

*Adicione aqui itens identificados a partir de screenshots, prints ou descrições visuais. Exemplo: "Botão X não responde", "Layout quebrado na tela Y", "Texto cortado em Z".*

| # | Item | Descrição / Evidência |
|---|------|------------------------|
| — | *(vazio)* | *Envie imagens ou descreva o problema para ir preenchendo.* |

---

## 5. Referências rápidas

- **Pontos fracos e blueprint:** `.agents/refs/agente-improvments-ideas.md`
- **Gaps de workflow e próximos passos:** `.agents/refs/workflow-report.md`
- **Cenários de teste e bugs por sprint:** `.agents/test-registry.md`

---

*Última atualização: 2026-03-14. Documento criado para listar de forma centralizada o que não está funcionando; pode ser expandido a qualquer momento.*
