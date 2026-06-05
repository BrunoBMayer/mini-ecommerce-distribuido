require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.ORDERS_PORT || 5003;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({
    service: "Orders Service",
    status: "running",
  });
});

// TODO: implementar
// POST /orders
// GET /orders/:userId
// Consultar Products Service antes de criar pedido

app.listen(PORT, () => {
  console.log(`Orders Service rodando na porta ${PORT}`);
});
