
RATIONSETU — FINAL COMPLETE REDESIGN AND PRICE CONTROL TASK

Repository: "mdjulfakar/RationSetu"
Branch: "main"
Primary file: "App.js"
Backend file: "server.js"

सबसे जरूरी निर्देश

सबसे पहले GitHub की मौजूदा "main" ब्रांच से पूरा प्रोजेक्ट पढ़ो। केवल पुरानी याद, किसी ZIP या अनुमान पर काम मत करना।

मौजूदा "App.js" लगभग 1,260 लाइनों की है और "server.js" लगभग 427 लाइनों की है। ये मौजूदा source files हैं। इन्हें छोटा करके नई demo app मत बनाना।

1. सुरक्षा और बैकअप

- बदलाव शुरू करने से पहले अलग सुरक्षित Git branch बनाओ: "rationsetu-final-redesign".
- मौजूदा "App.js", "server.js", "package.json", app configuration और सभी assets का बैकअप रखो।
- सीधे "main" पर बदलाव मत करो।
- कोई पुरानी सुविधा, API, database table, data field या configuration बिना जरूरत न हटाओ।
- किसी भी स्थिति में पुराने ऑर्डर या products का data delete/reset न करो।
- बिना जरूरत नई dependencies या paid services न जोड़ो।

2. पहले पूरे प्रोजेक्ट का निरीक्षण

- सभी source files, assets, images, configuration और build workflow जाँचो।
- "App.js" के सभी screens, functions, state, translations और styles समझो।
- "server.js" के सभी API routes और Supabase operations समझो।
- मौजूदा API URL "https://rationsetu-service.onrender.com" को बिना अनुमति न बदलो।
- Supabase connection, environment variables और secrets सुरक्षित रखो।
- मौजूदा app की working functionality की सूची बनाओ और हर बदलाव के बाद उसकी तुलना करो।

3. नया RationSetu डिज़ाइन

मेरे पहले से तय किए गए तीन-screen design को reference मानो:

1. Home Screen
2. Products Screen
3. Orders Screen

डिज़ाइन:

- मुख्य रंग Blue और White।
- Orange और Green accents।
- साफ, आधुनिक और mobile-friendly layout।
- Hindi default भाषा और English switch कायम।
- RationSetu का नाम और लोगो सही तरीके से दिखे।
- पुराने project में मौजूद सही logo asset खोजकर इस्तेमाल करो। यदि approved logo asset नहीं मिले, तो नया local logo asset बनाओ; emoji को final logo मत मानो।
- तीनों screens को एक जैसी design language में रखो।
- पुराने Admin, Settings, Cart और अन्य जरूरी screens भी redesign के साथ काम करते रहें।
- कोई भी जरूरी screen हटाना नहीं है।

4. Admin में Product Price Control जोड़ो

Admin Panel में हर मौजूदा product के साथ ये controls जोड़ो:

- "−" बटन: हर press पर कीमत ₹1 घटे।
- "+" बटन: हर press पर कीमत ₹1 बढ़े।
- कीमत ₹0 से नीचे न जा सके।
- वर्तमान कीमत साफ दिखाई दे।
- सीधे नई कीमत लिखने के लिए editable input हो।
- Save बटन दबाने पर नई कीमत backend और Supabase database में स्थायी रूप से update हो।
- Save सफल होने पर success message दिखे।
- Save असफल होने पर पुरानी कीमत वापस दिखाई जाए और error message दिखे।
- Loading के दौरान duplicate updates रोकें।
- स्क्रीन refresh या app दोबारा खोलने पर नई कीमत server से ही आए।

महत्वपूर्ण: ग्राहक के Cart में quantity बढ़ाने और घटाने वाले मौजूदा "+ / −" controls को बिल्कुल अलग रखो। Admin के price controls को Cart quantity controls से कभी मत जोड़ना।

5. Backend price update

"server.js" में पहले से यह route मौजूद है:

"PATCH /api/admin/products/:id"

इसमें "price", "stock", "name", "category", "image_url" और "is_active" update की अनुमति है।

पहले इसी मौजूदा route का उपयोग करके price update implement करो। यदि route की validation में कोई कमी हो तभी न्यूनतम जरूरी बदलाव करो।

- Admin authorization कायम रखो।
- गलत, negative या non-finite price स्वीकार न करो।
- Supabase के "products" table में सही product ID पर update करो।
- सफल response में updated product लौटाओ।
- किसी नई table या दूसरी database architecture की जरूरत नहीं है।

6. Hindi और English

दोनों भाषाओं में सभी नए labels, buttons, messages और price controls के translations जोड़ो।

मौजूदा language switch, saved language preference और सभी पुराने translations कायम रखो।

7. पुराने फीचर्स सुरक्षित रखना

इन सभी सुविधाओं को काम करते रहने की जाँच करो:

- Customer product list और search
- Product images
- Cart quantity controls
- Cart total calculation
- Customer name, mobile और address
- COD order placement
- Order success confirmation
- My Orders
- Admin login
- Admin order list और refresh
- Order accept, delivered और cancel status
- Add new product
- Product image upload और replace
- Product stock display
- Shop information
- Admin logout
- Hindi-English language selection
- AsyncStorage persistence
- Render API और Supabase backend connection

इन सुविधाओं को हटाना, dummy बनाना या केवल UI तक सीमित करना मना है।

8. Testing और final verification

बदलाव के बाद:

1. JavaScript/React Native syntax और imports जाँचो।
2. सभी नए functions और state references जाँचो।
3. Hindi और English दोनों भाषाओं में labels जाँचो।
4. Cart quantity और Admin price controls अलग-अलग जाँचो।
5. Price increase, decrease, direct entry और Save की जाँच करो।
6. Backend API के साथ price persistence जाँचो।
7. Product list refresh करके नई कीमत verify करो।
8. COD order और Admin order status flow जाँचो।
9. Product image upload और existing image replacement जाँचो।
10. उपलब्ध project tests और Expo Android export/build चलाओ।
11. कोई error मिले तो उसे ठीक करके दोबारा test करो।

यदि emulator, real device या production secrets उपलब्ध न हों, तो वास्तविक runtime test सफल होने का झूठा दावा मत करना। कौन-सा test चला और कौन-सा नहीं चला, साफ बताना।

9. Final delivery

- पूरा updated "App.js" सुरक्षित रखना; उसे छोटा करके replace मत करना।
- "server.js" में केवल आवश्यक बदलाव करना।
- सभी पुराने जरूरी files और assets कायम रखना।
- बदलाव अलग branch पर रखना ताकि जरूरत पड़ने पर वापस लौट सकें।
- यदि build workflow पहले से मौजूद है, तो उसी का इस्तेमाल करो; बिना जरूरत दूसरा workflow मत बनाओ।
- एक ही final Android APK build तैयार करो, कई अलग-अलग APK न बनाओ।
- अंतिम रिपोर्ट में बदली हुई files, tests के परिणाम, build status और APK का स्थान बताओ।

अंतिम नियम

पहले निरीक्षण, फिर backup, फिर सीमित बदलाव, फिर testing और अंत में एक final APK।

किसी भी पुराने feature को तोड़कर नया design मत बनाना। RationSetu को उसी मौजूदा app का बेहतर, सुंदर और पूरा working version बनाना है।
