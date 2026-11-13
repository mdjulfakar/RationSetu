

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

// ================= ADMIN PANEL PAGE =================

app.get("/admin/index.htm", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.htm"));
});

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PORT = process.env.PORT || 3000;

// ================= ADMIN SECURITY =================

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

// ================= SHOP SETTINGS =================

const RATIONSETU_SETTINGS_FILE = "rationsetu-settings.json";

async function getRationSetuSettings() {
  const bucket =
    process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(RATIONSETU_SETTINGS_FILE);

  if (error || !data) {
    return {
      shop_address: "जटवारा चौक, पौसी, वार्ड नंबर 2, कुर्साकांटा, अररिया, बिहार",
      shop_lat: 26.409748,
      shop_lng: 87.406212,
      support_phone: "",
      radius_km: 15,
      delivery_base_charge: 40,
      delivery_additional_km_charge: 5,
      platform_fee: 5,
      weight_surcharge_per_5kg: 10
    };
  }

  try {
    return JSON.parse(await data.text());
  } catch (error) {
    throw new Error("Saved shop settings could not be read");
  }
}

// Calculate straight-line distance between GPS coordinates.
function rationsetuDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = value => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}

// ================= SERVER CHECK =================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RationSetu Backend is running"
  });
});

// ================= CUSTOMER: PRODUCTS =================

app.get("/api/products", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      products: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= CUSTOMER: PLACE COD ORDER =================

app.post("/api/orders", async (req, res) => {
  try {
    const {
      customer_name,
      mobile,
      address,
      items,
      total_amount,
      customer_lat,
      customer_lng
    } = req.body;

    if (
      !String(customer_name || "").trim() ||
      !/^[0-9]{10}$/.test(String(mobile || "").trim()) ||
      !String(address || "").trim() ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !Number.isFinite(Number(total_amount)) ||
      Number(total_amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide customer name, valid mobile, full address and order items."
      });
    }

    if (
      customer_lat === undefined ||
      customer_lng === undefined ||
      customer_lat === null ||
      customer_lng === null ||
      !Number.isFinite(Number(customer_lat)) ||
      !Number.isFinite(Number(customer_lng)) ||
      Number(customer_lat) < -90 ||
      Number(customer_lat) > 90 ||
      Number(customer_lng) < -180 ||
      Number(customer_lng) > 180
    ) {
      return res.status(400).json({
        success: false,
        code: "LOCATION_REQUIRED",
        message: "Please allow location access to check store availability."
      });
    }

    const settings = await getRationSetuSettings();

    if (
      settings.shop_lat === null ||
      settings.shop_lng === null ||
      settings.shop_lat === undefined ||
      settings.shop_lng === undefined ||
      !Number.isFinite(Number(settings.shop_lat)) ||
      !Number.isFinite(Number(settings.shop_lng))
    ) {
      return res.status(503).json({
        success: false,
        code: "STORE_LOCATION_NOT_SET",
        message: "Store location has not been configured by admin yet."
      });
    }

    // ================= NEW RATES =================

    const radiusKm = 15;
    const deliveryBaseCharge = 40;
    const additionalKmCharge = 5;
    const platformFee = 5;
    const weightSurchargePer5Kg = 10;

    const distanceKm = rationsetuDistanceKm(
      Number(settings.shop_lat),
      Number(settings.shop_lng),
      Number(customer_lat),
      Number(customer_lng)
    );

    if (distanceKm > radiusKm) {
      return res.status(403).json({
        success: false,
        code: "STORE_NOT_AVAILABLE",
        message: "Store not available. Delivery is available only within 15 KM.",
        distance_km: Number(distanceKm.toFixed(2)),
        radius_km: radiusKm
      });
    }

    const subtotal = Number(total_amount);

    const chargedDistanceKm = Math.max(1, Math.ceil(distanceKm));

    const deliveryCharge =
      deliveryBaseCharge + (chargedDistanceKm - 1) * additionalKmCharge;

    const totalWeightKg = items.reduce((sum, item) => {
      const unit = String(item.unit || "").trim().toLowerCase();
      const quantity = Number(item.qty);

      const isKgUnit = [
        "किलो",
        "किलोग्राम",
        "kg",
        "kgs",
        "kilogram",
        "kilograms"
      ].includes(unit);

      if (isKgUnit && Number.isFinite(quantity) && quantity > 0) {
        return sum + quantity;
      }

      return sum;
    }, 0);

    const weightSurcharge =
      totalWeightKg <= 5
        ? 0
        : Math.ceil((totalWeightKg - 5) / 5) * weightSurchargePer5Kg;

    const finalTotal =
      subtotal + deliveryCharge + weightSurcharge + platformFee;

    const order = {
      customer_name: String(customer_name).trim(),
      mobile: String(mobile).trim(),
      address: String(address).trim(),
      items,
      total_amount: finalTotal,
      item_subtotal: subtotal,
      customer_lat: Number(customer_lat),
      customer_lng: Number(customer_lng),
      delivery_distance_km: Number(distanceKm.toFixed(2)),
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

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: data,
      delivery: {
        distance_km: Number(distanceKm.toFixed(2)),
        charged_distance_km: chargedDistanceKm,
        delivery_base_charge: deliveryBaseCharge,
        additional_km_charge: additionalKmCharge,
        delivery_charge: deliveryCharge,
        total_weight_kg: Number(totalWeightKg.toFixed(2)),
        weight_surcharge: weightSurcharge,
        platform_fee: platformFee,
        subtotal,
        payable_total: finalTotal
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Order could not be placed."
    });
  }
});

