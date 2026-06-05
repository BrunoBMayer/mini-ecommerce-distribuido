require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.USERS_PORT || 5001;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({
    service: "Users Service",
    status: "running",
  });
});

// TODO: implementar
// POST /users/register
// POST /users/login
// GET /users/:id

app.listen(PORT, () => {
  console.log(`Users Service rodando na porta ${PORT}`);
});
