import { test } from "playwright/test";

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

async function firstVisible(page: any, selectors: string[]) {
  for (const selector of selectors) {
    const loc = page.locator(selector);
    const count = await loc.count();
    for (let i = 0; i < count; i += 1) {
      const candidate = loc.nth(i);
      if (await candidate.isVisible().catch(() => false)) {
        return candidate;
      }
    }
  }
  return null;
}

test("checks localhost 5176", async ({ page }) => {
  const errors: string[] = [];
  const runtimeErrors: string[] = [];
  const results: Record<string, { pass: boolean; detail: string }> = {
    check1: { pass: false, detail: "" },
    check2: { pass: false, detail: "" },
    check3: { pass: false, detail: "" },
    check4: { pass: false, detail: "" },
  };

  try {
    page.on("pageerror", (err) => {
      runtimeErrors.push(`pageerror: ${err.message}`);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        runtimeErrors.push(`console.error: ${msg.text()}`);
      }
    });

    const response = await page.goto("http://localhost:5176", { waitUntil: "domcontentloaded", timeout: 15000 });
    if (!response || !response.ok()) {
      throw new Error(`Falha ao abrir página: status ${response?.status() ?? "sem resposta"}`);
    }
    await page.waitForTimeout(1200);

    const scenarioTextCount = await page.locator('text=/(cen[aá]rio|scenario)\\s*\\d+/i').count();
    const cardSelectors = ['[data-testid*="scenario"]', '[class*="scenario"]', '[class*="card"]', "article", '[role="article"]'];
    let bestCardCount = 0;
    for (const selector of cardSelectors) {
      const count = await page.locator(selector).count();
      if (count > bestCardCount) bestCardCount = count;
    }
    const hasFive = scenarioTextCount >= 5 || bestCardCount >= 5;
    results.check1 = { pass: hasFive, detail: `cenariosTexto=${scenarioTextCount}, cardsDetectados=${bestCardCount}` };
    if (!hasFive) errors.push(`Check 1: esperado >=5, encontrado ${Math.max(scenarioTextCount, bestCardCount)}.`);

    const themeButton = await firstVisible(page, [
      'button:has-text("Tema")',
      'button:has-text("theme")',
      'button:has-text("Dark")',
      'button:has-text("Light")',
      'button:has-text("Claro")',
      'button:has-text("Escuro")',
      'button:has-text("modo")',
      '[aria-label*="tema" i]',
      '[aria-label*="theme" i]',
      '[title*="tema" i]',
      '[title*="theme" i]',
    ]);
    if (themeButton) {
      const before = normalizeText(await themeButton.innerText().catch(() => ""));
      await themeButton.click({ timeout: 5000 });
      await page.waitForTimeout(350);
      const after = normalizeText(await themeButton.innerText().catch(() => ""));
      const toggled = Boolean(before) && Boolean(after) && before !== after;
      results.check2 = { pass: toggled, detail: `before="${before}" after="${after}"` };
      if (!toggled) errors.push(`Check 2: texto não alternou (${before} -> ${after}).`);
    } else {
      results.check2 = { pass: false, detail: "botaoTemaNaoEncontrado" };
      errors.push("Check 2: botão de tema não encontrado.");
    }

    const promptInput = await firstVisible(page, [
      "textarea",
      'input[type="text"]',
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])',
      '[contenteditable="true"]',
      '[placeholder*="prompt" i]',
      '[placeholder*="mensagem" i]',
      '[placeholder*="message" i]',
      '[placeholder*="pergunte" i]',
    ]);
    if (promptInput) {
      await promptInput.click({ timeout: 5000 });
      const tag = await promptInput.evaluate((el: HTMLElement) => el.tagName.toLowerCase()).catch(() => "");
      const sample = "teste rapido";
      if (tag === "textarea" || tag === "input") {
        await promptInput.fill(sample);
      } else {
        await page.keyboard.type(sample);
      }
      const focused = await promptInput.evaluate((el: HTMLElement) => el === document.activeElement).catch(() => false);
      const value = tag === "textarea" || tag === "input" ? await promptInput.inputValue().catch(() => "") : await promptInput.innerText().catch(() => "");
      const typed = String(value).toLowerCase().includes("teste");
      results.check3 = { pass: focused && typed, detail: `focado=${focused}, valor="${normalizeText(String(value))}"` };
      if (!(focused && typed)) errors.push(`Check 3: falha foco/digitação (focado=${focused}, valor="${value}").`);
    } else {
      results.check3 = { pass: false, detail: "promptInputNaoEncontrado" };
      errors.push("Check 3: PromptInput não encontrado.");
    }

    const menuStateCount = async () => page.locator('[role="menu"], [data-state="open"], [aria-expanded="true"]').count();
    const initialOpen = await menuStateCount();
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    let menuWorked = false;
    let menuDetail = `before=${initialOpen}`;
    for (let i = 0; i < buttonCount; i += 1) {
      const btn = buttons.nth(i);
      if (!(await btn.isVisible().catch(() => false))) continue;
      const txt = normalizeText(await btn.innerText().catch(() => ""));
      const aria = normalizeText(
        (await btn.getAttribute("aria-label").catch(() => "")) || (await btn.getAttribute("title").catch(() => "")) || "",
      );
      const candidate = /(a[cç][aã]o|action|menu|more|op[cç][oõ]es|options|ellipsis|kebab|dropdown|dot)/i.test(`${txt} ${aria}`);
      if (!candidate) continue;

      await btn.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(250);
      const openedCount = await menuStateCount();
      const opened = openedCount > initialOpen;
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(250);
      const closedCount = await menuStateCount();
      const closed = closedCount <= initialOpen;
      if (opened && closed) {
        menuWorked = true;
        menuDetail = `button="${txt || aria || `#${i}`}", before=${initialOpen}, open=${openedCount}, close=${closedCount}`;
        break;
      }
    }
    results.check4 = { pass: menuWorked, detail: menuDetail };
    if (!menuWorked) {
      errors.push("Check 4: nenhum menu de ação abriu e fechou com sucesso.");
    }
  } catch (err: any) {
    errors.push(`Erro geral: ${err?.message ?? String(err)}`);
  }
  if (runtimeErrors.length > 0) {
    errors.push(...runtimeErrors);
  }

  // eslint-disable-next-line no-console
  console.log("CHECK_RESULTS_JSON_START");
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ results, errors }, null, 2));
  // eslint-disable-next-line no-console
  console.log("CHECK_RESULTS_JSON_END");
});
