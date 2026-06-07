# QA AI Playwright OpenAI

Projeto de automação E2E com Playwright, TypeScript e integração com a API da OpenAI para demonstrar duas práticas aplicadas à qualidade de software:

- geração de massa de dados dinâmica e validada por schema;
- recuperação controlada de seletores quando há drift simples na interface.

A prova de conceito usa um formulário de cadastro local. O teste cria um usuário sintético, preenche o fluxo E2E e registra os eventos de self-healing como evidência de execução.

## Propósito do projeto

O objetivo é demonstrar como IA pode apoiar automação de testes sem remover previsibilidade do processo de QA.

A camada de OpenAI fica isolada em um helper específico, com validação Zod e fallback determinístico para permitir execução em CI ou ambientes sem chave configurada. A camada de self-healing não substitui bons seletores; ela reduz falhas por mudanças superficiais e mantém evidência do seletor alternativo usado.

## Pré-requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- Chave da OpenAI para execução com dados gerados por IA
- Navegadores do Playwright instalados

## Estrutura do repositório

```text
.
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

## Configuração

Instale as dependências:

```bash
npm install
```

Instale os navegadores do Playwright:

```bash
npm run install:browsers
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Para executar sem chamada real à OpenAI, mantenha:

```env
USE_OPENAI_DATA=false
ALLOW_AI_FALLBACK=true
```

Para executar usando a API:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.5
USE_OPENAI_DATA=true
ALLOW_AI_FALLBACK=false
```

## Execução

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

Abrir o relatório HTML:

```bash
npm run test:report
```

Validar tipos TypeScript:

```bash
npm run typecheck
```

## Tecnologias utilizadas

- Playwright Test
- TypeScript
- OpenAI Responses API
- Structured Outputs
- Zod
- dotenv
- Vite

## Decisões técnicas

`AiTestDataFactory` centraliza a geração de dados. Quando `USE_OPENAI_DATA=true`, o projeto solicita à OpenAI um usuário sintético compatível com o schema definido. O retorno é validado antes de entrar no teste.

`SelfHealingLocator` tenta o seletor principal primeiro. Se ele não estiver disponível, candidatos alternativos são avaliados em ordem explícita. O teste anexa os eventos de healing ao relatório para evitar que a recuperação passe despercebida.

O Page Object `RegistrationPage` concentra as ações do fluxo e mantém a especificação E2E focada no comportamento esperado.

## Contato / Portfólio

Portfólio: https://douglasqa.netlify.app
