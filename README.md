# Fidelis

Sistema web de fidelidade para lojas. Dois módulos independentes compartilham
a mesma API:

- **Painel da Loja** — lojista cadastra a loja, pontua clientes, gerencia
  recompensas e consulta extrato.
- **App do Cliente** — consumidor acompanha saldo em cada loja, resgata
  recompensas e visualiza um cartão de fidelidade 3D interativo.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Go 1.25 · Gin · pgx/v5 (pool nativo) · golang-jwt · bcrypt |
| Banco | PostgreSQL 16 (com pgcrypto, triggers e CHECKs) |
| Frontend | React 18 · TypeScript · Vite 6 · Tailwind v4 (CSS-first) · React Router 7 |
| Cliente (3D) | React Three Fiber · drei · three.js |
| Infra | Docker Compose · `air` (hot reload do Go) |

## Estrutura

```
Fidelis/
├── backend/                      # API Go
│   ├── cmd/api/main.go           # entrypoint
│   ├── cmd/seed/main.go          # seed de desenvolvimento
│   ├── internal/
│   │   ├── config/               # carga de env
│   │   ├── database/             # pgxpool
│   │   ├── handler/              # camada HTTP (Gin)
│   │   ├── middleware/           # Auth, RequireRole, CORS
│   │   ├── model/                # User, Store, Reward, ...
│   │   ├── repository/           # SQL (sem ORM)
│   │   ├── router/               # registro de rotas
│   │   └── service/              # regras de negócio
│   ├── migrations/0001_init.sql  # schema + triggers
│   ├── pkg/jwtauth/              # emissão/validação de JWT
│   ├── pkg/password/             # bcrypt
│   └── Dockerfile                # multi-stage (dev com air + prod distroless)
├── frontend/
│   ├── loja/                     # SPA do lojista
│   └── cliente/                  # SPA do cliente (com R3F)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Como rodar

### Pré-requisitos

- Docker Desktop (Windows/Mac) ou Docker Engine + Compose plugin (Linux)
- Opcional pra DX: Node 22 e Go 1.25 instalados localmente (faz o LSP do
  editor parar de reclamar de imports; o stack todo roda só com Docker).

### Subir o stack

```powershell
copy .env.example .env
docker compose up --build
```

Sobe quatro serviços:

| Serviço | Porta | URL |
|---|---|---|
| Postgres | 5432 | — |
| API Go | 8080 | http://localhost:8080/health |
| Painel da Loja | 5173 | http://localhost:5173 |
| App do Cliente | 5174 | http://localhost:5174 |

A primeira execução leva alguns minutos (downloads de imagens + `npm install`
nos frontends). Depois o `air` recompila o backend e o Vite faz HMR dos
frontends automaticamente.

### Popular dados de demo

Em outro terminal:

```powershell
docker compose exec backend go run ./cmd/seed
```

O seed **apaga todos os dados** (TRUNCATE CASCADE) e cria:

| Item | Credencial / Detalhe |
|---|---|
| Lojista demo | `lojista@fidelis.dev` / `lojista123` |
| Cliente demo | `cliente@fidelis.dev` / `cliente123` (saldo 1000) |
| Loja demo | slug `loja-demo`, primary color `#7c3aed` |
| Recompensas | Café (50pts), Desconto 10% (200pts), Brinde (500pts) |

### Adicionar dependência depois que o stack já subiu

Frontends usam volume nomeado para `node_modules` (cache persistente). Ao
adicionar uma dep nova em `package.json`:

```powershell
docker compose exec frontend-loja npm install
# ou
docker compose exec frontend-cliente npm install
```

## Fluxo de teste end-to-end

**Lojista** em http://localhost:5173:

1. Login com `lojista@fidelis.dev` / `lojista123`
2. Tab **Pontuar** → email `cliente@fidelis.dev`, 150 pontos, valor R$75,50
3. Tab **Recompensas** → "+ Nova" → cria recompensa de 100 pts
4. Tab **Clientes** → vê o cliente com saldo atualizado
5. Tab **Extrato** → filtra por tipo, vê todas as movimentações
6. Tab **Perfil** → edita nome (avatar atualiza na hora) ou troca senha

**Cliente** em http://localhost:5174:

1. Login com `cliente@fidelis.dev` / `cliente123`
2. Vê o **LoyaltyCard3D** girando — arraste com o mouse pra inclinar
3. Resgata uma recompensa abaixo → saldo cai imediatamente
4. Tab **Extrato** → feed cronológico com o resgate no topo
5. Tab **Perfil** → edita dados

