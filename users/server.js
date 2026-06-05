require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.USERS_PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "chave_super_secreta_do_projeto";
const DATA_PATH = path.join(__dirname, "data", "users.json");

function readUsers() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, "[]");
  }

  const content = fs.readFileSync(DATA_PATH, "utf-8");
  return content.trim() ? JSON.parse(content) : [];
}

function saveUsers(users) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2));
}

function generateId(users) {
  const lastId = users.reduce((max, user) => Math.max(max, user.id), 0);
  return lastId + 1;
}

function publicUser(user)  {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
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

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({
    service: "Users Service",
    status: "running",
  });
});

app.post("/users/register", async (req, res) => {
  const { name, email, password, role = "user" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Nome, email e senha sao obrigatorios.",
    });
  }

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({
      error: "Role deve ser user ou admin.",
    });
  }

  const users = readUsers();
  const existingUser = users.find((user) => user.email === email);

  if (existingUser) {
    return res.status(409).json({ error: "Email ja cadastrado." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: generateId(users),
    name,
    email,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);

  return res.status(201).json(publicUser(user));
});

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email e senha sao obrigatorios.",
    });
  }

  const users = readUsers();
  const user = users.find((item) => item.email === email);

  if (!user) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  return res.json({
    token,
    user: publicUser(user),
  });
});

app.get("/users/:id", authenticateToken, (req, res) => {
  const requestedId = Number(req.params.id);

  if (req.user.role !== "admin" && req.user.userId !== requestedId) {
    return res.status(403).json({
      error: "Voce so pode consultar os dados do proprio usuario.",
    });
  }

  const users = readUsers();
  const user = users.find((item) => item.id === requestedId);

  if (!user) {
    return res.status(404).json({ error: "Usuario nao encontrado." });
  }

  return res.json(publicUser(user));
});

app.listen(PORT, () => {
  console.log(`Users Service rodando na porta ${PORT}`);
});
