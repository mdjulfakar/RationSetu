import React, {useEffect,useMemo,useState} from 'react';
import {Alert,FlatList,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY='rationsetu_v1';
const initialProducts=[
{id:'p1',name:'चावल',unit:'किलो',price:38,stock:500},{id:'p2',name:'गेहूँ',unit:'किलो',price:30,stock:500},
{id:'p3',name:'आटा',unit:'किलो',price:36,stock:200},{id:'p4',name:'चीनी',unit:'किलो',price:45,stock:100},
{id:'p5',name:'सरसों तेल',unit:'लीटर',price:145,stock:80},{id:'p6',name:'दाल',unit:'किलो',price:110,stock:100}
];
const money=n=>'₹'+Number(n||0).toFixed(0);
export default function App(){
 const [data,setData]=useState({products:initialProducts,orders:[],shop:{name:'RationSetu – राशन सेतु',phone:'',address:'जटवारा, कुरसाकांटा, अररिया, बिहार'}});
 const [screen,S]=useState('home'),[role,R]=useState('customer'),[cart,C]=useState({}),[name,N]=useState(''),[phone,P]=useState(''),[address,A]=useState(''),[search,Q]=useState(''),[newName,NN]=useState(''),[newPrice,NP]=useState(''),[newStock,NS]=useState('');
 useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{if(v){try{setData(JSON.parse(v))}catch(e){}}})},[]);
 useEffect(()=>{AsyncStorage.setItem(KEY,JSON.stringify(data)).catch(()=>{})},[data]);
 const items=useMemo(()=>data.products.filter(p=>p.name.includes(search)),[data.products,search]);
 const total=Object.entries(cart).reduce((s,[id,q])=>s+(data.products.find(p=>p.id===id)?.price||0)*q,0);
 const btn=(label,on,primary=false)=> <TouchableOpacity onPress={on} style={[styles.btn,primary&&styles.primary]}><Text style={[styles.btnText,primary&&{color:'#fff'}]}>{label}</Text></TouchableOpacity>;
 const field=(value,onChange,placeholder,keyboardType='default')=><TextInput value={value} onChangeText={onChange} placeholder={placeholder} keyboardType={keyboardType} style={styles.input}/>;
 const header=<View style={styles.header}><Text style={styles.brand}>🛒 RationSetu</Text><Text style={styles.sub}>आपका राशन, आपके घर तक!</Text></View>;
 const changeQty=(id,d)=>C(old=>({...old,[id]:Math.max(0,(old[id]||0)+d)}));
 function placeOrder(){
  if(!name.trim()||phone.trim().length!==10||!address.trim()||!Object.values(cart).some(x=>x>0)){Alert.alert('जानकारी अधूरी','नाम, 10 अंकों का मोबाइल, पूरा पता और कम से कम एक सामान चुनें।');return}
  const order={id:'RS'+Date.now(),customer:name,phone,address,items:Object.entries(cart).filter(x=>x[1]>0).map(([id,qty])=>{const p=data.products.find(z=>z.id===id);return {name:p.name,price:p.price,qty,unit:p.unit}}),total,status:'नया ऑर्डर',payment:'Cash on Delivery',createdAt:new Date().toLocaleString('hi-IN')};
  setData(d=>({...d,orders:[order,...d.orders]}));C({});S('success');
 }
 return <SafeAreaView style={styles.safe}>{header}
 <View style={styles.nav}>{btn('होम',()=>S('home'))}{btn('मेरे ऑर्डर',()=>S('myorders'))}{btn('दुकान एडमिन',()=>S('adminlogin'))}</View>
 {screen==='home'&&<ScrollView style={styles.body}><Text style={styles.title}>राशन और किराना ऑर्डर करें</Text><Text style={styles.muted}>सेवा क्षेत्र: जटवारा और आसपास, शुरुआती 15 km</Text>{field(search,Q,'सामान खोजें')}
 {items.map(p=><View key={p.id} style={styles.row}><View style={{flex:1}}><Text style={styles.item}>{p.name}</Text><Text style={styles.muted}>{money(p.price)} / {p.unit} · उपलब्ध: {p.stock}</Text></View><View style={styles.qty}>{btn('−',()=>changeQty(p.id,-1))}<Text style={styles.item}>{cart[p.id]||0}</Text>{btn('+',()=>changeQty(p.id,1))}</View></View>)}
 <Text style={styles.title}>डिलीवरी की जानकारी</Text>{field(name,N,'ग्राहक का नाम')}{field(phone,P,'10 अंकों का मोबाइल नंबर','phone-pad')}{field(address,A,'पूरा घर का पता')}
 <View style={styles.total}><Text style={styles.item}>कुल: {money(total)}</Text><Text style={styles.muted}>भुगतान: सामान मिलने पर नकद (COD)</Text></View>{btn('COD ऑर्डर भेजें',placeOrder,true)}
 <Text style={styles.note}>नोट: यह शुरुआती ऐप संस्करण एक ही फोन में डेटा सेव करता है। दूसरे फोन से ग्राहक ऑर्डर सीधे दुकान तक पहुँचाने के लिए अगली कड़ी में ऑनलाइन सर्वर/API जोड़ना होगा।</Text>
 </ScrollView>}
 {screen==='success'&&<View style={styles.body}><Text style={styles.title}>✅ ऑर्डर सेव हो गया</Text><Text style={styles.muted}>आपका ऑर्डर इस ऐप के ऑर्डर रिकॉर्ड में सेव है।</Text>{btn('होम पर जाएँ',()=>S('home'),true)}</View>}
 {screen==='myorders'&&<ScrollView style={styles.body}><Text style={styles.title}>ऑर्डर रिकॉर्ड</Text>{data.orders.filter(o=>o.phone===phone).map(o=><View style={styles.card} key={o.id}><Text style={styles.item}>{o.id} · {o.status}</Text><Text>{o.items.map(i=>`${i.name} × ${i.qty}`).join(', ')}</Text><Text>{money(o.total)} · {o.payment}</Text></View>)}{!data.orders.some(o=>o.phone===phone)&&<Text style={styles.muted}>इस मोबाइल नंबर से कोई ऑर्डर नहीं मिला।</Text>}</ScrollView>}
 {screen==='adminlogin'&&<View style={styles.body}><Text style={styles.title}>दुकान एडमिन</Text><Text style={styles.muted}>इस शुरुआती संस्करण में एडमिन स्क्रीन इसी ऐप में खुलती है।</Text>{btn('एडमिन पैनल खोलें',()=>S('admin'),true)}</View>}
 {screen==='admin'&&<ScrollView style={styles.body}><Text style={styles.title}>दुकान एडमिन पैनल</Text><Text style={styles.muted}>कुल ऑर्डर: {data.orders.length}</Text><Text style={styles.item}>नया सामान जोड़ें</Text>{field(newName,NN,'सामान का नाम')}{field(newPrice,NP,'कीमत ₹','numeric')}{field(newStock,NS,'स्टॉक','numeric')}{btn('सामान जोड़ें',()=>{if(!newName.trim()||!newPrice||!newStock){Alert.alert('जानकारी भरें');return}setData(d=>({...d,products:[...d.products,{id:'p'+Date.now(),name:newName,unit:'किलो',price:Number(newPrice),stock:Number(newStock)}]}));NN('');NP('');NS('');Alert.alert('सफल','सामान जुड़ गया')},true)}
 <Text style={styles.title}>सभी ऑर्डर</Text>{data.orders.map(o=><View style={styles.card} key={o.id}><Text style={styles.item}>{o.id} · {o.customer}</Text><Text>{o.phone} · {o.address}</Text><Text>{o.items.map(i=>`${i.name} × ${i.qty}`).join(', ')}</Text><Text>{money(o.total)} · {o.payment}</Text><Text>स्थिति: {o.status}</Text>{btn('ऑर्डर स्वीकार करें',()=>setData(d=>({...d,orders:d.orders.map(x=>x.id===o.id?{...x,status:'स्वीकार किया गया'}:x)})))}{btn('डिलीवरी पूरी',()=>setData(d=>({...d,orders:d.orders.map(x=>x.id===o.id?{...x,status:'डिलीवर हो गया'}:x)})))}</View>)}
 <Text style={styles.title}>दुकान की जानकारी</Text>{field(data.shop.name,v=>setData(d=>({...d,shop:{...d.shop,name:v}}),'दुकान का नाम')}{field(data.shop.phone,v=>setData(d=>({...d,shop:{...d.shop,phone:v}}),'दुकान मोबाइल नंबर','phone-pad')}{field(data.shop.address,v=>setData(d=>({...d,shop:{...d.shop,address:v}}),'दुकान का पता')}</ScrollView>}
 </SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#f6f7f4'},header:{backgroundColor:'#176b3a',padding:18},brand:{color:'#fff',fontSize:25,fontWeight:'bold'},sub:{color:'#e6f5e9',marginTop:3},nav:{flexDirection:'row',justifyContent:'space-around',backgroundColor:'#e6efe8',paddingVertical:5},body:{padding:15},title:{fontSize:20,fontWeight:'bold',color:'#174b2d',marginTop:15,marginBottom:8},muted:{color:'#68756c',marginBottom:8},row:{flexDirection:'row',alignItems:'center',padding:12,backgroundColor:'#fff',borderRadius:10,marginBottom:8},item:{fontSize:16,fontWeight:'600',color:'#203528'},qty:{flexDirection:'row',alignItems:'center',gap:7},btn:{padding:10,backgroundColor:'#e3e9e4',borderRadius:8,margin:3,alignItems:'center'},primary:{backgroundColor:'#176b3a',padding:14,marginTop:12},btnText:{fontWeight:'bold',color:'#174b2d'},input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d8e0d9',borderRadius:8,padding:12,marginVertical:5},total:{padding:14,backgroundColor:'#e7f1e8',borderRadius:10,marginTop:12},note:{fontSize:12,color:'#68756c',marginVertical:18},card:{backgroundColor:'#fff',padding:12,borderRadius:10,marginVertical:7}})
