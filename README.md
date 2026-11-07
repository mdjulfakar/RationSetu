# RationSetu – राशन सेतु

Expo React Native Android app starter for the RationSetu shop in Jatwara, Kursakanta, Araria, Bihar.

## Included
- Hindi customer catalog, search, cart and Cash on Delivery order form
- Customer order history on the same device
- Shop admin panel: view orders, update status, add products, edit shop details
- Local persistence with AsyncStorage
- Initial 15 km service-area label

## Run
1. Install Node.js and npm on a computer or cloud development environment.
2. Run `npm install`
3. Run `npx expo start`
4. Use Expo Go for preview, or configure an Android build with EAS.

## Important deployment limitation
This package is a functional local prototype. Data is stored on the device. Customer orders created on a customer's separate phone will NOT automatically appear on the shop owner's phone until a hosted backend/API and authentication are configured. Do not use this as a live multi-customer ordering service yet. The next deliverable should add a secure backend, owner authentication, shared product/order database, and deployment configuration. No Firebase or connected account is used in this package.