// ================= ADMIN: LOGIN =================

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

// ================= ADMIN: VIEW ORDERS =================

app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  try {
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

    res.json({
      success: true,
      orders: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= ADMIN: UPDATE ORDER STATUS + HISTORY =================

app.patch("/api/admin/orders/:id", requireAdmin, async (req, res) => {
  try {
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

    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: data.id,
        status: status,
        note: "Order status updated by admin",
        changed_by: "admin"
      });

    if (historyError) {
      console.error("Order history save failed:", historyError.message);
    }

    res.json({
      success: true,
      order: data,
      history_saved: !historyError
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= ADMIN: UPLOAD PRODUCT IMAGE =================

app.post(
  "/api/admin/products/upload-image",
  requireAdmin,
  express.raw({
    type: "multipart/form-data",
    limit: "6mb"
  }),
  async (req, res) => {
    try {
      const contentType = req.headers["content-type"] || "";
      const match = contentType.match(
        /boundary=(?:"([^"]+)"|([^;]+))/i
      );
      const boundaryValue = match && (match[1] || match[2]);

      if (!boundaryValue || !Buffer.isBuffer(req.body)) {
        return res.status(400).json({
          success: false,
          message: "Product image file is required"
        });
      }

      const body = req.body;
      const boundary = Buffer.from("--" + boundaryValue.trim());
      const separator = Buffer.from("\r\n\r\n");
      const nextBoundary = Buffer.from(
        "\r\n--" + boundaryValue.trim()
      );

      let fileBuffer = null;
      let mimeType = "";
      let position = body.indexOf(boundary);

      while (position !== -1) {
        const headersStart = position + boundary.length + 2;
        const headersEnd = body.indexOf(separator, headersStart);

        if (headersEnd === -1) break;

        const headers = body
          .subarray(headersStart, headersEnd)
          .toString("utf8");

        const dataStart = headersEnd + separator.length;
        const dataEnd = body.indexOf(nextBoundary, dataStart);

        if (dataEnd === -1) break;

        if (/content-disposition:[^\r\n]*name="file"/i.test(headers)) {
          const typeMatch = headers.match(
            /content-type:\s*([^\r\n]+)/i
          );

          mimeType = typeMatch
            ? typeMatch[1].trim().toLowerCase()
            : "";

          fileBuffer = body.subarray(dataStart, dataEnd);
          break;
        }

        position = body.indexOf(boundary, dataEnd + 2);
      }

      const allowedTypes = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
      };

      if (
        !fileBuffer ||
        fileBuffer.length === 0 ||
        !allowedTypes[mimeType]
      ) {
        return res.status(400).json({
          success: false,
          message: "Please upload JPG, PNG or WEBP image"
        });
      }

      const bucket =
        process.env.SUPABASE_PRODUCT_IMAGES_BUCKET ||
        "product-images";

      const filePath =
        `products/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${allowedTypes[mimeType]}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: false
        });

      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message
        });
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return res.status(201).json({
        success: true,
        image_url: data.publicUrl,
        url: data.publicUrl
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Image upload failed"
      });
    }
  }
);

// ================= ADMIN: VIEW ALL PRODUCTS =================

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      products: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= ADMIN: ADD PRODUCT =================

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  try {
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

    res.status(201).json({
      success: true,
      product: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= ADMIN: UPDATE PRODUCT =================

app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "price",
      "stock",
      "category",
      "image_url",
      "is_active"
    ];

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

    if (
      "price" in updates &&
      (!Number.isFinite(Number(updates.price)) ||
        Number(updates.price) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid price"
      });
    }

    if (
      "stock" in updates &&
      (!Number.isInteger(Number(updates.stock)) ||
        Number(updates.stock) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock"
      });
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

    res.json({
      success: true,
      product: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= PUBLIC APP CONFIG =================

app.get("/api/config", async (req, res) => {
  try {
    const settings = await getRationSetuSettings();

    res.json({
      success: true,
      shop_address: settings.shop_address,
      support_phone: settings.support_phone,
      radius_km: settings.radius_km,
      delivery_base_charge: 40,
      delivery_additional_km_charge: 5,
      platform_fee: 5,
      weight_surcharge_per_5kg: 10,
      shop_location_ready:
        settings.shop_lat !== null &&
        settings.shop_lng !== null &&
        settings.shop_lat !== undefined &&
        settings.shop_lng !== undefined &&
        Number.isFinite(Number(settings.shop_lat)) &&
        Number.isFinite(Number(settings.shop_lng))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= ADMIN: SAVE SHOP LOCATION & SETTINGS =================

app.post("/api/admin/config", requireAdmin, async (req, res) => {
  try {
    const {
      shop_lat,
      shop_lng,
      support_phone,
      shop_address
    } = req.body;

    if (
      shop_lat === undefined ||
      shop_lng === undefined ||
      shop_lat === null ||
      shop_lng === null ||
      !Number.isFinite(Number(shop_lat)) ||
      !Number.isFinite(Number(shop_lng)) ||
      Number(shop_lat) < -90 ||
      Number(shop_lat) > 90 ||
      Number(shop_lng) < -180 ||
      Number(shop_lng) > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid shop GPS coordinates are required"
      });
    }

    const previous = await getRationSetuSettings();

    const {
      rate_per_km,
      fixed_extra_fee,
      delivery_person_share,
      rationsetu_share,
      ...previousSettings
    } = previous;

    const settings = {
      ...previousSettings,
      shop_lat: Number(shop_lat),
      shop_lng: Number(shop_lng),
      shop_address: shop_address || previous.shop_address,
      support_phone:
        support_phone !== undefined
          ? String(support_phone).trim()
          : previous.support_phone,
      radius_km: 15,
      delivery_base_charge: 40,
      delivery_additional_km_charge: 5,
      platform_fee: 5,
      weight_surcharge_per_5kg: 10
    };

    const bucket =
      process.env.SUPABASE_PRODUCT_IMAGES_BUCKET ||
      "product-images";

    const { error } = await supabase.storage
      .from(bucket)
      .upload(
        RATIONSETU_SETTINGS_FILE,
        Buffer.from(JSON.stringify(settings, null, 2)),
        {
          contentType: "application/json",
          upsert: true
        }
      );

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      message: "Shop location and settings saved",
      settings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= APP PRESENCE / HEARTBEAT =================

const presenceClients = new Map();

app.post("/api/presence/heartbeat", (req, res) => {
  const clientId =
    typeof req.body?.client_id === "string"
      ? req.body.client_id.trim()
      : "";

  if (!clientId || clientId.length > 200) {
    return res.status(400).json({
      success: false,
      online: false,
      message: "Valid client_id is required"
    });
  }

  const now = Date.now();
  presenceClients.set(clientId, now);

  for (const [id, lastSeen] of presenceClients.entries()) {
    if (now - lastSeen > 90 * 1000) {
      presenceClients.delete(id);
    }
  }

  return res.json({
    success: true,
    online: true
  });
});

// ================= START SERVER =================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`RationSetu server running on port ${PORT}`);
});
