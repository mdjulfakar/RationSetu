
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PORT = process.env.PORT || 3000;

// Temporary admin sessions
const adminSessions = new Set();

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({
      success: false,
      message: "Admin login required"
    });
  }

  next();
}

// Server check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RationSetu Backend is running"
  });
});

// Get products
app.get("/api/products", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, products: data });
});

// Place COD order
app.post("/api/orders", async (req, res) => {
  const {
    customer_name,
    mobile,
    address,
    items,
    total_amount
  } = req.body;

  if (
    !customer_name ||
    !mobile ||
    !address ||
    !Array.isArray(items) ||
    items.length === 0 ||
    !Number.isFinite(Number(total_amount)) ||
    Number(total_amount) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide all order details"
    });
  }

  const order = {
    customer_name,
    mobile,
    address,
    items,
    total_amount: Number(total_amount),
    payment_method: "COD",
    status: "Pending"
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    order: data
  });
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  const { admin_id, password } = req.body;

  if (
    !admin_id ||
    !password ||
    admin_id !== process.env.ADMIN_ID ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid Admin ID or Password"
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  adminSessions.add(token);

  res.json({
    success: true,
    message: "Admin login successful",
    token
  });
});

// Admin: View all orders
app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  res.json({ success: true, orders: data });
});

// Admin: Update order status
app.patch("/api/admin/orders/:id", requireAdmin, async (req, res) => {
  const allowedStatuses = [
    "Pending",
    "Accepted",
    "Preparing",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
  ];

  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order status"
    });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  res.json({ success: true, order: data });
});

// Admin: Add product
app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const { name, price, stock, category, image_url } = req.body;

  if (
    !name ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0 ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid product name, price and stock required"
    });
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      price: Number(price),
      stock: Number(stock),
      category: category || null,
      image_url: image_url || null,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  res.status(201).json({ success: true, product: data });
});

// Admin: Update product
app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const allowedFields = ["name", "price", "stock", "category", "image_url", "is_active"];
  const updates = {};

  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid product updates provided"
    });
  }

  if ("price" in updates &&
      (!Number.isFinite(Number(updates.price)) || Number(updates.price) < 0)) {
    return res.status(400).json({ success: false, message: "Invalid price" });
  }

  if ("stock" in updates &&
      (!Number.isInteger(Number(updates.stock)) || Number(updates.stock) < 0)) {
    return res.status(400).json({ success: false, message: "Invalid stock" });
  }

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  res.json({ success: true, product: data });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`RationSetu server running on port ${PORT}`);
});
