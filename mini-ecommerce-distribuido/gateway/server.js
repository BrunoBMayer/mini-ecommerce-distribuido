require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.GATEWAY_PORT || 5000;

const services = {
  users: {
    name: "users",
    url: process.env.USERS_URL || "http://localhost:5001",
    online: false,
    failedAttempts: 0,
  },
  products: {
    name: "products",
    url: process.env.PRODUCTS_URL || "http://localhost:5002",
    online: false,
    failedAttempts: 0,
  },
  orders: {
    name: "orders",
    url: process.env.ORDERS_URL || "http://localhost:5003",
    online: false,
    failedAttempts: 0,
  },
};

function writeHeartbeatLog(message) {
  const logPath = path.join(__dirname, "logs", "heartbeat.log");
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

async function checkServiceHealth(service) {
  try {
    const response = await axios.get(`${service.url}/health`, { timeout: 2000 });

    if (response.data.status === "ok") {
      if (!service.online) {
        writeHeartbeatLog(`${service.name} recovered`);
      }

      service.online = true;
      service.failedAttempts = 0;
    }
  } catch (error) {
    service.failedAttempts += 1;

    if (service.failedAttempts >= 2 && service.online) {
      service.online = false;
      writeHeartbeatLog(`${service.name} offline`);
    }

    if (service.failedAttempts >= 2) {
      service.online = false;
    }
  }
}

function startHeartbeat() {
  setInterval(() => {
    Object.values(services).forEach(checkServiceHealth);
  }, 5000);
}

app.get("/", (req, res) => {
  res.json({
    message: "API Gateway do Mini E-commerce Distribuído",
    statusRoute: "/status",
  });
});

app.get("/status", (req, res) => {
  res.json({
    users: services.users.online ? "online" : "offline",
    products: services.products.online ? "online" : "offline",
    orders: services.orders.online ? "online" : "offline",
  });
});

// TODO: próximas etapas
// 1. Encaminhar rotas /users/* para o serviço users.
// 2. Encaminhar rotas /products/* para o serviço products.
// 3. Encaminhar rotas /orders/* para o serviço orders.
// 4. Validar se o serviço está online antes de encaminhar.

app.listen(PORT, () => {
  console.log(`API Gateway rodando na porta ${PORT}`);
  startHeartbeat();
});
