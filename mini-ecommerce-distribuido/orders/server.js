require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.ORDERS_PORT || 5003;
const JWT_SECRET = process.env.JWT_SECRET || "chave_super_secreta_do_projeto";
const PRODUCTS_URL = process.env.PRODUCTS_URL || "http://localhost:5002";
const DATA_PATH = path.join(__dirname, "data", "orders.json");

function readOrders() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, "[]");
  }

  const content = fs.readFileSync(DATA_PATH, "utf-8");
  return content.trim() ? JSON.parse(content) : [];
}

function saveOrders(orders) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(orders, null, 2));
}

function generateId(orders) {
  const lastId = orders.reduce((max, order) => Math.max(max, order.id), 0);
  return lastId + 1;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token JWT nao informado." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token JWT invalido ou expirado." });
  }
}

async function fetchProduct(productId) {
  const response = await axios.get(`${PRODUCTS_URL}/products/${productId}`, {
    timeout: 3000,
  });

  return response.data;
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({
    service: "Orders Service",
    status: "running",
  });
});

app.post("/orders", authenticateToken, async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({
      error: "productId e obrigatorio.",
    });
  }

  const parsedProductId = Number(productId);
  const parsedQuantity = Number(quantity);

  if (Number.isNaN(parsedProductId)) {
    return res.status(400).json({
      error: "productId deve ser numerico.",
    });
  }

  if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({
      error: "quantity deve ser um numero maior que zero.",
    });
  }

  let product;

  try {
    product = await fetchProduct(parsedProductId);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Produto nao encontrado." });
    }

    return res.status(503).json({
      error: "Products Service indisponivel para validar o pedido.",
    });
  }

  if (product.stock !== undefined && product.stock < parsedQuantity) {
    return res.status(400).json({
      error: "Estoque insuficiente para este pedido.",
    });
  }

  const orders = readOrders();
  const order = {
    id: generateId(orders),
    userId: req.user.userId,
    productId: parsedProductId,
    productName: product.name,
    quantity: parsedQuantity,
    unitPrice: product.price,
    total: Number((product.price * parsedQuantity).toFixed(2)),
    status: "created",
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  saveOrders(orders);

  return res.status(201).json(order);
});

app.get("/orders/:userId", authenticateToken, (req, res) => {
  const requestedUserId = Number(req.params.userId);

  if (req.user.role !== "admin" && req.user.userId !== requestedUserId) {
    return res.status(403).json({
      error: "Voce so pode consultar os proprios pedidos.",
    });
  }

  const orders = readOrders();
  const userOrders = orders.filter((order) => order.userId === requestedUserId);

  return res.json(userOrders);
});

app.listen(PORT, () => {
  console.log(`Orders Service rodando na porta ${PORT}`);
});
