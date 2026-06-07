# QA AI Playwright OpenAI

Projeto de automação E2E com Playwright, TypeScript e integração com a API da OpenAI para demonstrar usos práticos de IA em qualidade de software.

A prova de conceito cobre duas frentes que aparecem bastante em projetos reais:

- geração dinâmica de massa de dados sintética, validada por contrato;
- self-healing controlado para reduzir falhas causadas por drift simples de seletores.

O projeto usa um app local de demonstração com um formulário de cadastro. O teste cria um usuário sintético, preenche o fluxo, valida o resultado e anexa evidências no relatório do Playwright.

## Propósito do projeto

A ideia não é usar IA para esconder teste ruim. O objetivo é mostrar como uma camada bem isolada de IA pode apoiar a automação sem tirar previsibilidade, rastreabilidade e controle técnico do time de QA.

Na prática, o repositório demonstra:

| Área | Como aparece no projeto |
| --- | --- |
| Automação E2E | Playwright executando um fluxo real de cadastro no app demo |
| Massa dinâmica | `AiTestDataFactory` cria usuários sintéticos por execução |
| Integração OpenAI | `OpenAiClient` usa Responses API com Structured Outputs |
| Contrato de dados | Zod valida o retorno antes do dado entrar no teste |
| Self-healing | `SelfHealingLocator` tenta seletores alternativos conhecidos quando o principal falha |
| Evidência | O teste anexa dados sanitizados e eventos de healing ao relatório HTML |
| CI/CD | GitHub Actions executa typecheck, testes E2E e publica o relatório como artifact |

## Arquitetura

```text
.
├── .github/
│   └── workflows/
│       └── e2e.yml
├── demo-app/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── tests/
│   ├── e2e/
│   │   └── ai-generated-registration.spec.ts
│   ├── fixtures/
│   │   └── fallback-registration-user.json
│   ├── pages/
│   │   └── registration-page.ts
│   └── support/
│       ├── ai/
│       │   ├── ai-test-data-factory.ts
│       │   ├── openai-client.ts
│       │   └── schemas.ts
│       ├── config/
│       │   └── env.ts
│       └── self-healing/
│           ├── healing-candidate.ts
│           └── self-healing-locator.ts
├── .env.example
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

## Pré-requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- Chave da OpenAI para executar o modo com dados gerados por IA
- Navegadores do Playwright instalados

## Configuração local

Instale as dependências:

```bash
npm install
```

Instale os browsers do Playwright:

```bash
npm run install:browsers
```

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Variáveis de ambiente

| Variável | Obrigatória | Valor padrão | Uso |
| --- | --- | --- | --- |
| `BASE_URL` | Não | `http://127.0.0.1:4173` | URL do app demo usado pelo Playwright |
| `OPENAI_API_KEY` | Só no modo IA | vazio | Chave usada pela SDK da OpenAI |
| `OPENAI_MODEL` | Não | `gpt-5.5` | Modelo usado para gerar massa sintética |
| `USE_OPENAI_DATA` | Não | `false` | Liga a chamada real para a OpenAI |
| `ALLOW_AI_FALLBACK` | Não | `true` | Permite cair para massa local quando a API falha |
| `AI_REQUEST_TIMEOUT_MS` | Não | `20000` | Timeout da chamada para a API |
| `SELF_HEALING_ENABLED` | Não | `true` | Liga ou desliga o self-healing de seletores |

Execução local sem chamada para a OpenAI:

```env
USE_OPENAI_DATA=false
ALLOW_AI_FALLBACK=true
```

Execução local usando a API:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.5
USE_OPENAI_DATA=true
ALLOW_AI_FALLBACK=false
```

## Como executar

Rodar os testes E2E:

```bash
npm run test:e2e
```

Rodar os testes com dados gerados pela OpenAI:

```bash
npm run test:e2e:ai
```

Rodar em modo headed:

```bash
npm run test:e2e:headed
```

Validar tipos TypeScript:

```bash
npm run typecheck
```

Abrir o relatório HTML:

```bash
npm run test:report
```

O `playwright.config.ts` já inicia o app local com `npm run app:demo` antes da execução dos testes. Por isso, em uso normal, não é necessário subir o app manualmente.

## A Mágica do Self-Healing

O self-healing deste projeto não tenta adivinhar qualquer seletor da página. Essa escolha é intencional.

Em automação de testes, uma recuperação muito agressiva pode transformar uma falha útil em falso positivo. O teste deixa de quebrar, mas talvez esteja interagindo com o elemento errado. Aqui o healing é limitado, explícito e auditável.

O fluxo fica assim:

```text
Teste chama o Page Object
        ↓
