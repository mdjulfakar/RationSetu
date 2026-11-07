const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "change-this-admin-key";
const DB_FILE = path.join(__dirname, "..", "data", "store.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function adminOnly(req, res, next) {
  if (req.header("x-admin-key") !== ADMIN_KEY) {
    return res.status(401).json({ error: "Admin authorization required" });
  }
  next();
}

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "RationSetu API" }));

app.get("/api/products", (_req, res) => {
  const db = readDB();
  res.json(db.products.filter(p => p.active));
});

app.post("/api/admin/products", adminOnly, (req, res) => {
  const { name, unit, price, stock } = req.body;
  if (!name || !unit || !Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: "Valid name, unit and price are required" });
  }
  const db = readDB();
  const product = {
    id: "P" + Date.now(),
    name: String(name).trim(),
    unit: String(unit).trim(),
    price: Number(price),
    stock: Math.max(0, Number(stock) || 0),
    active: true
  };
  db.products.push(product);
  writeDB(db);
  res.status(201).json(product);
});

app.patch("/api/admin/products/:id", adminOnly, (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  for (const key of ["name", "unit", "price", "stock", "active"]) {
    if (req.body[key] !== undefined) product[key] = req.body[key];
  }
  product.price = Number(product.price);
  product.stock = Number(product.stock);
  writeDB(db);
  res.json(product);
});

app.post("/api/orders", (req, res) => {
  const { customerName, mobile, address, items, paymentMethod } = req.body;
  if (!customerName || !mobile || !address || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Customer name, mobile, address and items are required" });
  }
  if (paymentMethod && paymentMethod !== "COD") {
    return res.status(400).json({ error: "Only COD is enabled in this version" });
  }
  const db = readDB();
  let total = 0;
  const orderItems = [];
  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId && p.active);
    const qty = Number(item.quantity);
    if (!product || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "Invalid product or quantity", productId: item.productId });
    }
    if (product.stock < qty) {
      return res.status(409).json({ error: "Insufficient stock", product: product.name });
    }
    orderItems.push({ productId: product.id, name: product.name, unit: product.unit, quantity: qty, unitPrice: product.price, lineTotal: product.price * qty });
    total += product.price * qty;
  }
  for (const line of orderItems) {
    const product = db.products.find(p => p.id === line.productId);
    product.stock -= line.quantity;
  }
  const order = {
    id: "RS" + Date.now(),
    customerName: String(customerName).trim(),
    mobile: String(mobile).trim(),
    address: String(address).trim(),
    items: orderItems,
    total,
    paymentMethod: "COD",
    status: "PLACED",
    createdAt: new Date().toISOString()
  };
  db.orders.unshift(order);
  writeDB(db);
  res.status(201).json({ message: "Order placed", order });
});

app.get("/api/admin/orders", adminOnly, (_req, res) => {
  res.json(readDB().orders);
});

app.patch("/api/admin/orders/:id/status", adminOnly, (req, res) => {
  const allowed = ["PLACED", "CONFIRMED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid order status" });
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  order.status = req.body.status;
  writeDB(db);
  res.json(order);
});

app.listen(PORT, () => console.log(`RationSetu API running on port ${PORT}`));
