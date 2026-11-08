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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(value => {
        if (value) {
          try {
            const saved = JSON.parse(value);
            setData(saved);
          } catch (error) {
            console.log('Saved data could not be loaded');
          }
        }
      })
      .catch(error => console.log('Storage read error', error));
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(error =>
      console.log('Storage save error', error),
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

  const button = (label, onPress, primary = false) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btn, primary && styles.primary]}>
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
  ) => (
    <TextInput
      value={String(value ?? '')}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      style={styles.input}
      placeholderTextColor="#89948b"
    />
  );

  const header = (
    <View style={styles.header}>
      <Text style={styles.brand}>🛒 RationSetu</Text>
      <Text style={styles.sub}>आपका राशन, आपके घर तक!</Text>
    </View>
  );

  function changeQuantity(id, difference) {
    const product = data.products.find(item => item.id === id);
    if (!product) return;

    setCart(previous => {
      const current = previous[id] || 0;
      const next = Math.max(
        0,
        Math.min(product.stock, current + difference),
      );

      return {...previous, [id]: next};
    });
  }

  function placeOrder() {
    if (!name.trim()) {
      Alert.alert('जानकारी अधूरी', 'कृपया ग्राहक का नाम भरें।');
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      Alert.alert('मोबाइल नंबर गलत', 'कृपया 10 अंकों का मोबाइल नंबर भरें।');
      return;
    }

    if (!address.trim()) {
      Alert.alert('पता अधूरा', 'कृपया पूरा घर का पता भरें।');
      return;
    }

    const selectedItems = Object.entries(cart)
      .filter(([id, quantity]) => {
        return quantity > 0 && data.products.some(p => p.id === id);
      })
      .map(([id, quantity]) => {
        const product = data.products.find(p => p.id === id);
        return {
          name: product.name,
          price: product.price,
          qty: quantity,
          unit: product.unit,
        };
      });

    if (selectedItems.length === 0) {
      Alert.alert('सामान नहीं चुना', 'कृपया कम से कम एक सामान चुनें।');
      return;
    }

    const orderTotal = selectedItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0,
    );

    const order = {
      id: 'RS' + Date.now(),
      customer: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      items: selectedItems,
      total: orderTotal,
      status: 'नया ऑर्डर',
      payment: 'Cash on Delivery',
      createdAt: new Date().toLocaleString('hi-IN'),
    };

    setData(previous => ({
      ...previous,
      orders: [order, ...previous.orders],
    }));

    setCart({});
    setScreen('success');
  }

  function addProduct() {
    if (!newName.trim() || !newPrice.trim() || !newStock.trim()) {
      Alert.alert('जानकारी अधूरी', 'सामान, कीमत और स्टॉक भरें।');
      return;
    }

    const price = Number(newPrice);
    const stock = Number(newStock);

    if (
      !Number.isFinite(price) ||
      !Number.isFinite(stock) ||
      price <= 0 ||
      stock < 0
    ) {
      Alert.alert('गलत जानकारी', 'कीमत और स्टॉक सही संख्या में भरें।');
      return;
    }

    const product = {
      id: 'p' + Date.now(),
      name: newName.trim(),
      unit: 'किलो',
      price,
      stock,
    };

    setData(previous => ({
      ...previous,
      products: [...previous.products, product],
    }));

    setNewName('');
    setNewPrice('');
    setNewStock('');

    Alert.alert('सफल', 'नया सामान जोड़ दिया गया।');
  }

  function updateOrderStatus(orderId, status) {
    setData(previous => ({
      ...previous,
      orders: previous.orders.map(order =>
        order.id === orderId ? {...order, status} : order,
      ),
    }));

    Alert.alert('सफल', 'ऑर्डर की स्थिति अपडेट हो गई।');
  }

  return (
    <SafeAreaView style={styles.safe}>
      {header}

      <View style={styles.nav}>
        {button('होम', () => setScreen('home'))}
        {button('मेरे ऑर्डर', () => setScreen('myorders'))}
        {button('दुकान एडमिन', () => setScreen('adminlogin'))}
      </View>

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

          {button('COD ऑर्डर भेजें', placeOrder, true)}

          <Text style={styles.note}>
            नोट: इस शुरुआती ऐप संस्करण में डेटा इसी फोन में सेव होता है।
            दूसरे फोन से ग्राहक ऑर्डर सीधे दुकान तक पहुँचाने के लिए ऑनलाइन
            सर्वर/API जोड़ना बाकी है।
          </Text>
        </ScrollView>
      )}

      {screen === 'success' && (
        <View style={styles.body}>
          <Text style={styles.title}>✅ ऑर्डर सेव हो गया</Text>
          <Text style={styles.muted}>
            आपका ऑर्डर इस ऐप के रिकॉर्ड में सेव हो गया है।
          </Text>
          {button('होम पर जाएँ', () => setScreen('home'), true)}
          {button('मेरे ऑर्डर देखें', () => setScreen('myorders'))}
        </View>
      )}

      {screen === 'myorders' && (
        <ScrollView style={styles.body}>
          <Text style={styles.title}>ऑर्डर रिकॉर्ड</Text>

          {data.orders
            .filter(order => order.phone === phone.trim())
            .map(order => (
              <View style={styles.card} key={order.id}>
                <Text style={styles.item}>
                  {order.id} · {order.status}
                </Text>
                <Text>
                  {order.items
                    .map(item => `${item.name} × ${item.qty}`)
                    .join(', ')}
                </Text>
                <Text>
                  {money(order.total)} · {order.payment}
                </Text>
                <Text style={styles.muted}>{order.createdAt}</Text>
              </View>
            ))}

          {!data.orders.some(order => order.phone === phone.trim()) && (
            <Text style={styles.muted}>
              इस मोबाइल नंबर से कोई ऑर्डर नहीं मिला। होम स्क्रीन पर वही
              मोबाइल नंबर भरकर फिर यहाँ देखें।
            </Text>
          )}
        </ScrollView>
      )}

      {screen === 'adminlogin' && (
        <View style={styles.body}>
          <Text style={styles.title}>दुकान एडमिन</Text>
          <Text style={styles.muted}>
            यह शुरुआती संस्करण है। अभी एडमिन स्क्रीन पर पासवर्ड सुरक्षा
            नहीं लगी है। लाइव इस्तेमाल से पहले इसे सुरक्षित करना जरूरी है।
          </Text>
          {button('एडमिन पैनल खोलें', () => setScreen('admin'), true)}
        </View>
      )}

      {screen === 'admin' && (
        <ScrollView style={styles.body}>
          <Text style={styles.title}>दुकान एडमिन पैनल</Text>

          <Text style={styles.muted}>
            कुल ऑर्डर: {data.orders.length}
          </Text>

          <Text style={styles.item}>नया सामान जोड़ें</Text>

          {field(newName, setNewName, 'सामान का नाम')}
          {field(newPrice, setNewPrice, 'कीमत ₹', 'numeric')}
          {field(newStock, setNewStock, 'स्टॉक', 'numeric')}

          {button('सामान जोड़ें', addProduct, true)}

          <Text style={styles.title}>सभी ऑर्डर</Text>

          {data.orders.length === 0 && (
            <Text style={styles.muted}>अभी कोई ऑर्डर नहीं आया है।</Text>
          )}

          {data.orders.map(order => (
            <View style={styles.card} key={order.id}>
              <Text style={styles.item}>
                {order.id} · {order.customer}
              </Text>

              <Text>
                {order.phone} · {order.address}
              </Text>

              <Text>
                {order.items
                  .map(item => `${item.name} × ${item.qty}`)
                  .join(', ')}
              </Text>

              <Text>
                {money(order.total)} · {order.payment}
              </Text>

              <Text style={styles.muted}>
                स्थिति: {order.status}
              </Text>

              {button('ऑर्डर स्वीकार करें', () =>
                updateOrderStatus(order.id, 'स्वीकार किया गया'),
              )}

              {button('डिलीवरी पूरी', () =>
                updateOrderStatus(order.id, 'डिलीवर हो गया'),
              )}
            </View>
          ))}

          <Text style={styles.title}>दुकान की जानकारी</Text>

          {field(
            data.shop.name,
            value =>
              setData(previous => ({
                ...previous,
                shop: {...previous.shop, name: value},
              })),
            'दुकान का नाम',
          )}

          {field(
            data.shop.phone,
            value =>
              setData(previous => ({
                ...previous,
                shop: {...previous.shop, phone: value},
              })),
            'दुकान मोबाइल नंबर',
            'phone-pad',
          )}

          {field(
            data.shop.address,
            value =>
              setData(previous => ({
                ...previous,
                shop: {...previous.shop, address: value},
              })),
            'दुकान का पता',
          )}
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
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#e6efe8',
    paddingVertical: 5,
  },
  body: {
    padding: 15,
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
  note: {
    fontSize: 12,
    color: '#68756c',
    marginVertical: 18,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginVertical: 7,
  },
});
