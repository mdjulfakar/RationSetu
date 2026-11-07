# RationSetu – Source v2 (Store & Orders API)

यह दूसरी ZIP, पहली RationSetu source ZIP की पूरक backend/API फाइल है।

## इसमें क्या है
- दुकान के products और prices देखने का API
- Admin key से product जोड़ने और अपडेट करने का API
- ग्राहक का COD order दर्ज करना
- Admin द्वारा orders देखना और status बदलना
- शुरुआती demo data: चावल, आटा और सरसों तेल

## चलाने के लिए
Node.js 18 या नया संस्करण चाहिए।

```bash
npm install
ADMIN_KEY="अपनी-मजबूत-कुंजी" npm start
```

डिफ़ॉल्ट local address: `http://localhost:3000`

## मुख्य endpoints
- `GET /api/health`
- `GET /api/products`
- `POST /api/orders`
- `POST /api/admin/products` (header: `x-admin-key`)
- `PATCH /api/admin/products/:id` (header: `x-admin-key`)
- `GET /api/admin/orders` (header: `x-admin-key`)
- `PATCH /api/admin/orders/:id/status` (header: `x-admin-key`)

## जरूरी सीमा
यह अभी source-code starter है, production-ready hosting, secure user login,
database backup, payment gateway, delivery tracking या Android app से जुड़ा
पूरा integration इसमें शामिल नहीं है। इसे पहली ZIP के साथ जोड़कर अगली integration
फाइल में Android app से connect किया जाएगा। Production में ADMIN_KEY को सुरक्षित
environment secret से बदलना अनिवार्य है।
