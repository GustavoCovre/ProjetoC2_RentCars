# Locadora Fluxo - API de Locação de Veículos

Sistema backend RESTful para gerenciar uma locadora de carros, incluindo cadastro de marcas, frota, locações e reservas.

## Visão geral

A API suporta:
- cadastro e autenticação de usuários
- gerenciamento de marcas e veículos
- registro de locações de carros
- controle de reservas de veículos

Todas as rotas de negócio ficam protegidas por JWT e o sistema possui papéis básicos de usuário e administrador.

## Tecnologias usadas

- Node.js + TypeScript (ES Modules)
- Express 5
- Prisma + SQLite
- Autenticação JWT
- Validação com Zod
- Testes com Vitest e Supertest

## Como rodar localmente

```bash
npm install
cp .env.example .env
# Atualize as variáveis em .env, especialmente JWT_SECRET
npm run db:generate
npm run db:migrate
npm run dev
```

A API estará disponível em `http://localhost:3000`.

## Rodando os testes

Para executar a suíte completa:

```bash
npm run db:generate && npm test
```

Para rodar apenas o Vitest:

```bash
npm test
```

Para ver cobertura:

```bash
npm run test:coverage
```

Para modo watch:

```bash
npm run test:watch
```

## Endpoints principais

### Autenticação
- `POST /auth/register` — cadastro de usuário
- `POST /auth/login` — login e retorno de JWT
- `GET /auth/me` — consulta do perfil autenticado

### Marcas
- `GET /brands` — lista marcas
- `GET /brands/:id` — retorna marca e veículos vinculados
- `POST /brands` — cria marca (ADMIN)
- `PUT /brands/:id` — atualiza marca (ADMIN)
- `DELETE /brands/:id` — remove marca (ADMIN)

### Veículos
- `GET /cars` — lista veículos com marca
- `GET /cars/:id` — detalhes do veículo
- `POST /cars` — cria veículo (ADMIN)
- `PUT /cars/:id` — atualiza veículo (ADMIN)
- `DELETE /cars/:id` — remove veículo (ADMIN)

### Locações
- `GET /rentals` — lista locações (usuário ou ADMIN)
- `GET /rentals/:id` — detalhes da locação
- `POST /rentals` — registra locação
- `PATCH /rentals/:id/return` — devolve veículo
- `DELETE /rentals/:id` — remove locação (ADMIN)

### Reservas
- `GET /bookings` — lista reservas (usuário ou ADMIN)
- `GET /bookings/:id` — detalhes da reserva
- `POST /bookings` — cria reserva
- `PATCH /bookings/:id/confirm` — confirma reserva (ADMIN)
- `DELETE /bookings/:id` — cancela reserva

## Exemplo de uso com curl

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Porto","email":"ana@fluxo.com","password":"senha123"}'

curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@fluxo.com","password":"senha123"}'

curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/auth/me
```

## Rodando os testes

```bash
npm test
npm run test:coverage
npm run test:watch
```

## Verificando o serviço

A API também oferece health check:

```bash
curl http://localhost:3000/health
```

## Observações

- mantenha `JWT_SECRET` configurado
- o banco SQLite é definido em `DATABASE_URL`
- use Prisma Studio para editar dados locais quando necessário