## API

Todas as rotas autenticadas exigem `Authorization: Bearer <token>`.
Erros vêm em JSON `{ error: "code", message: "texto" }`.

### Públicas

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Login (devolve token + user) |
| POST | `/auth/register/lojista` | Cadastro de lojista + loja (transação) |
| POST | `/auth/register/cliente` | Cadastro de cliente |
| GET | `/health` | Health check + ping no Postgres |

### Autenticadas

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/me` | Qualquer |
| PATCH | `/api/me` | Qualquer (nome + telefone) |
| POST | `/api/me/password` | Qualquer (exige senha atual) |
| GET | `/api/me/stores` | Qualquer (lista lojas em que o caller é membro) |
| GET | `/api/me/transactions` | Qualquer (extrato do caller; filtros: `store_id`, `limit`, `offset`) |
| GET | `/api/users/:id/balance` | Self ou admin (saldo por loja) |
| GET | `/api/stores/:id/rewards` | Qualquer (catálogo ativo, dentro da janela, com estoque) |
| GET | `/api/stores/:id/rewards/admin` | Lojista membro (catálogo completo) |
| POST | `/api/stores/:id/rewards` | Lojista membro |
| PATCH | `/api/stores/:id/rewards/:rewardId` | Lojista membro |
| DELETE | `/api/stores/:id/rewards/:rewardId` | Lojista membro (soft delete) |
| GET | `/api/stores/:id/members` | Lojista membro (clientes da loja com saldo) |
| GET | `/api/stores/:id/transactions` | Lojista membro (extrato da loja; filtros: `type`, `limit`, `offset`) |
| POST | `/api/stores/:id/points` | Lojista (creditar pontos ao cliente) |
| POST | `/api/stores/:id/redemptions` | Cliente (resgatar recompensa) |

## Decisões importantes

### Ledger imutável

`point_transactions` é a **fonte da verdade** dos pontos. Um trigger
`BEFORE UPDATE OR DELETE` rejeita qualquer modificação — só se aceita
`INSERT`. Reversões são feitas inserindo uma transação compensatória do
tipo `adjustment`.

### Saldo sustentado pelo banco

`memberships.points_balance` é mantido em sincronia com o ledger por um
trigger `AFTER INSERT`. A coluna tem `CHECK (points_balance >= 0)`, o que
**impede saldo negativo no nível do banco** — mesmo se o código tiver um
bug. Um resgate sem saldo aborta a transação inteira (incluindo o decremento
de estoque da recompensa que foi feito na mesma transação).

### Concorrência no resgate

`RedemptionService.Redeem` usa `SELECT ... FOR UPDATE` na recompensa para
evitar race em decremento de estoque quando dois clientes resgatam o último
item simultaneamente.

### Soft delete em rewards

`DELETE /api/stores/:id/rewards/:rewardId` faz `UPDATE active = FALSE`.
Apagar fisicamente quebraria a FK em `point_transactions.reward_id`
(resgates antigos perderiam referência).

### Cadastro de lojista é atômico

`RegistrationService.RegisterLojista` cria `User`, `Store` e `StoreMember`
em uma única transação. Um lojista sem loja não consegue fazer nada (não é
membro de nenhuma `store_members`), então as três entidades nascem juntas
ou não nascem.

### Defesa em profundidade na autorização

`RequireRole(lojista)` no router barra clientes. Por dentro, o service
ainda chama `assertMember(storeID, callerID)` antes de mutações — um lojista
não pode editar recompensas de outra loja mesmo que tente burlar o
middleware.

### Não vazar enumeração de usuários

O login devolve o mesmo erro (`ErrInvalidCredentials`) para "email não
existe" e "senha errada", para não permitir descobrir quem está cadastrado.

### Tailwind v4 CSS-first

Não há `tailwind.config.js`. Todos os tokens (`brand`, `surface`, raios,
sombras) vivem em `@theme { ... }` dentro de `frontend/loja/src/index.css`.
Cada `--color-foo-500` vira automaticamente as utilities `bg-foo-500`,
`text-foo-500`, etc. O cliente usa a paleta padrão do Tailwind (slate +
violet) com tema escuro fixo.

## Próximos passos

- Dashboard analítico no painel (gráfico de pontuações/resgates ao longo do
  tempo)
- Notificações in-app (cliente vê quando ganha pontos)
- Recuperação de senha por email
- Carregar modelo 3D do Blender no `LoyaltyCard3D` (slot já preparado no
  componente)
- Multi-tenant: subdomínio próprio por loja com tema customizado
