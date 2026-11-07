// RationSetu API helper for the Expo app.
// Set API_BASE_URL to the deployed HTTPS API URL before using these functions.
export const API_BASE_URL = "https://YOUR-DEPLOYED-API.example.com";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `API error ${response.status}`);
  return body;
}

export const getProducts = () => request("/api/products");

export const placeCodOrder = ({ customerName, mobile, address, items }) =>
  request("/api/orders", {
    method: "POST",
    body: JSON.stringify({ customerName, mobile, address, items, paymentMethod: "COD" }),
  });

// Admin functions require the secret key. Never put a production admin key
// inside the mobile app; call these from a protected admin backend instead.
