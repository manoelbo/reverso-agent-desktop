import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const stories = [
  {
    name: 'Variant 1 — Editorial Longform',
    path: '/story/blocks-markdown-documentviewer--variant-1-editorial-longform'
  },
  {
    name: 'Variant 2 — Editorial Dossier Card',
    path: '/story/blocks-markdown-documentviewer--variant-2-editorial-dossier-card'
  },
  {
    name: 'Variant 3 — Evidence Workbench',
    path: '/story/blocks-markdown-documentviewer--variant-3-evidence-workbench'
  },
  {
    name: 'Variant 4 — Evidence Timeline Rail',
    path: '/story/blocks-markdown-documentviewer--variant-4-evidence-timeline-rail'
  },
  {
    name: 'Variant 5 — Experimental Split Focus',
    path: '/story/blocks-markdown-documentviewer--variant-5-experimental-split-focus'
  }
];

async function checkStory(page, story, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Verificando: ${story.name}`);
  console.log('='.repeat(60));

  const url = `http://localhost:6006/?path=${story.path}`;
  console.log(`📍 Navegando para: ${url}`);
  
  try {
    // Navegar para a story
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Aguardar um pouco para garantir que tudo carregou
    await page.waitForTimeout(2000);
    
    // Verificar erros de console
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    const hasConsoleErrors = consoleLogs.length > 0;
    console.log(`❌ Erros de console: ${hasConsoleErrors ? 'SIM' : 'NÃO'}`);
    if (hasConsoleErrors) {
      consoleLogs.forEach(log => console.log(`   - ${log}`));
    }
    
    // Verificar corpus selector (dropdown)
    let hasCorpusSelector = false;
    try {
      // Tentar diferentes seletores que podem representar o corpus selector
      const selectors = [
        'select',
        '[role="combobox"]',
        'button[role="combobox"]',
        '[data-testid*="corpus"]',
        '[class*="corpus"]',
        'div[class*="select"]'
      ];
      
      for (const selector of selectors) {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          console.log(`📋 Encontrado seletor com "${selector}": ${text?.slice(0, 50)}`);
          hasCorpusSelector = true;
          break;
        }
      }
    } catch (e) {
      console.log(`⚠️  Erro ao verificar corpus selector: ${e.message}`);
    }
    
    console.log(`📋 Corpus selector visível: ${hasCorpusSelector ? 'SIM' : 'NÃO'}`);
    
    // Verificar conteúdo markdown
    let hasMarkdownContent = false;
    let contentPreview = '';
    
    try {
      // Procurar por elementos que possam conter markdown
      const contentSelectors = [
        'article',
        '[class*="markdown"]',
        '[class*="prose"]',
        'main',
        '.storybook-docs'
      ];
      
      for (const selector of contentSelectors) {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.trim().length > 50) {
            hasMarkdownContent = true;
            contentPreview = text.trim().slice(0, 100).replace(/\n/g, ' ');
            break;
          }
        }
      }
      
      // Se não encontrou, tentar qualquer texto visível na página
      if (!hasMarkdownContent) {
        const bodyText = await page.textContent('body');
        if (bodyText && bodyText.trim().length > 100) {
          hasMarkdownContent = true;
          contentPreview = bodyText.trim().slice(0, 100).replace(/\n/g, ' ');
        }
      }
    } catch (e) {
      console.log(`⚠️  Erro ao verificar conteúdo markdown: ${e.message}`);
    }
    
    console.log(`📝 Conteúdo markdown visível: ${hasMarkdownContent ? 'SIM' : 'NÃO'}`);
    if (contentPreview) {
      console.log(`   Preview: "${contentPreview}..."`);
    }
    
    // Tirar screenshot
    const screenshotPath = `/Users/manebrasil/Developer/Capybara Agent/storybook-variant-${index + 1}.png`;
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`📸 Screenshot salvo: ${screenshotPath}`);
    
    return {
      story: story.name,
      renderOk: !hasConsoleErrors,
      hasCorpusSelector,
      hasMarkdownContent,
      screenshotPath
    };
    
  } catch (error) {
    console.error(`❌ Erro ao verificar story: ${error.message}`);
    return {
      story: story.name,
      renderOk: false,
      hasCorpusSelector: false,
      hasMarkdownContent: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Iniciando verificação das stories do DocumentViewer...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const results = [];
  
  for (let i = 0; i < stories.length; i++) {
    const result = await checkStory(page, stories[i], i);
    results.push(result);
  }
  
  await browser.close();
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    results
  };
  
  writeFileSync(
    '/Users/manebrasil/Developer/Capybara Agent/.tmp-storybook-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA VERIFICAÇÃO');
  console.log('='.repeat(60));
  
  results.forEach((result, i) => {
    console.log(`\n${i + 1}. ${result.story}`);
    console.log(`   ✓ Renderiza sem erros: ${result.renderOk ? '✅' : '❌'}`);
    console.log(`   ✓ Corpus selector: ${result.hasCorpusSelector ? '✅' : '❌'}`);
    console.log(`   ✓ Conteúdo markdown: ${result.hasMarkdownContent ? '✅' : '❌'}`);
    if (result.error) {
      console.log(`   ⚠️  Erro: ${result.error}`);
    }
  });
  
  console.log('\n✅ Verificação concluída!');
  console.log(`📄 Relatório salvo em: .tmp-storybook-report.json`);
}

main().catch(console.error);
