
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://rationsetu-service.onrender.com';
const KEY = 'rationsetu_v1';

const initialProducts = [
  {id: 'p1', name: 'चावल', unit: 'किलो', price: 38, stock: 500},
  {id: 'p2', name: 'गेहूँ', unit: 'किलो', price: 30, stock: 500},
  {id: 'p3', name: 'आटा', unit: 'किलो', price: 36, stock: 200},
  {id: 'p4', name: 'चीनी', unit: 'किलो', price: 45, stock: 100},
  {id: 'p5', name: 'सरसों तेल', unit: 'लीटर', price: 145, stock: 80},
  {id: 'p6', name: 'दाल', unit: 'किलो', price: 110, stock: 100},
];

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
    throw new Error(
      'इंटरनेट कनेक्शन नहीं मिला। कृपया दोबारा कोशिश करें।',
    );
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
  const [cart, setCart] = useState({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [search, setSearch] = useState('');

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Load saved local information and live products.
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
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
      placeholderTextColor="#89948b"
    />
  );

  const header = (
    <View style={styles.header}>
      <Text style={styles.brand}>🛒 RationSetu</Text>
      <Text style={styles.sub}>आपका राशन, आपके घर तक!</Text>
      <Text style={styles.connection}>
        {apiError ? '⚠️ सर्वर कनेक्शन जाँचें' : '🟢 ऑनलाइन सेवा'}
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

  // Send COD order to Render backend.
  async function placeOrder() {
    if (loading) return;

    if (!name.trim()) {
      Alert.alert('जानकारी अधूरी', 'कृपया ग्राहक का नाम भरें।');
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      Alert.alert('मोबाइल नंबर गलत', '10 अंकों का मोबाइल नंबर भरें।');
      return;
    }

    if (!address.trim()) {
      Alert.alert('पता अधूरा', 'पूरा घर का पता भरें।');
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
      Alert.alert('सामान नहीं चुना', 'कम से कम एक सामान चुनें।');
      return;
    }

    const orderTotal = selectedItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0,
    );

    setLoading(true);

    try {
      const result = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: name.trim(),
          mobile: phone.trim(),
          address: address.trim(),
          items: selectedItems,
          total_amount: orderTotal,
        }),
      });

      if (!result.success) {
        throw new Error(result.message || 'ऑर्डर सेव नहीं हुआ।');
      }

      const savedOrder = normalizeOrder(result.order);

      setData(previous => ({
        ...previous,
        orders: [savedOrder, ...previous.orders],
      }));

      setCart({});
      setScreen('success');

      Alert.alert(
        '✅ ऑर्डर सफल!',
        'आपका ऑर्डर दुकान के सर्वर पर सफलतापूर्वक पहुँच गया है।',
      );
    } catch (error) {
      Alert.alert('ऑर्डर नहीं हुआ', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Admin login through backend.
  async function adminLogin() {
    if (!adminId.trim() || !adminPassword.trim()) {
      Alert.alert('जानकारी अधूरी', 'Admin ID और Password भरें।');
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
        throw new Error('Admin login असफल हुआ।');
      }

      setAdminToken(result.token);
      setAdminPassword('');
      await loadAdminOrders(result.token);
      setScreen('admin');

      Alert.alert('✅ सफल', 'Admin Login सफल हो गया।');
    } catch (error) {
      Alert.alert('Admin Login Error', error.message);
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
      Alert.alert('ऑर्डर लोड नहीं हुए', error.message);
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

        Alert.alert('✅ सफल', 'ऑर्डर की स्थिति अपडेट हो गई।');
      }
    } catch (error) {
      Alert.alert('अपडेट असफल', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Add product through backend.
  async function addProduct() {
    if (!newName.trim() || !newPrice.trim() || !newStock.trim()) {
      Alert.alert('जानकारी अधूरी', 'सामान, कीमत और स्टॉक भरें।');
      return;
    }

    const price = Number(newPrice);
    const stock = Number(newStock);

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      Alert.alert('गलत जानकारी', 'कीमत और स्टॉक सही भरें।');
      return;
    }

    setLoading(true);

    try {
      const result = await apiRequest(
        '/api/admin/products',
        {
          method: 'POST',
          body: JSON.stringify({
            name: newName.trim(),
            price,
            stock,
          }),
        },
        adminToken,
      );

      if (!result.success || !result.product) {
        throw new Error('सामान नहीं जुड़ पाया।');
      }

      setData(previous => ({
        ...previous,
        products: [
          ...previous.products,
          normalizeProduct(result.product),
        ],
      }));

      setNewName('');
      setNewPrice('');
      setNewStock('');

      Alert.alert('✅ सफल', 'नया सामान सर्वर पर जुड़ गया।');
    } catch (error) {
      Alert.alert('सामान नहीं जुड़ा', error.message);
    } finally {
      setLoading(false);
    }
  }

  function logoutAdmin() {
    setAdminToken('');
    setAdminId('');
    setScreen('home');
    Alert.alert('सफल', 'Admin Logout हो गया।');
  }

  return (
    <SafeAreaView style={styles.safe}>
      {header}

      <View style={styles.nav}>
        {button('होम', () => setScreen('home'))}
        {button('मेरे ऑर्डर', () => setScreen('myorders'))}
        {button(
          'दुकान एडमिन',
          () => setScreen(adminToken ? 'admin' : 'adminlogin'),
        )}
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#176b3a" />
          <Text style={styles.muted}>कृपया इंतजार करें...</Text>
        </View>
      )}

      {screen === 'home' && (
        <ScrollView style={styles.body}>
          <Text style={styles.title}>राशन और किराना ऑर्डर करें</Text>

          <Text style={styles.muted}>
            सेवा क्षेत्र: जटवारा और आसपास, शुरुआती 15 km
          </Text>

          {field(search, setSearch, 'सामान खोजें')}

          {items.map(product => (
            <View key={product.id} style={styles.row}>
              <View style={{flex: 1}}>
                <Text style={styles.item}>{product.name}</Text>
                <Text style={styles.muted}>
                  {money(product.price)} / {product.unit} · उपलब्ध:{' '}
                  {product.stock}
                </Text>
              </View>

              <View style={styles.qty}>
                {button('−', () => changeQuantity(product.id, -1))}
                <Text style={styles.item}>{cart[product.id] || 0}</Text>
                {button('+', () => changeQuantity(product.id, 1))}
              </View>
            </View>
          ))}

          {items.length === 0 && (
            <Text style={styles.muted}>कोई सामान नहीं मिला।</Text>
          )}

          <Text style={styles.title}>डिलीवरी की जानकारी</Text>

          {field(name, setName, 'ग्राहक का नाम')}
          {field(phone, setPhone, '10 अंकों का मोबाइल नंबर', 'phone-pad')}
          {field(address, setAddress, 'पूरा घर का पता')}

          <View style={styles.total}>
            <Text style={styles.item}>कुल: {money(total)}</Text>
            <Text style={styles.muted}>
              भुगतान: सामान मिलने पर नकद (COD)
            </Text>
          </View>

          {button(
            'COD ऑर्डर भेजें',
            placeOrder,
            true,
            loading,
          )}
        </ScrollView>
      )}

      {screen === 'success' && (
        <View style={styles.body}>
          <Text style={styles.title}>✅ ऑर्डर सफलतापूर्वक भेज दिया गया!</Text>
          <Text style={styles.muted}>
            आपका ऑर्डर ऑनलाइन दुकान के सर्वर पर सेव हो गया है।
          </Text>
          {button('होम पर जाएँ', () => setScreen('home'), true)}
          {button('मेरे ऑर्डर देखें', () => setScreen('myorders'))}
        </View>
      )}

      {screen === 'myorders' && (
        <ScrollView style={styles.body}>
          <Text style={styles.title}>मेरे ऑर्डर</Text>

          {data.orders
            .filter(order => order.phone === phone.trim())
            .map(order => (
              <View style={styles.card} key={order.id}>
                <Text style={styles.item}>
                  {order.id} · {order.status}
                </Text>
                <Text>
                  {order.items.map(item =>
                    `${item.name} × ${item.qty}`,
                  ).join(', ')}
                </Text>
                <Text>{money(order.total)} · {order.payment}</Text>
                <Text style={styles.muted}>{order.createdAt}</Text>
              </View>
            ))}

          {!data.orders.some(order => order.phone === phone.trim()) && (
            <Text style={styles.muted}>
              इस फोन में इस मोबाइल नंबर का कोई ऑर्डर रिकॉर्ड नहीं मिला।
            </Text>
          )}
        </ScrollView>
      )}

      {screen === 'adminlogin' && (
        <ScrollView style={styles.body}>
          <Text style={styles.title}>दुकान एडमिन लॉगिन</Text>

          {field(adminId, setAdminId, 'Admin ID')}
          {field(
            adminPassword,
            setAdminPassword,
            'Admin Password',
            'default',
            true,
          )}

          {button('Admin Login', adminLogin, true, loading)}
        </ScrollView>
      )}

      {screen === 'admin' && (
        <ScrollView style={styles.body}>
          <Text style={styles.title}>दुकान एडमिन पैनल</Text>

          <Text style={styles.muted}>
            कुल ऑर्डर: {data.orders.length}
          </Text>

          {button(
            'ऑर्डर रिफ्रेश करें',
            () => loadAdminOrders(),
          )}

          <Text style={styles.item}>नया सामान जोड़ें</Text>

          {field(newName, setNewName, 'सामान का नाम')}
          {field(newPrice, setNewPrice, 'कीमत ₹', 'numeric')}
          {field(newStock, setNewStock, 'स्टॉक', 'numeric')}

          {button('सामान जोड़ें', addProduct, true, loading)}

          <Text style={styles.title}>सभी ऑनलाइन ऑर्डर</Text>

          {data.orders.length === 0 && (
            <Text style={styles.muted}>अभी कोई ऑर्डर नहीं आया है।</Text>
          )}

          {data.orders.map(order => (
            <View style={styles.card} key={order.id}>
              <Text style={styles.item}>
                {order.id} · {order.customer}
              </Text>

              <Text>{order.phone} · {order.address}</Text>

              <Text>
                {order.items.map(item =>
                  `${item.name} × ${item.qty}`,
                ).join(', ')}
              </Text>

              <Text>
                {money(order.total)} · {order.payment}
              </Text>

              <Text style={styles.muted}>
                स्थिति: {order.status}
              </Text>

              {button('ऑर्डर स्वीकार करें', () =>
                updateOrderStatus(order.id, 'Accepted'),
              )}

              {button('डिलीवरी पूरी', () =>
                updateOrderStatus(order.id, 'Delivered'),
              )}

              {button('ऑर्डर रद्द करें', () =>
                updateOrderStatus(order.id, 'Cancelled'),
              )}
            </View>
          ))}

          <Text style={styles.title}>दुकान की जानकारी</Text>

          {field(
            data.shop.name,
            value => setData(previous => ({
              ...previous,
              shop: {...previous.shop, name: value},
            })),
            'दुकान का नाम',
          )}

          {field(
            data.shop.phone,
            value => setData(previous => ({
              ...previous,
              shop: {...previous.shop, phone: value},
            })),
            'दुकान मोबाइल नंबर',
            'phone-pad',
          )}

          {field(
            data.shop.address,
            value => setData(previous => ({
              ...previous,
              shop: {...previous.shop, address: value},
            })),
            'दुकान का पता',
          )}

          {button('Admin Logout', logoutAdmin)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f7f4',
  },
  header: {
    backgroundColor: '#176b3a',
    padding: 18,
  },
  brand: {
    color: '#fff',
    fontSize: 25,
    fontWeight: 'bold',
  },
  sub: {
    color: '#e6f5e9',
    marginTop: 3,
  },
  connection: {
    color: '#e6f5e9',
    marginTop: 6,
    fontSize: 12,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#e6efe8',
    paddingVertical: 5,
  },
  body: {
    padding: 15,
  },
  loading: {
    padding: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#174b2d',
    marginTop: 15,
    marginBottom: 8,
  },
  muted: {
    color: '#68756c',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
  },
  item: {
    fontSize: 16,
    fontWeight: '600',
    color: '#203528',
  },
  qty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  btn: {
    padding: 10,
    backgroundColor: '#e3e9e4',
    borderRadius: 8,
    margin: 3,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#176b3a',
    padding: 14,
    marginTop: 12,
  },
  btnText: {
    fontWeight: 'bold',
    color: '#174b2d',
  },
  primaryText: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8e0d9',
    borderRadius: 8,
    padding: 12,
    marginVertical: 5,
    color: '#203528',
  },
  total: {
    padding: 14,
    backgroundColor: '#e7f1e8',
    borderRadius: 10,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginVertical: 7,
  },
});
