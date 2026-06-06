# README de Execucao - Mini E-commerce Distribuido

Este projeto implementa um mini e-commerce distribuido com quatro processos:

- API Gateway: porta 5000
- Users Service: porta 5001
- Products Service: porta 5002
- Orders Service: porta 5003

## 1. Requisitos

- Node.js instalado
- npm instalado
- Postman, Insomnia ou terminal com `curl`

## 2. Instalar dependencias

Entre na pasta do projeto:

```bash
cd mini-ecommerce-distribuido
```

Instale as dependencias:

```bash
npm install
```

## 3. Configurar variaveis de ambiente

Copie o arquivo `.env.example` para `.env`.

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux/macOS:

```bash
cp .env.example .env
```

O arquivo `.env.example` ja possui as portas e a chave JWT usadas pelo projeto.

## 4. Iniciar os servicos

Para iniciar todos os microservicos ao mesmo tempo em modo desenvolvimento:

```bash
npm run dev
```

Para iniciar todos os microservicos sem nodemon:

```bash
npm start
```

Tambem e possivel iniciar cada servico separadamente:

```bash
npm run users
npm run products
npm run orders
npm run gateway
```

## 5. Verificar se os servicos estao online

Use o gateway:

```bash
curl http://localhost:5000/status
```

Ou verifique cada servico:

```bash
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
```

Cada rota `/health` deve retornar:

```json
{ "status": "ok" }
```

## 6. Fluxo de teste pelo Gateway

### 6.1 Criar usuario admin

```bash
curl -X POST http://localhost:5000/users/register -H "Content-Type: application/json" -d '{"name":"Admin","email":"admin@email.com","password":"123456","role":"admin"}'
```

### 6.2 Fazer login do admin

```bash
curl -X POST http://localhost:5000/users/login -H "Content-Type: application/json" -d '{"email":"admin@email.com","password":"123456"}'
```

Copie o valor retornado em `token`.

### 6.3 Criar produto

Substitua `SEU_TOKEN_ADMIN` pelo token retornado no login:

```bash
curl -X POST http://localhost:5000/products -H "Content-Type: application/json" -H "Authorization: Bearer SEU_TOKEN_ADMIN" -d '{"name":"Teclado","description":"Teclado mecanico","price":199.90,"stock":10}'
```

A escrita do produto e replicada em:

- `products/data/products_replica_1.json`
- `products/data/products_replica_2.json`

### 6.4 Listar produtos

```bash
curl http://localhost:5000/products
```

### 6.5 Criar usuario comum

```bash
curl -X POST http://localhost:5000/users/register -H "Content-Type: application/json" -d '{"name":"Cliente","email":"cliente@email.com","password":"123456","role":"user"}'
```

### 6.6 Fazer login do usuario comum

```bash
curl -X POST http://localhost:5000/users/login -H "Content-Type: application/json" -d '{"email":"cliente@email.com","password":"123456"}'
```

Copie o token retornado.

### 6.7 Criar pedido

Substitua `SEU_TOKEN_USUARIO` pelo token do usuario comum:

```bash
curl -X POST http://localhost:5000/orders -H "Content-Type: application/json" -H "Authorization: Bearer SEU_TOKEN_USUARIO" -d '{"productId":1,"quantity":2}'
```

### 6.8 Listar pedidos de um usuario

Substitua `SEU_TOKEN_USUARIO` pelo token do usuario e `1` pelo id do usuario:

```bash
curl http://localhost:5000/orders/1 -H "Authorization: Bearer SEU_TOKEN_USUARIO"
```

## 7. Testar tolerancia a falhas

Com todos os servicos rodando, derrube um dos servicos, por exemplo o `orders`.

Depois consulte:

```bash
curl http://localhost:5000/status
```

O gateway deve marcar o servico como `offline` apos duas falhas no heartbeat. Se uma rota desse servico for chamada enquanto ele estiver offline, o gateway retorna erro `503`.

O log de heartbeat fica em:

```txt
gateway/logs/heartbeat.log
```

Quando o servico voltar, o gateway registra a recuperacao no mesmo log.

ᓚᘏᗢ
