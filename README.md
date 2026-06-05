# Mini E-commerce Distribuído

Projeto individual de mini e-commerce distribuído com microserviços, API Gateway, JWT, replicação de dados e heartbeat.

## Estrutura

```txt
mini-ecommerce-distribuido/
├── gateway/
│   ├── server.js
│   └── logs/
│       └── heartbeat.log
├── users/
│   ├── server.js
│   └── data/
│       └── users.json
├── products/
│   ├── server.js
│   └── data/
│       ├── products_replica_1.json
│       └── products_replica_2.json
├── orders/
│   ├── server.js
│   └── data/
│       └── orders.json
├── docs/
│   └── relatorio_base.md
├── .env.example
├── .gitignore
└── package.json
```

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo `.env.example` e renomeie para `.env`.

3. Rode todos os serviços:

```bash
npm run dev
```

4. Teste no navegador ou Postman:

```txt
GET http://localhost:5000/status
GET http://localhost:5001/health
GET http://localhost:5002/health
GET http://localhost:5003/health
```

## Portas

```txt
API Gateway: 5000
Users Service: 5001
Products Service: 5002
Orders Service: 5003
```
