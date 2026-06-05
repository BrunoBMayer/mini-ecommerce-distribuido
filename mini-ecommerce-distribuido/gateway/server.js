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
const HEARTBEAT_INTERVAL_MS = 5000;
const HEALTH_TIMEOUT_MS = 2000;

const services = {
  users: {
    name: "users",
    url: process.env.USERS_URL || "http://localhost:5001",
    online: false,
    failedAttempts: 0,
    failureLogged: false,
  },
  products: {
    name: "products",
    url: process.env.PRODUCTS_URL || "http://localhost:5002",
    online: false,
    failedAttempts: 0,
    failureLogged: false,
  },
  orders: {
    name: "orders",
    url: process.env.ORDERS_URL || "http://localhost:5003",
    online: false,
    failedAttempts: 0,
    failureLogged: false,
  },
};

function writeHeartbeatLog(message) {
  const logDir = path.join(__dirname, "logs");
  const logPath = path.join(logDir, "heartbeat.log");
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

async function checkServiceHealth(service) {
  try {
    const response = await axios.get(`${service.url}/health`, {
      timeout: HEALTH_TIMEOUT_MS,
    });

    if (response.data.status === "ok") {
      if (!service.online && service.failureLogged) {
        writeHeartbeatLog(`${service.name} recovered`);
      }

      service.online = true;
      service.failedAttempts = 0;
      service.failureLogged = false;
    }
  } catch (error) {
    service.failedAttempts += 1;

    if (service.failedAttempts >= 2) {
      service.online = false;

      if (!service.failureLogged) {
        writeHeartbeatLog(`${service.name} offline`);
        service.failureLogged = true;
      }
    }
  }
}

function startHeartbeat() {
  Object.values(services).forEach(checkServiceHealth);

  setInterval(() => {
    Object.values(services).forEach(checkServiceHealth);
  }, HEARTBEAT_INTERVAL_MS);
}

function getForwardHeaders(req) {
  const headers = {};

  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }

  return headers;
}

function proxyTo(service) {
  return async (req, res) => {
    if (!service.online) {
      return res.status(503).json({
        error: `${service.name} service indisponivel.`,
      });
    }

    try {
      const response = await axios({
        method: req.method,
        url: `${service.url}${req.originalUrl}`,
        data: req.body,
        headers: getForwardHeaders(req),
        timeout: 5000,
        validateStatus: () => true,
      });

      return res.status(response.status).json(response.data);
    } catch (error) {
      service.online = false;
      service.failedAttempts = 2;

      if (!service.failureLogged) {
        writeHeartbeatLog(`${service.name} offline during request`);
        service.failureLogged = true;
      }

      return res.status(503).json({
        error: `${service.name} service indisponivel.`,
      });
    }
  };
}

app.get("/", (req, res) => {
  res.json({
    message: "API Gateway do Mini E-commerce Distribuido",
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

app.use("/users", proxyTo(services.users));
app.use("/products", proxyTo(services.products));
app.use("/orders", proxyTo(services.orders));

app.listen(PORT, () => {
  console.log(`API Gateway rodando na porta ${PORT}`);
  startHeartbeat();
});