Page Object tenta o seletor principal
        ↓
Se o seletor principal não estiver visível, avalia candidatos conhecidos
        ↓
O primeiro candidato utilizável é retornado
        ↓
O evento de healing é registrado no relatório
```

No arquivo `tests/pages/registration-page.ts`, o campo `firstName` usa um seletor principal propositalmente quebrado:

```ts
this.page.getByTestId("first-name")
```

No app demo, o atributo real está como:

```html
data-testid="given-name"
```

Esse drift simula uma alteração comum em times de produto: alguém renomeia um `data-testid`, mas mantém o label acessível do campo. Quando o seletor principal falha, o Page Object fornece candidatos alternativos:

```ts
[
  {
    strategy: "accessible-label",
    reason: "The first-name test id changed, but the accessible label remained stable.",
    locate: (page) => page.getByLabel("First name")
  },
  {
    strategy: "field-name",
    reason: "The semantic name attribute still identifies the expected field.",
    locate: (page) => page.locator("input[name='firstName']")
  }
]
```

O `SelfHealingLocator` valida cada candidato com uma checagem curta de visibilidade. Se encontrar um candidato válido, grava um evento:

```json
{
  "target": "firstName",
  "strategy": "accessible-label",
  "reason": "The first-name test id changed, but the accessible label remained stable."
}
```

Esse evento é anexado ao relatório do Playwright pela spec:

```ts
await testInfo.attach("self-healing-events", {
  body: JSON.stringify(registrationPage.healingEvents, null, 2),
  contentType: "application/json"
});
```

Pontos importantes:

- o seletor principal continua sendo a primeira opção;
- os fallbacks são definidos por quem escreve o teste;
- o healing não passa despercebido, pois vira evidência;
- se nenhum candidato funcionar, o teste falha normalmente;
- o recurso pode ser desligado com `SELF_HEALING_ENABLED=false`.

Essa abordagem mantém o teste resistente a mudanças pequenas, mas ainda honesto quando a interface realmente muda de comportamento.

## Geração Dinâmica de Dados

Massas de teste fixas costumam envelhecer mal. Depois de algum tempo, o time começa a confiar sempre nos mesmos nomes, e-mails, empresas e combinações de campos. Isso cria um problema silencioso: o teste passa porque conhece demais o cenário, não porque o produto está bem coberto.

Neste projeto, a geração dinâmica resolve alguns pontos:

| Problema comum | Tratamento no projeto |
| --- | --- |
| Dados repetidos | O fallback cria e-mail e empresa únicos por execução |
| Massa viciada | A OpenAI pode variar nomes, empresas, cargos e países dentro do contrato |
| Dados fora do padrão | Zod valida o payload antes do teste usar a massa |
| Risco de PII | O prompt exige dados sintéticos e domínio `example.test` |
| Instabilidade no CI | O workflow usa fallback determinístico, sem depender da API |

O ponto central é o contrato. A IA não entrega um objeto solto para o teste consumir às cegas. O retorno precisa passar por `registrationUserSchema`:

```ts
export const registrationUserSchema = generatedRegistrationUserSchema.superRefine((user, context) => {
  if (!user.email.endsWith("@example.test")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: "Synthetic users must use the example.test domain."
    });
  }
});
```

O `AiTestDataFactory` decide a origem da massa:

| `USE_OPENAI_DATA` | `ALLOW_AI_FALLBACK` | Comportamento |
| --- | --- | --- |
| `false` | qualquer valor | usa fixture local com dados únicos por execução |
| `true` | `true` | tenta OpenAI e cai para fallback se houver falha |
| `true` | `false` | falha o teste se a OpenAI falhar |

Esse desenho é útil porque separa dois objetivos:

- desenvolvimento local e demonstração da integração com IA;
- execução estável em pipeline, sem custo e sem dependência de segredo.

## CI/CD com GitHub Actions

O workflow fica em `.github/workflows/e2e.yml`.

Ele roda em:

- push para `main`;
- pull request;
- execução manual pelo GitHub (`workflow_dispatch`).

Etapas do job:

| Etapa | O que faz |
| --- | --- |
| Checkout | Baixa o código do repositório |
| Setup Node.js | Configura Node.js 22 e cache do npm |
| Install dependencies | Executa `npm ci` |
| Install Playwright browsers | Instala Chromium com dependências Linux |
| Typecheck | Executa `npm run typecheck` |
| E2E | Executa `npm run test:e2e` |
| Artifact | Publica `playwright-report/` mesmo quando há falha |

No CI, o teste roda com:

```env
USE_OPENAI_DATA=false
ALLOW_AI_FALLBACK=true
SELF_HEALING_ENABLED=true
```

Isso mantém a pipeline estável. A chamada real para a OpenAI fica disponível para execução local ou para uma pipeline dedicada, caso você queira adicionar uma etapa com secrets no futuro.

## Relatório de execução

O Playwright gera um relatório HTML em:

```text
playwright-report/
```

No GitHub Actions, esse diretório é enviado como artifact com o nome:

```text
playwright-html-report
```

Quando um teste falha, baixe o artifact pela aba da execução do workflow. Ele inclui o relatório HTML, anexos, traces, screenshots e vídeos conforme a configuração do Playwright.

## Tecnologias utilizadas

| Tecnologia | Uso |
| --- | --- |
| Playwright Test | Execução E2E e relatório |
| TypeScript | Tipagem da suíte |
| OpenAI SDK | Integração com Responses API |
| Structured Outputs | Retorno da IA aderente a schema |
| Zod | Validação local dos dados gerados |
| dotenv | Leitura de variáveis de ambiente |
| Vite | Servidor local do app demo |
| GitHub Actions | Pipeline de CI/CD |

## Troubleshooting

### `OPENAI_API_KEY is required when USE_OPENAI_DATA=true`

O modo de IA está ligado, mas a chave não foi configurada.

Verifique o `.env`:

```env
OPENAI_API_KEY=sk-...
USE_OPENAI_DATA=true
```

Se você só quer rodar a suíte sem chamada externa:

```env
USE_OPENAI_DATA=false
ALLOW_AI_FALLBACK=true
```

### Erro de chave inválida da OpenAI

Sintoma comum:

```text
AuthenticationError: invalid_api_key
```

Como resolver:

- confira se a chave foi copiada sem espaços extras;
- gere uma nova chave no painel da OpenAI;
- confirme se a variável está disponível no terminal atual;
- rode com `USE_OPENAI_DATA=false` se a intenção for apenas validar a automação.

### Timeout na chamada da OpenAI

Se a API estiver lenta ou a rede instável, aumente o timeout:

```env
AI_REQUEST_TIMEOUT_MS=40000
```

Para não bloquear a execução por indisponibilidade temporária:

```env
ALLOW_AI_FALLBACK=true
```

### Playwright informa que o browser não está instalado

Sintoma:

```text
Executable doesn't exist
Please run: npx playwright install
```

Resolva com:

```bash
npm run install:browsers
```

No Linux/CI, quando precisar instalar dependências do sistema:

```bash
npx playwright install --with-deps chromium
```

### Timeout esperando o app local

O `playwright.config.ts` espera o app responder em `BASE_URL`.

Confira se a URL está correta:

```env
BASE_URL=http://127.0.0.1:4173
```

Se a porta estiver ocupada, pare o processo antigo ou altere a porta no script `app:demo` e no `BASE_URL`.

### O self-healing não recuperou o seletor

Possíveis causas:

- `SELF_HEALING_ENABLED=false`;
- nenhum candidato alternativo foi definido no Page Object;
- o elemento realmente saiu da tela;
- o label ou atributo semântico também mudou.

Esse comportamento é esperado. O self-healing não deve mascarar mudança funcional. Quando a tela muda de verdade, ajuste o Page Object e mantenha o evento de healing como evidência da transição.

### ZodError ao criar massa de teste

Esse erro significa que os dados gerados não cumpriram o contrato. Exemplos:

- e-mail fora de `example.test`;
- senha sem complexidade mínima;
- role fora da lista permitida;
- país fora do enum.

No modo com OpenAI, revise o prompt ou o schema. No fallback local, revise `tests/fixtures/fallback-registration-user.json`.

### O relatório não apareceu no GitHub Actions

O artifact só será útil se o Playwright conseguir iniciar a execução. Confira:

- se `npm ci` passou;
- se `npx playwright install --with-deps chromium` passou;
- se o job chegou até a etapa `Run Playwright E2E tests`;
- se o diretório `playwright-report/` foi criado.

O workflow usa `if: always()` no upload, então o artifact é enviado mesmo quando os testes falham.

## Contato / Portfólio

Portfólio: https://douglasqa.netlify.app
