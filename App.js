
```javascript
import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const API_BASE_URL = 'https://rationsetu-service.onrender.com';
const KEY = 'rationsetu_v1';
const LANGUAGE_KEY = 'rationsetu_language';

const initialProducts = [
  {id: 'p1', name: 'चावल', unit: 'किलो', price: 38, stock: 500},
  {id: 'p2', name: 'गेहूँ', unit: 'किलो', price: 30, stock: 500},
  {id: 'p3', name: 'आटा', unit: 'किलो', price: 36, stock: 200},
  {id: 'p4', name: 'चीनी', unit: 'किलो', price: 45, stock: 100},
  {id: 'p5', name: 'सरसों तेल', unit: 'लीटर', price: 145, stock: 80},
  {id: 'p6', name: 'दाल', unit: 'किलो', price: 110, stock: 100},
];

const translations = {
  hi: {
    tagline: 'आपका राशन, आपके घर तक!',
    serverCheck: '⚠️ सर्वर कनेक्शन जाँचें',
    online: '🟢 ऑनलाइन सेवा',
    home: 'होम',
    myOrders: 'मेरे ऑर्डर',
    shopAdmin: 'दुकान एडमिन',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    chooseLanguage: 'अपनी पसंद की भाषा चुनें',
    hindi: 'हिन्दी',
    english: 'English',
    savedLanguage: 'भाषा सेव हो गई।',
    wait: 'कृपया इंतजार करें...',
    orderTitle: 'राशन और किराना ऑर्डर करें',
    serviceArea: 'सेवा क्षेत्र: जटवारा और आसपास, शुरुआती 15 km',
    search: 'सामान खोजें',
    available: 'उपलब्ध',
    noProduct: 'कोई सामान नहीं मिला।',
    deliveryInfo: 'डिलीवरी की जानकारी',
    customerName: 'ग्राहक का नाम',
    mobile: '10 अंकों का मोबाइल नंबर',
    fullAddress: 'पूरा घर का पता',
    total: 'कुल',
    paymentCod: 'भुगतान: सामान मिलने पर नकद (COD)',
    sendOrder: 'COD ऑर्डर भेजें',
    orderSuccess: 'ऑर्डर सफलतापूर्वक भेज दिया गया!',
    orderSaved: 'आपका ऑर्डर ऑनलाइन दुकान के सर्वर पर सेव हो गया है।',
    goHome: 'होम पर जाएँ',
    seeOrders: 'मेरे ऑर्डर देखें',
    noOrderForPhone: 'इस फोन में इस मोबाइल नंबर का कोई ऑर्डर रिकॉर्ड नहीं मिला।',
    adminLogin: 'दुकान एडमिन लॉगिन',
    adminId: 'Admin ID',
    adminPassword: 'Admin Password',
    adminPanel: 'दुकान एडमिन पैनल',
    orderCount: 'कुल ऑर्डर',
    refreshOrders: 'ऑर्डर रिफ्रेश करें',
    addProductTitle: 'नया सामान जोड़ें',
    productName: 'सामान का नाम',
    price: 'कीमत ₹',
    stock: 'स्टॉक',
    addProduct: 'सामान जोड़ें',
    allOrders: 'सभी ऑनलाइन ऑर्डर',
    noOrders: 'अभी कोई ऑर्डर नहीं आया है।',
    status: 'स्थिति',
    accept: 'ऑर्डर स्वीकार करें',
    delivered: 'डिलीवरी पूरी',
    cancel: 'ऑर्डर रद्द करें',
    shopInfo: 'दुकान की जानकारी',
    shopName: 'दुकान का नाम',
    shopPhone: 'दुकान मोबाइल नंबर',
    shopAddress: 'दुकान का पता',
    logout: 'Admin Logout',
    infoIncomplete: 'जानकारी अधूरी',
    fillName: 'कृपया ग्राहक का नाम भरें।',
    wrongMobile: 'मोबाइल नंबर गलत',
    fillMobile: '10 अंकों का मोबाइल नंबर भरें।',
    addressIncomplete: 'पता अधूरा',
    fillAddress: 'पूरा घर का पता भरें।',
    noItem: 'सामान नहीं चुना',
    chooseItem: 'कम से कम एक सामान चुनें।',
    orderNotSaved: 'ऑर्डर सेव नहीं हुआ।',
    orderSuccessTitle: '✅ ऑर्डर सफल!',
    orderServerSuccess: 'आपका ऑर्डर दुकान के सर्वर पर सफलतापूर्वक पहुँच गया है।',
    orderFailed: 'ऑर्डर नहीं हुआ',
    adminInfo: 'Admin ID और Password भरें।',
    adminFailed: 'Admin login असफल हुआ।',
    adminError: 'Admin Login Error',
    success: '✅ सफल',
    adminLoginSuccess: 'Admin Login सफल हो गया।',
    ordersNotLoaded: 'ऑर्डर लोड नहीं हुए',
    orderUpdated: 'ऑर्डर की स्थिति अपडेट हो गई।',
    updateFailed: 'अपडेट असफल',
    productInfo: 'सामान, कीमत और स्टॉक भरें।',
    productImage: 'सामान की फोटो',
    choosePhoto: 'फोन से फोटो चुनें',
    replacePhoto: 'फोटो बदलें',
    uploadFailed: 'फोटो अपलोड नहीं हो पाई।',
    photoUploaded: 'फोटो सेव हो गई।',
    wrongInfo: 'गलत जानकारी',
    priceStockError: 'कीमत और स्टॉक सही भरें।',
    productNotAdded: 'सामान नहीं जुड़ पाया।',
    productAdded: 'नया सामान सर्वर पर जुड़ गया।',
    productAddFailed: 'सामान नहीं जुड़ा',
    logoutSuccess: 'Admin Logout हो गया।',
    internetError: 'इंटरनेट कनेक्शन नहीं मिला। कृपया दोबारा कोशिश करें।',
    serverConnection: 'सर्वर कनेक्शन',
    kilo: 'किलो',
    litre: 'लीटर',
    pending: 'लंबित',
    accepted: 'स्वीकार किया गया',
    deliveredStatus: 'डिलीवर हो गया',
    cancelled: 'रद्द',
    editPriceStock: 'कीमत और स्टॉक बदलें',
    saveChanges: 'बदलाव सेव करें',
    changesSaved: 'कीमत और स्टॉक अपडेट हो गए।',
    changesFailed: 'कीमत और स्टॉक अपडेट नहीं हुए।',
  },
  en: {
    tagline: 'Your groceries, delivered to your home!',
    serverCheck: '⚠️ Check server connection',
    online: '🟢 Online service',
    home: 'Home',
    myOrders: 'My Orders',
    shopAdmin: 'Shop Admin',
    settings: 'Settings',
    language: 'Language',
    chooseLanguage: 'Choose your preferred language',
    hindi: 'हिन्दी',
    english: 'English',
    savedLanguage: 'Language preference saved.',
    wait: 'Please wait...',
    orderTitle: 'Order groceries and essentials',
    serviceArea: 'Service area: Jatwara and nearby, initial 15 km',
    search: 'Search products',
    available: 'Available',
    noProduct: 'No products found.',
    deliveryInfo: 'Delivery Information',
    customerName: 'Customer name',
    mobile: '10-digit mobile number',
    fullAddress: 'Full home address',
    total: 'Total',
    paymentCod: 'Payment: Cash on Delivery (COD)',
    sendOrder: 'Place COD Order',
    orderSuccess: 'Order placed successfully!',
    orderSaved: 'Your order has been saved on the online shop server.',
    goHome: 'Go to Home',
    seeOrders: 'View My Orders',
    noOrderForPhone: 'No order record found for this mobile number on this phone.',
    adminLogin: 'Shop Admin Login',
    adminId: 'Admin ID',
    adminPassword: 'Admin Password',
    adminPanel: 'Shop Admin Panel',
    orderCount: 'Total orders',
    refreshOrders: 'Refresh Orders',
    addProductTitle: 'Add New Product',
    productName: 'Product name',
    price: 'Price ₹',
    stock: 'Stock',
    addProduct: 'Add Product',
    allOrders: 'All Online Orders',
    noOrders: 'No orders have arrived yet.',
    status: 'Status',
    accept: 'Accept Order',
    delivered: 'Mark Delivered',
    cancel: 'Cancel Order',
    shopInfo: 'Shop Information',
    shopName: 'Shop name',
    shopPhone: 'Shop mobile number',
    shopAddress: 'Shop address',
    logout: 'Admin Logout',
    infoIncomplete: 'Missing information',
    fillName: 'Please enter the customer name.',
    wrongMobile: 'Invalid mobile number',
    fillMobile: 'Enter a 10-digit mobile number.',
    addressIncomplete: 'Address incomplete',
    fillAddress: 'Enter the complete home address.',
    noItem: 'No product selected',
    chooseItem: 'Please select at least one product.',
    orderNotSaved: 'Order could not be saved.',
    orderSuccessTitle: '✅ Order successful!',
    orderServerSuccess: 'Your order has reached the shop server successfully.',
    orderFailed: 'Order failed',
    adminInfo: 'Enter Admin ID and Password.',
    adminFailed: 'Admin login failed.',
    adminError: 'Admin Login Error',
    success: '✅ Success',
    adminLoginSuccess: 'Admin login successful.',
    ordersNotLoaded: 'Could not load orders',
    orderUpdated: 'Order status updated.',
    updateFailed: 'Update failed',
    productInfo: 'Enter product name, price and stock.',
    productImage: 'Product photo',
    choosePhoto: 'Choose photo from phone',
    replacePhoto: 'Change photo',
    uploadFailed: 'Photo upload failed.',
    photoUploaded: 'Photo saved.',
    wrongInfo: 'Invalid information',
    priceStockError: 'Enter a valid price and stock.',
    productNotAdded: 'Product could not be added.',
    productAdded: 'New product added to the server.',
    productAddFailed: 'Could not add product',
    logoutSuccess: 'Admin logged out.',
    internetError: 'No internet connection. Please try again.',
    serverConnection: 'Server connection',
    kilo: 'kg',
    litre: 'litre',
    pending: 'Pending',
    accepted: 'Accepted',
    deliveredStatus: 'Delivered',
    cancelled: 'Cancelled',
    editPriceStock: 'Edit Price and Stock',
    saveChanges: 'Save Changes',
    changesSaved: 'Price and stock updated successfully.',
    changesFailed: 'Price and stock could not be updated.',
  },
};

const productTranslations = {
  'चावल': 'Rice',
  'गेहूँ': 'Wheat',
  'आटा': 'Wheat flour',
  'चीनी': 'Sugar',
  'सरसों तेल': 'Mustard oil',
  'दाल': 'Lentils',
};

const money = value => '₹' + Number(value || 0).toFixed(0);

async function apiRequest(path, options = {}, token = '') {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    throw new Error('इंटरनेट कनेक्शन नहीं मिला। कृपया दोबारा कोशिश करें।');
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || result.error || `Server Error ${response.status}`,
    );
  }

  return result;
}

function normalizeProduct(product) {
  return {
    ...product,
    id: String(product.id),
    name: product.name || '',
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    unit: product.unit || product.unit_name || 'किलो',
  };
}

function normalizeOrder(order) {
  return {
    ...order,
    id: String(order.id),
    customer: order.customer_name || order.customer || '',
    phone: order.mobile || order.phone || '',
    address: order.address || '',
    total: Number(order.total_amount ?? order.total ?? 0),
    status: order.status || 'Pending',
    payment: order.payment_method || order.payment || 'COD',
    items: Array.isArray(order.items) ? order.items : [],
    createdAt: order.created_at || order.createdAt || '',
  };
}

export default function App() {
  const [data, setData] = useState({
    products: initialProducts,
    orders: [],
    shop: {
      name: 'RationSetu – राशन सेतु',
      phone: '',
      address: 'जटवारा, कुरसाकांटा, अररिया, बिहार',
    },
  });

  const [screen, setScreen] = useState('home');
  const [language, setLanguage] = useState('hi');
  const t = key => translations[language]?.[key] || translations.hi[key] || key;

  const [cart, setCart] = useState({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [search, setSearch] = useState('');

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState('');
  const [editingProducts, setEditingProducts] = useState({});

  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Load saved local information, language preference and live products.
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (active && (savedLanguage === 'hi' || savedLanguage === 'en')) {
          setLanguage(savedLanguage);
        }

        const saved = await AsyncStorage.getItem(KEY);

        if (saved && active) {
          const parsed = JSON.parse(saved);
          setData(previous => ({
            ...previous,
            ...parsed,
            products: previous.products,
          }));
        }
      } catch (error) {
        console.log('Local storage read error:', error);
      }

      try {
        const result = await apiRequest('/api/products');

        if (active && result.success && Array.isArray(result.products)) {
          setData(previous => ({
            ...previous,
            products: result.products.map(normalizeProduct),
          }));
          setApiError('');
        }
      } catch (error) {
        if (active) {
          setApiError(error.message);
          Alert.alert('सर्वर कनेक्शन', error.message);
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  // Save local order history and shop information.
  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(error =>
      console.log('Storage save error:', error),
    );
  }, [data]);

  // Save selected language separately so existing saved app data stays unchanged.
  useEffect(() => {
    AsyncStorage.setItem(LANGUAGE_KEY, language).catch(error =>
      console.log('Language save error:', error),
    );
  }, [language]);

  const items = useMemo(
    () =>
      data.products.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [data.products, search],
  );

  const total = Object.entries(cart).reduce((sum, [id, quantity]) => {
    const product = data.products.find(item => item.id === id);
    return sum + (product ? product.price * quantity : 0);
  }, 0);

  const productLabel = product => {
    if (language === 'en') {
      return productTranslations[product.name] || product.name;
    }
    return product.name;
  };

  const unitLabel = unit => {
    if (language === 'en') {
      if (unit === 'किलो' || unit === 'kg') return t('kilo');
      if (unit === 'लीटर' || unit === 'litre' || unit === 'liter') return t('litre');
    }
    return unit;
  };

  const statusLabel = status => {
    if (language === 'en') {
      if (status === 'Pending') return t('pending');
      if (status === 'Accepted') return t('accepted');
      if (status === 'Delivered') return t('deliveredStatus');
      if (status === 'Cancelled') return t('cancelled');
    }
    return status;
  };

  const button = (label, onPress, primary = false, disabled = false) => (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.btn,
        primary && styles.primary,
        disabled && {opacity: 0.5},
      ]}>
      <Text style={[styles.btnText, primary && styles.primaryText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const field = (
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    secureTextEntry = false,
  ) => (
    <TextInput
      value={String(value ?? '')}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      style={styles.input}
      placeholderTextColor="#8193a5"
    />
  );

  const header = (
    <View style={styles.header}>
      <Text style={styles.brand}>🛒 RationSetu</Text>
      <Text style={styles.sub}>{t('tagline')}</Text>
      <Text style={styles.connection}>
        {apiError ? t('serverCheck') : t('online')}
      </Text>
    </View>
  );

  function changeQuantity(id, difference) {
    const product = data.products.find(item => item.id === id);
    if (!product) return;

    setCart(previous => {
      const current = previous[id] || 0;
      const next = Math.max(0, Math.min(product.stock, current + difference));
      return {...previous, [id]: next};
    });
  }

  // Get the customer's current GPS coordinates for delivery-radius validation.
  async function getCustomerLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      throw new Error(
        language === 'en'
          ? 'Location permission is required to place an order.'
          : 'ऑर्डर करने के लिए लोकेशन की अनुमति देना जरूरी है।',
      );
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      customer_lat: position.coords.latitude,
      customer_lng: position.coords.longitude,
    };
  }

  // Send COD order to Render backend.
  async function placeOrder() {
    if (loading) return;

    if (!name.trim()) {
      Alert.alert(t('infoIncomplete'), t('fillName'));
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      Alert.alert(t('wrongMobile'), t('fillMobile'));
      return;
    }

    if (!address.trim()) {
      Alert.alert(t('addressIncomplete'), t('fillAddress'));
      return;
    }

    const selectedItems = Object.entries(cart)
      .filter(([id, quantity]) =>
        quantity > 0 && data.products.some(p => p.id === id),
      )
      .map(([id, quantity]) => {
        const product = data.products.find(p => p.id === id);
        return {
          name: product.name,
          price: product.price,
          qty: quantity,
          unit: product.unit,
        };
      });

    if (!selectedItems.length) {
      Alert.alert(t('noItem'), t('chooseItem'));
      return;
    }

    const orderTotal = selectedItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0,
    );

    setLoading(true);

    try {
      const customerLocation = await getCustomerLocation();

      const result = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: name.trim(),
          mobile: phone.trim(),
          address: address.trim(),
          items: selectedItems,
          total_amount: orderTotal,
          customer_lat: customerLocation.customer_lat,
          customer_lng: customerLocation.customer_lng,
        }),
      });

      if (!result.success) {
        throw new Error(result.message || t('orderNotSaved'));
      }

      const savedOrder = normalizeOrder(result.order);

      setData(previous => ({
        ...previous,
        orders: [savedOrder, ...previous.orders],
      }));

      setCart({});
      setScreen('success');

      Alert.alert(
        t('orderSuccessTitle'),
        t('orderServerSuccess'),
      );
    } catch (error) {
      Alert.alert(t('orderFailed'), error.message);
    } finally {
      setLoading(false);
    }
  }

  // Admin login through backend.
  async function adminLogin() {
    if (!adminId.trim() || !adminPassword.trim()) {
      Alert.alert(t('infoIncomplete'), t('adminInfo'));
      return;
    }

    setLoading(true);

    try {
      const result = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          admin_id: adminId.trim(),
          password: adminPassword,
        }),
      });

      if (!result.success || !result.token) {
        throw new Error(t('adminFailed'));
      }

      setAdminToken(result.token);
      setAdminPassword('');
      await loadAdminOrders(result.token);
      setScreen('admin');

      Alert.alert(t('success'), t('adminLoginSuccess'));
    } catch (error) {
      Alert.alert(t('adminError'), error.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch all orders from backend.
  async function loadAdminOrders(token = adminToken) {
    if (!token) return;

    try {
      const result = await apiRequest('/api/admin/orders', {}, token);

      if (result.success && Array.isArray(result.orders)) {
        setData(previous => ({
          ...previous,
          orders: result.orders.map(normalizeOrder),
        }));
      }
    } catch (error) {
      Alert.alert(t('ordersNotLoaded'), error.message);
    }
  }

  // Update order status on server.
  async function updateOrderStatus(orderId, status) {
    if (loading) return;

    setLoading(true);

    try {
      const result = await apiRequest(
        `/api/admin/orders/${encodeURIComponent(orderId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({status}),
        },
        adminToken,
      );

      if (result.success) {
        setData(previous => ({
          ...previous,
          orders: previous.orders.map(order =>
            order.id === orderId
              ? {...order, status: result.order?.status || status}
              : order,
          ),
        }));

        Alert.alert(t('success'), t('orderUpdated'));
      }
    } catch (error) {
      Alert.alert(t('updateFailed'), error.message);
    } finally {
      setLoading(false);
    }
  }

  // Choose a product photo from the phone gallery.
  async function chooseProductImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t('productImage'),
          language === 'en'
            ? 'Allow photo-library access to choose a product image.'
            : 'सामान की फोटो चुनने के लिए गैलरी की अनुमति दें।',
        );
        return null;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (picked.canceled || !picked.assets?.length) return null;
      return picked.assets[0];
    } catch (error) {
      Alert.alert(t('productImage'), error.message || t('uploadFailed'));
      return null;
    }
  }

  async function selectNewProductImage() {
    const photo = await chooseProductImage();
    if (photo) setNewImage(photo);
  }

  // Upload selected image through the protected backend endpoint.
  async function uploadProductImage(photo) {
    if (!photo?.uri) throw new Error(t('uploadFailed'));

    const form = new FormData();
