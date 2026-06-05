require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PRODUCTS_PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET || "chave_super_secreta_do_projeto";
const REPLICA_PATHS = [
  path.join(__dirname, "data", "products_replica_1.json"),
  path.join(__dirname, "data", "products_replica_2.json"),
];

let nextReplicaIndex = 0;

function ensureReplicaFiles() {
  REPLICA_PATHS.forEach((replicaPath) => {
    if (!fs.existsSync(replicaPath)) {
      fs.writeFileSync(replicaPath, "[]");
    }
  });
}

function readReplica(replicaPath) {
  ensureReplicaFiles();
  const content = fs.readFileSync(replicaPath, "utf-8");
  return content.trim() ? JSON.parse(content) : [];
}

function readProducts() {
  const replicaPath = REPLICA_PATHS[nextReplicaIndex];
  nextReplicaIndex = (nextReplicaIndex + 1) % REPLICA_PATHS.length;
  return readReplica(replicaPath);
}

function saveProductsInAllReplicas(products) {
  REPLICA_PATHS.forEach((replicaPath) => {
    fs.writeFileSync(replicaPath, JSON.stringify(products, null, 2));
  });
}

function generateId(products) {
  const lastId = products.reduce((max, product) => Math.max(max, product.id), 0);
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

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Apenas administradores podem criar produtos.",
    });
  }

  return next();
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({
    service: "Products Service",
    status: "running",
  });
});

app.get("/products", (req, res) => {
  const products = readProducts();
  return res.json(products);
});

app.get("/products/:id", (req, res) => {
  const productId = Number(req.params.id);
  const products = readProducts();
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return res.status(404).json({ error: "Produto nao encontrado." });
  }

  return res.json(product);
});

app.post("/products", authenticateToken, requireAdmin, (req, res) => {
  const { name, description = "", price, stock = 0 } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({
      error: "Nome e preco sao obrigatorios.",
    });
  }

  const parsedPrice = Number(price);
  const parsedStock = Number(stock);

  if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({
      error: "Preco deve ser um numero maior que zero.",
    });
  }

  if (Number.isNaN(parsedStock) || parsedStock < 0) {
    return res.status(400).json({
      error: "Estoque deve ser um numero maior ou igual a zero.",
    });
  }

  const products = readReplica(REPLICA_PATHS[0]);
  const product = {
    id: generateId(products),
    name,
    description,
    price: parsedPrice,
    stock: parsedStock,
    createdAt: new Date().toISOString(),
  };

  products.push(product);
  saveProductsInAllReplicas(products);

  return res.status(201).json(product);
});

app.listen(PORT, () => {
  console.log(`Products Service rodando na porta ${PORT}`);
});
