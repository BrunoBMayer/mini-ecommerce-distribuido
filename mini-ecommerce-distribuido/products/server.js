require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PRODUCTS_PORT || 5002;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({
    service: "Products Service",
    status: "running",
  });
});

// TODO: implementar
// GET /products
// GET /products/:id
// POST /products
// Replicação em products_replica_1.json e products_replica_2.json

app.listen(PORT, () => {
  console.log(`Products Service rodando na porta ${PORT}`);
});
