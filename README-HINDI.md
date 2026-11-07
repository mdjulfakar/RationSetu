# RationSetu – तीसरी संयुक्त Starter ZIP

इस ZIP में पहली Android/Expo app source और दूसरी Store & Orders API source एक ही पैकेज में रखी गई हैं।

## फोल्डर
- `mobile/RationSetu/` – Expo React Native ऐप (Hindi catalog, cart, COD form, local admin prototype)
- `mobile/RationSetu/src/api.js` – API से products और COD order भेजने के लिए helper उदाहरण
- `backend/RationSetu-Android-Source-v2/` – Express API और शुरुआती JSON data

## जरूरी सच्चाई: अभी क्या जुड़ा है और क्या बाकी है
यह एक **combined integration starter** है, अभी live/production-ready app नहीं।
- दोनों पुराने source एक पैकेज में शामिल हैं।
- API helper फाइल जोड़ी है, लेकिन मौजूदा `App.js` अभी उस helper को कॉल नहीं करता; ऐप अभी भी AsyncStorage में local data रखता है।
- Backend का data `data/store.json` में local file पर रहता है। Hosting/reliable database backup अभी नहीं है।
- Supabase, customer mobile+password login, अलग सुरक्षित admin ID/password, और Android app का पूरा live API integration अभी बाकी है।
- कोई Firebase, OTP या payment gateway नहीं जोड़ा गया। COD ही API में उपलब्ध है।
- Admin API key को मोबाइल ऐप में डालना सुरक्षित नहीं है; production में admin के लिए सुरक्षित server-side authentication जरूरी है।

## Android/Expo ऐप चलाने के लिए
`mobile/RationSetu/` में जाकर:
1. `npm install`
2. `npx expo start`

## API चलाने के लिए
`backend/RationSetu-Android-Source-v2/` में:
1. Node.js 18+ चाहिए।
2. `npm install`
3. एक मजबूत secret सेट करके चलाएँ:
   - Linux/macOS: `ADMIN_KEY='अपनी-मजबूत-कुंजी' npm start`
   - Windows PowerShell: `$env:ADMIN_KEY='अपनी-मजबूत-कुंजी'; npm start`

Health check: `http://localhost:3000/api/health`

## फोन से उपयोग की सीमा
`localhost` फोन पर उसी फोन को दर्शाता है, दूर के ग्राहक या दुकान के फोन को नहीं। अलग-अलग फोन से ऑर्डर देखने के लिए API को HTTPS hosting पर deploy करना और फिर `mobile/RationSetu/src/api.js` में `API_BASE_URL` बदलना होगा। इसके बाद `App.js` में API helper का वास्तविक integration भी करना होगा।

## RationSetu की तय दिशा
दुकान: जटवारा, कुरसाकांटा, अररिया, बिहार। शुरुआती डिलीवरी दायरा 15 km। ग्राहक catalog/cart/COD order; दुकान मालिक products, stock और orders संभालेगा। अभी कोई paid hosting/service या payment gateway अपने-आप activate नहीं किया गया है।
