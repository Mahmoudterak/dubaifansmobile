import DigitalSystemsSection from './src/components/DigitalSystemsSection';





import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
  Image,
  Linking,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import {
  AuthUser,
  AppNotification,
  Order,
  createOrder,
  createPayment,
  getPayment,
  getMe,
  getOrders,
  getOrder,
  getOrderHistory,
  submitOrderRevision,
  OrderHistoryItem,
  getPaymentHistory,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  getServices,
  login,
  googleLogin,
  register,
  resetPassword,
  updateProfile,
  forgotPassword
} from './src/api/client';
import {
  removeToken,
  getToken,
  saveToken,
} from './src/api/auth-storage';

type Package = {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  unit?: string;
  quantity?: number;
  slug?: string;
};

type Service = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type?: string;
  pricingType?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
  packages?: Package[];
};

type Tab = 'home' | 'services' | 'orders' | 'campaigns' | 'account' | 'notifications';

const RED = '#E31B23';
const DARK = '#111827';


const MUTED = '#6B7280';
const BG = '#F6F7F9';
const BORDER = '#E5E7EB';
const WHITE = '#FFFFFF';

const SERVICE_IMAGES: Record<string, any> = {
  advertising: require('./assets/home-services/03_إدارة_الحملات_الإعلانية.jpg'),
  followers: require('./assets/home-services/06_نمو_المبيعات_والنتائج.jpg'),
  website: require('./assets/home-services/02_التسويق_والاستراتيجية.jpg'),
  ecommerce: require('./assets/home-services/04_إنشاء_المتجر_الإلكتروني.jpg'),
  'seo-google': require('./assets/home-services/06_نمو_المبيعات_والنتائج.jpg'),
  'social-media': require('./assets/home-services/05_إدارة_وسائل_التواصل_الاجتماعي.webp'),
  photography: require('./assets/home-services/01_خدمات_التصوير_والفيديو.webp'),
  custom: require('./assets/home-services/02_التسويق_والاستراتيجية.jpg'),
};

function money(value: string | number | undefined) {
  const n = Number(value || 0);
  return `${n.toLocaleString('en-US')} AED`;
}

function serviceTitle(service?: Service) {
  if (!service) return 'Service';
  const names: Record<string, string> = {
    advertising: 'إدارة الحملات الإعلانية',
    followers: 'زيادة المتابعين',
    'views-likes': 'المشاهدات والإعجابات',
    website: 'إنشاء موقع إلكتروني',
    ecommerce: 'إنشاء متجر إلكتروني',
    'seo-google': 'SEO & Google',
    'social-media': 'إدارة وسائل التواصل',
    photography: 'التصوير وصناعة المحتوى',
    custom: 'خدمة مخصصة',
  };
  return names[service.slug] || service.name;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: 'بانتظار الدفع',
    PAID: 'تم الدفع',
    UNDER_REVIEW: 'قيد المراجعة',
    IN_PROGRESS: 'قيد التنفيذ',
    WAITING_FOR_CUSTOMER: 'بانتظارك',
    REVISION: 'يحتاج تعديل',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغي',
    REFUNDED: 'مسترد',
  };
  return labels[status] || status;
}

GoogleSignin.configure({
  webClientId:
    '177641611395-3p2pi9vti88gfj86v8pinot0ha9u3so2.apps.googleusercontent.com',
  iosClientId:
    '177641611395-i8780kopnsl9rcfbe4rj6k2da816tvcm.apps.googleusercontent.com',
});


function AnimatedSplashScreen({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1.03)).current;
  const shine = useRef(new Animated.Value(-1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1.08,
        duration: 2500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(shine, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        { iterations: 2 },
      ),
      Animated.timing(progress, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]);

    animation.start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2500);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [onFinish, opacity, scale, shine, progress]);

  const shineTranslate = shine.interpolate({
    inputRange: [-1, 1],
    outputRange: [-500, 500],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.splashScreen}>
      <StatusBar hidden />
      <Animated.View
        style={[
          styles.splashImageContainer,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Image
          source={require('./assets/splash-screen.jpeg')}
          style={styles.splashImage}
          resizeMode="cover"
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.splashShine,
            {
              transform: [
                { translateX: shineTranslate },
                { rotate: '18deg' },
              ],
            },
          ]}
        />
      </Animated.View>

      <View style={styles.splashProgressTrack}>
        <Animated.View
          style={[
            styles.splashProgress,
            { width: progressWidth },
          ]}
        />
      </View>
    </View>
  );
}

function App() {
  const [initializing, setInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(null);

  useEffect(() => {
    restore();
  }, []);

  useEffect(() => {
    if (!token) return;

    loadUnreadNotificationCount(token);

    const timer = setInterval(() => {
      loadUnreadNotificationCount(token);
    }, 10000);

    return () => clearInterval(timer);
  }, [token]);

  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url) return;

      try {
        const match = url.match(/[?&]token=([^&]+)/);
        const token = match ? decodeURIComponent(match[1]) : null;

        if (
          token &&
          (url.startsWith('dubaifans://reset-password') ||
            url.startsWith('https://mtuaefans.com/reset-password'))
        ) {
          setResetPasswordToken(token);
        }
      } catch {
        // Ignore malformed deep links.
      }
    };

    Linking.getInitialURL().then(handleDeepLink);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  async function restore() {
    try {
      const [serviceData, savedToken] = await Promise.all([
        getServices<Service[]>(),
        getToken(),
      ]);

      setServices(
        (serviceData || []).filter((item) => item.isActive !== false),
      );

      if (savedToken) {
        try {
          const currentUser = await getMe(savedToken);
          setToken(savedToken);
          setUser(currentUser);
          await loadOrders(savedToken);
          await loadUnreadNotificationCount(savedToken);
        } catch {
          await removeToken();
        }
      }
    } catch (error) {
      Alert.alert(
        'تعذر الاتصال',
        error instanceof Error
          ? error.message
          : 'تعذر تحميل بيانات التطبيق.',
      );
    } finally {
      setInitializing(false);
    }
  }

  async function loadOrders(currentToken = token) {
    if (!currentToken) return;

    try {
      const data = await getOrders(currentToken);
      setOrders(data || []);
    } catch {
      setOrders([]);
    }
  }

  async function loadUnreadNotificationCount(currentToken = token) {
    if (!currentToken) return;

    try {
      const data = await getUnreadNotificationCount(currentToken);
      setUnreadNotificationCount(Number(data?.count || 0));
    } catch {
      setUnreadNotificationCount(0);
    }
  }

  async function handleLogin(email: string, password: string) {
    try {
      const result = await login(email.trim(), password);
      await saveToken(result.accessToken);

      setToken(result.accessToken);
      setUser(result.user);

      await loadOrders(result.accessToken);
      await loadUnreadNotificationCount(result.accessToken);
    } catch (error) {
      Alert.alert(
        'تسجيل الدخول',
        error instanceof Error ? error.message : 'تعذر تسجيل الدخول.',
      );
    }
  }

  async function handleGoogleLogin(idToken: string) {
    try {
      const result = await googleLogin(idToken);
      await saveToken(result.accessToken);

      setToken(result.accessToken);
      setUser(result.user);

      await loadOrders(result.accessToken);
    } catch (error) {
      Alert.alert(
        'تسجيل الدخول باستخدام Google',
        error instanceof Error
          ? error.message
          : 'تعذر تسجيل الدخول باستخدام Google.',
      );
    }
  }

  async function handleRegister(
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) {
    try {
      const result = await register(
        name.trim(),
        email.trim(),
        password,
        phone?.trim() || undefined,
      );

      await saveToken(result.accessToken);

      setToken(result.accessToken);
      setUser(result.user);

      await loadOrders(result.accessToken);
    } catch (error) {
      Alert.alert(
        'إنشاء الحساب',
        error instanceof Error ? error.message : 'تعذر إنشاء الحساب.',
      );
      throw error;
    }
  }

  async function handleLogout() {
    await removeToken();
    setToken(null);
    setUser(null);
    setOrders([]);
    setUnreadNotificationCount(0);
    setActiveTab('home');
  }

  async function handleProfileSave(payload: Parameters<typeof updateProfile>[1]) {
    if (!token) return;

    setSavingProfile(true);

    try {
      const updated = await updateProfile(token, payload);
      setUser(updated);
      setProfileVisible(false);

      Alert.alert('تم الحفظ', 'تم تحديث بيانات الحساب بنجاح.');
    } catch (error) {
      Alert.alert(
        'تعذر الحفظ',
        error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ.',
      );
    } finally {
      setSavingProfile(false);
    }
  }

  const popularServices = useMemo(() => {
    const preferred = [
      'advertising',
      'followers',
      'website',
      'ecommerce',
      'seo-google',
    ];

    return preferred
      .map((slug) => services.find((item) => item.slug === slug))
      .filter(Boolean) as Service[];
  }, [services]);

  if (showSplash) {
    return (
      <AnimatedSplashScreen
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  if (initializing) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingScreen}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>DF</Text>
          </View>
          <Text style={styles.loadingTitle}>Dubai Fans</Text>
          <ActivityIndicator size="small" color={RED} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (resetPasswordToken) {
    return (
      <ResetPasswordScreen
        token={resetPasswordToken}
        onSuccess={() => setResetPasswordToken(null)}
      />
    );
  }

  if (!user || !token) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <LoginScreen
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          onRegister={handleRegister}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.app}>
        {activeTab === 'home' && (
          <HomeScreen
            user={user}
            token={token}
            services={services}
            popularServices={popularServices}
            onServicePress={setSelectedService}
            onOrders={() => setActiveTab('orders')}
            onServices={() => setActiveTab('services')}
            onAccount={() => setActiveTab('account')}
            onNotifications={() => setActiveTab('notifications')}
            unreadNotificationCount={unreadNotificationCount}
          />
        )}

        {activeTab === 'services' && (
          <ServicesScreen
            services={services}
            onServicePress={setSelectedService}
          />
        )}

        {activeTab === 'orders' && !selectedOrder && (
          <OrdersScreen
            orders={orders}
            onRefresh={() => loadOrders()}
            onSelectOrder={setSelectedOrder}
          />
        )}

        {activeTab === 'orders' && selectedOrder && (
          <OrderDetailsScreen
            order={selectedOrder}
            token={token}
            onBack={() => setSelectedOrder(null)}
          />
        )}

        {activeTab === 'campaigns' && (
          <CampaignsScreen orders={orders} />
        )}

        {activeTab === 'account' && (
          <AccountScreen
            user={user}
            token={token}
            onEdit={() => setProfileVisible(true)}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsScreen
            token={token}
            onBack={() => setActiveTab('home')}
            onUnreadCountChange={setUnreadNotificationCount}
          />
        )}

        <BottomNavigation
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <ServiceModal
          visible={!!selectedService}
          service={selectedService}
          token={token}
          onClose={() => setSelectedService(null)}
          onCreated={async () => {
            setSelectedService(null);
            await loadOrders();
            setActiveTab('orders');
          }}
        />

        <ProfileModal
          visible={profileVisible}
          user={user}
          saving={savingProfile}
          onClose={() => setProfileVisible(false)}
          onSave={handleProfileSave}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

/* =========================
   LOGIN
========================= */

function ResetPasswordScreen({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (password.length < 8) {
      Alert.alert('كلمة المرور', 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('كلمة المرور', 'كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      Alert.alert(
        'تم تغيير كلمة المرور',
        'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.',
        [{ text: 'تسجيل الدخول', onPress: onSuccess }],
      );
    } catch (error) {
      Alert.alert(
        'تعذر إعادة تعيين كلمة المرور',
        error instanceof Error
          ? error.message
          : 'الرابط غير صالح أو انتهت صلاحيته.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.authScreen}>
        <KeyboardAvoidingView
          style={styles.authKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.authContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>DF</Text>
            </View>

            <Text style={styles.authTitle}>إعادة تعيين كلمة المرور</Text>
            <Text style={styles.authSubtitle}>
              أدخل كلمة المرور الجديدة لحسابك في Dubai Fans
            </Text>

            <View style={styles.authForm}>
              <Text style={styles.authLabel}>كلمة المرور الجديدة</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="8 أحرف على الأقل"
                placeholderTextColor={MUTED}
                secureTextEntry
                style={styles.authInput}
                textAlign="right"
                autoCapitalize="none"
              />

              <Text style={styles.authLabel}>تأكيد كلمة المرور</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="أعد كتابة كلمة المرور"
                placeholderTextColor={MUTED}
                secureTextEntry
                style={styles.authInput}
                textAlign="right"
                autoCapitalize="none"
              />

              <Pressable
                style={[styles.authButton, loading && styles.disabledButton]}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.authButtonText}>
                    حفظ كلمة المرور الجديدة
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function LoginScreen({
  onLogin,
  onGoogleLogin,
  onRegister,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: (idToken: string) => Promise<void>;
  onRegister: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<void>;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGooglePress() {
    if (loading) return;

    setLoading(true);

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (response.type !== 'success') {
        return;
      }

      const idToken = response.data.idToken;

      if (!idToken) {
        throw new Error('لم يتم استلام رمز Google.');
      }

      await onGoogleLogin(idToken);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('cancel')
      ) {
        return;
      }

      Alert.alert(
        'تسجيل الدخول باستخدام Google',
        error instanceof Error
          ? error.message
          : 'تعذر تسجيل الدخول باستخدام Google.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (mode === 'login') {
      if (!email.trim() || !password) {
        Alert.alert('تنبيه', 'أدخل البريد الإلكتروني وكلمة المرور.');
        return;
      }

      setLoading(true);

      try {
        await onLogin(email, password);
      } finally {
        setLoading(false);
      }

      return;
    }

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert(
        'تنبيه',
        'أدخل الاسم والبريد الإلكتروني وكلمة المرور وتأكيد كلمة المرور.',
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert('تنبيه', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('تنبيه', 'كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);

    try {
      await onRegister(name, email, password, phone);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.loginScreen}>
      <ScrollView
        contentContainerStyle={styles.loginContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginLogo}>
          <Text style={styles.loginLogoText}>DF</Text>
        </View>

        <Text style={styles.loginBrand}>Dubai Fans</Text>
        <Text style={styles.loginSubtitle}>
          شريكك للنمو الرقمي والتسويق
        </Text>

        <View style={styles.loginCard}>
          <Text style={styles.sectionTitle}>
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </Text>

          {mode === 'register' && (
            <>
              <Text style={styles.fieldLabel}>الاسم</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="الاسم الكامل"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>رقم الهاتف</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+971 5X XXX XXXX"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </>
          )}

          <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>كلمة المرور</Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            style={styles.input}
          />

          {mode === 'register' && (
            <>
              <Text style={styles.fieldLabel}>تأكيد كلمة المرور</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={styles.input}
              />
            </>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
              </Text>
            )}
          </Pressable>

          {mode === 'login' && (
            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.pressed,
              ]}
              onPress={handleGooglePress}
              disabled={loading}
            >
              <Text style={styles.googleButtonIcon}>G</Text>
              <Text style={styles.googleButtonText}>
                المتابعة باستخدام Google
              </Text>
            </Pressable>
          )}

          {mode === 'login' && (
            <Pressable
              style={styles.authSecondaryButton}
              onPress={async () => {
                const value = email.trim();

                if (!value) {
                  Alert.alert(
                    'نسيت كلمة المرور',
                    'اكتب بريدك الإلكتروني أولاً، ثم اضغط على نسيت كلمة المرور.',
                  );
                  return;
                }

                try {
                  setLoading(true);
                  await forgotPassword(value);
                  Alert.alert(
                    'تم إرسال الطلب',
                    'إذا كان البريد مرتبطاً بحساب، ستصلك رسالة تحتوي على رابط استعادة كلمة المرور.',
                  );
                } catch {
                  Alert.alert(
                    'تعذر تنفيذ الطلب',
                    'حدث خطأ أثناء إرسال طلب استعادة كلمة المرور. حاول مرة أخرى.',
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={styles.authSecondaryText}>نسيت كلمة المرور؟</Text>
            </Pressable>
          )}

          <View style={styles.authSwitchRow}>
            <Text style={styles.authSwitchLabel}>
              {mode === 'login'
                ? 'ليس لديك حساب؟'
                : 'لديك حساب بالفعل؟'}
            </Text>

            <Pressable
              onPress={() =>
                setMode(mode === 'login' ? 'register' : 'login')
              }
            >
              <Text style={styles.authSwitchAction}>
                {mode === 'login' ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================
   HOME
========================= */

function AnimatedMarketingVisual({
  onPress,
}: {
  onPress: () => void;
}) {
  const slides = [
    require('./assets/home-hero-1.png'),
    require('./assets/home-hero-2.png'),
    require('./assets/home-hero-3.jpeg'),
  ];

  const [index, setIndex] = useState(0);
  const heroWidth = Math.max(0, Dimensions.get('window').width - 40);
  const heroScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => {
        const nextIndex = (current + 1) % slides.length;

        heroScrollRef.current?.scrollTo({
          x: nextIndex * Dimensions.get('window').width,
          animated: true,
        });

        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <View style={styles.heroSection}>
      <ScrollView
        ref={heroScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        directionalLockEnabled
        decelerationRate="fast"
        contentContainerStyle={styles.heroScrollContent}
        onMomentumScrollEnd={(event) => {
          const pageWidth = event.nativeEvent.layoutMeasurement.width;

          if (pageWidth > 0) {
            const nextIndex = Math.max(
              0,
              Math.min(
                slides.length - 1,
                Math.round(
                  event.nativeEvent.contentOffset.x / pageWidth,
                ),
              ),
            );

            setIndex(nextIndex);
          }
        }}
      >
        {slides.map((slide, slideIndex) => {
          const asset = Image.resolveAssetSource(slide);
          const sourceWidth = asset?.width || 1022;
          const sourceHeight = asset?.height || 388;
          const imageHeight =
            heroWidth * (sourceHeight / sourceWidth);

          return (
            <View
              key={slideIndex}
              style={[
                styles.heroSlide,
                { width: Dimensions.get('window').width },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.heroImagePressable,
                  { width: heroWidth },
                  pressed && styles.pressed,
                ]}
                onPress={onPress}
              >
                <Image
                  source={slide}
                  style={{
                    width: heroWidth,
                    height: imageHeight,
                  }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      {slides.length > 1 && (
        <View style={styles.heroIndicators}>
          {slides.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[
                styles.heroIndicator,
                dotIndex === index && styles.heroIndicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const HOME_INFO_IMAGES = [
  require('./assets/home-info/Home Screen - معرض الصور/01_أفضل_أوقات_النشر_على_السوشيال_ميديا.jpg'),
  require('./assets/home-info/Home Screen - معرض الصور/02_ChatGPT_vs_Google_2026.webp'),
  require('./assets/home-info/Home Screen - معرض الصور/03_PPC_vs_SEO.webp'),
  require('./assets/home-info/Home Screen - معرض الصور/04_Google_AI_Overview_SEO_Dubai.jpg'),
  require('./assets/home-info/Home Screen - معرض الصور/05_UAE_Social_Media_Trends_2026.webp'),
];

const WORK_TEMPLATE_IMAGES = [
  require('./assets/work-templates/accessories.jpg'),
  require('./assets/work-templates/accountant.jpg'),
  require('./assets/work-templates/aka-uae-website.jpg'),
  require('./assets/work-templates/alnashmi-perfumes-store.jpg'),
  require('./assets/work-templates/aqarlines-website.jpg'),
  require('./assets/work-templates/campaign-education-results.jpg'),
  require('./assets/work-templates/campaign-medical-results.jpg'),
  require('./assets/work-templates/corporate.jpg'),
  require('./assets/work-templates/digital.jpg'),
  require('./assets/work-templates/doctor.jpg'),
  require('./assets/work-templates/fashion.webp'),
  require('./assets/work-templates/lawyer.webp'),
  require('./assets/work-templates/medical-centers-campaigns.webp'),
  require('./assets/work-templates/multi.jpg'),
  require('./assets/work-templates/perfume.webp'),
  require('./assets/work-templates/real-estate.webp'),
  require('./assets/work-templates/shoes.webp'),
];

function HomeScreen({
  user,
  token,
  services,
  popularServices,
  onServicePress,
  onOrders,
  onServices,
  onAccount,
  onNotifications,
  unreadNotificationCount,
}: {
  user: AuthUser;
  token: string;
  services: Service[];
  popularServices: Service[];
  onServicePress: (service: Service) => void;
  onOrders: () => void;
  onServices: () => void;
  onAccount: () => void;
  onNotifications: () => void;
  unreadNotificationCount: number;
}) {
  const [homeInfoIndex, setHomeInfoIndex] = useState(0);
  const [workIndex, setWorkIndex] = useState(0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderBrand}>
          <Image
            source={require('./assets/dubai_fans_logo.png')}
            style={styles.homeHeaderLogo}
            resizeMode="contain"
          />

          <View style={styles.homeHeaderBrandText}>
            <Text style={styles.homeHeaderTitle}>DUBAI FANS</Text>
            <Text style={styles.homeHeaderSubtitle}>
              MARKETING SERVICES
            </Text>
          </View>
        </View>

        <View style={styles.homeHeaderActions}>
          <Pressable
            style={({ pressed }) => [
              styles.homeHeaderAction,
              pressed && styles.pressed,
            ]}
            onPress={onNotifications}
          >
            <View style={{ position: 'relative' }}>
              <Text style={styles.homeHeaderActionIcon}>🔔</Text>

              {unreadNotificationCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -7,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    borderRadius: 9,
                    backgroundColor: RED,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: WHITE,
                  }}
                >
                  <Text
                    style={{
                      color: WHITE,
                      fontSize: 9,
                      fontWeight: '900',
                      lineHeight: 12,
                    }}
                  >
                    {unreadNotificationCount > 99
                      ? '99+'
                      : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.homeHeaderAction,
              pressed && styles.pressed,
            ]}
            onPress={onAccount}
          >
            <Text style={styles.homeHeaderActionIcon}>👤</Text>
          </Pressable>
        </View>
      </View>

      <AnimatedMarketingVisual
        onPress={() => {
          const campaignService = services.find(
            (service) => service.slug === 'advertising',
          );

          if (campaignService) {
            onServicePress(campaignService);
          }
        }}
      />

      <View style={styles.whyCampaignCompact}>
        <Text style={styles.whyCampaignEyebrowCompact}>
          DUBAI FANS
        </Text>

        <Text style={styles.whyCampaignTitleCompact}>
          لماذا دبي فانز؟
        </Text>

        <Text style={styles.whyCampaignSubtitleCompact}>
          أطلق إعلانك بنفسك ... ابتداءً من 80 درهم لليوم 🚀
        </Text>

        <View style={styles.campaignStepsRow}>
          <View style={styles.campaignStepCompact}>
            <View style={styles.campaignStepTop}>
              <View style={styles.campaignStepNumber}>
                <Text style={styles.campaignStepNumberText}>1</Text>
              </View>
              <Text style={styles.campaignStepIconCompact}>📲</Text>
            </View>

            <Text style={styles.campaignStepTitleCompact}>
              ارفع محتواك
            </Text>

            <Text style={styles.campaignStepTextCompact}>
              صورة أو فيديو
              {'\n'}
              وأدخل بيانات مشروعك
            </Text>
          </View>

          <View style={styles.campaignStepDivider} />

          <View style={styles.campaignStepCompact}>
            <View style={styles.campaignStepTop}>
              <View style={styles.campaignStepNumber}>
                <Text style={styles.campaignStepNumberText}>2</Text>
              </View>
              <Text style={styles.campaignStepIconCompact}>🎯</Text>
            </View>

            <Text style={styles.campaignStepTitleCompact}>
              حدد هدفك
            </Text>

            <Text style={styles.campaignStepTextCompact}>
              اختر المنصة، المدة
              {'\n'}
              والميزانية ورقم الواتساب
            </Text>
          </View>

          <View style={styles.campaignStepDivider} />

          <View style={styles.campaignStepCompact}>
            <View style={styles.campaignStepTop}>
              <View style={styles.campaignStepNumber}>
                <Text style={styles.campaignStepNumberText}>3</Text>
              </View>
              <Text style={styles.campaignStepIconCompact}>📊</Text>
            </View>

            <Text style={styles.campaignStepTitleCompact}>
              تابع النتائج
            </Text>

            <Text style={styles.campaignStepTextCompact}>
              أرسل حملتك وتابع حالتها
              {'\n'}
              ونتائجها مباشرة
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.startCampaignButtonCompact,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            const campaignService = services.find(
              (service) => service.slug === 'advertising',
            );

            if (campaignService) {
              onServicePress(campaignService);
            }
          }}
        >
          <Text style={styles.startCampaignButtonTextCompact}>
            ابدأ حملتك الآن 🚀
          </Text>
        </Pressable>
      </View>

      <View style={styles.popularServicesHeader}>
        <Text style={styles.popularServicesTitle}>
          الخدمات الأكثر طلبًا
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.horizontalServices}
      >
        {popularServices.map((service) => (
          <ServiceImageCard
            key={service.id}
            service={service}
            onPress={() => onServicePress(service)}
          />
        ))}
      </ScrollView>

      <View style={styles.homeInfoSection}>
        <SectionHeader title="معلومات تهم مشروعك" />

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          style={styles.homeInfoCarousel}
          contentContainerStyle={styles.homeInfoCarouselContent}
          onMomentumScrollEnd={(event) => {
            const width = event.nativeEvent.layoutMeasurement.width;
            if (width > 0) {
              setHomeInfoIndex(
                Math.round(event.nativeEvent.contentOffset.x / width)
              );
            }
          }}
        >
          {HOME_INFO_IMAGES.map((image, index) => {
            const asset = Image.resolveAssetSource(image);
            const sourceWidth = asset?.width || 1;
            const sourceHeight = asset?.height || 1;
            const slideWidth = Math.max(
              1,
              Dimensions.get('window').width - 40
            );
            const imageHeight =
              slideWidth * (sourceHeight / sourceWidth);

            return (
              <View
                key={index}
                style={[
                  styles.homeInfoSlide,
                  {
                    width: slideWidth,
                    height: imageHeight,
                  },
                ]}
              >
                <Image
                  source={image}
                  style={{
                    width: slideWidth,
                    height: imageHeight,
                  }}
                  resizeMode="contain"
                />
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.carouselDots}>
          {HOME_INFO_IMAGES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.carouselDot,
                index === homeInfoIndex && styles.carouselDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.homeServicesSection}>
        <View style={styles.homeServicesHeader}>
          <Text style={styles.homeServicesTitle}>تصفح الخدمات</Text>

          <Pressable
            style={styles.homeServicesSeeAll}
            onPress={onServices}
          >
            <Text style={styles.homeServicesSeeAllText}>عرض الكل</Text>
          </Pressable>
        </View>

        <Text style={styles.homeServicesSubtitle}>
          كل خدمات التسويق التي يحتاجها مشروعك في مكان واحد.
        </Text>

        <View style={styles.homeServicesGrid}>
          {services
            .filter((service) => service.slug !== 'clinic-os')
            .map((service) => (
              <ServiceGridCard
                key={service.id}
                service={service}
                onPress={() => onServicePress(service)}
                compact
              />
            ))}
        </View>
      </View>

      <DigitalSystemsSection
        serviceId={
          services.find(
            (service) => service.slug === 'clinic-os'
          )?.id
        }
        token={token}
        onCreated={async () => { onOrders(); }}
      />

      <View style={styles.clientsSection}>
        <SectionHeader title="شركائنا" />

        <Text style={styles.clientsSubtitle}>
          أكثر من 1,000 مشروع في الإمارات ودول الخليج
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={true}
          decelerationRate="fast"
          snapToInterval={86}
          snapToAlignment="start"
          contentContainerStyle={styles.clientsHorizontal}
        >
          <View style={styles.clientLogoCard}>
            <Image
              source={require('./assets/clients/client-geidea.png')}
              style={styles.clientLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.clientLogoCard}>
            <Image
              source={require('./assets/clients/client-herman.png')}
              style={styles.clientLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.clientLogoCard}>
            <Image
              source={require('./assets/clients/client-logo5.png')}
              style={styles.clientLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.clientLogoCard}>
            <Image
              source={require('./assets/clients/client-malabar.png')}
              style={styles.clientLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.clientLogoCard}>
            <Image
              source={require('./assets/clients/client-moneygram.png')}
              style={styles.clientLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.clientLogoCard}>
            <Image
              source={require('./assets/clients/client-sadia.png')}
              style={styles.clientLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.clientLogoCard}>
            <Image
              source={require('./assets/clients/client-saha.png')}
              style={styles.clientLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.clientLogoCard}>
            <Image
              source={require('./assets/clients/client-space42.png')}
              style={styles.clientLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.clientLogoCard}>
            <Image
              source={require('./assets/clients/client-tabby.png')}
              style={styles.clientLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.clientLogoCard}>
            <Image
              source={require('./assets/clients/client-takamol.png')}
              style={styles.clientLogo}
              resizeMode="contain"
            />
          </View>
        </ScrollView>

        <View style={styles.clientsDots}>
          {Array.from({ length: 2 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.clientsDot,
                index === 0 && styles.clientsDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function WhyCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: string;
}) {
  return (
    <View style={styles.whyCard}>
      <View style={styles.whyIcon}>
        <Text style={styles.whyIconText}>{icon}</Text>
      </View>

      <View style={styles.whyCardContent}>
        <Text style={styles.whyCardTitle}>{title}</Text>
        <Text style={styles.whyCardText}>{children}</Text>
      </View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function ServiceImageCard({
  service,
  onPress,
  compact = false,
}: {
  service: Service;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.popularCard,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.serviceImage}>
        <Image
          source={SERVICE_IMAGES[service.slug] || SERVICE_IMAGES.custom}
          style={styles.serviceImagePhoto}
          resizeMode="cover"
        />
        <View style={styles.serviceImageOverlay}>
          <Text style={styles.serviceImageBadge}>دبي فانز</Text>
        </View>
      </View>

      <Text style={styles.popularTitle} numberOfLines={2}>
        {serviceTitle(service)}
      </Text>

      <Text style={styles.popularPrice}>
        {service.packages?.length
          ? `من ${money(service.packages[0].price)}`
          : 'اطلب عرض سعر'}
      </Text>
    </Pressable>
  );
}

function ServiceGridCard({
  service,
  onPress,
  compact = false,
}: {
  service: Service;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        compact ? styles.homeGridCard : styles.gridCard,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={compact ? styles.homeGridIcon : styles.gridIcon}>
        <Text style={styles.gridIconText}>
          {service.icon === 'megaphone'
            ? '📣'
            : service.icon === 'users'
              ? '👥'
              : service.icon === 'eye'
                ? '👁'
                : service.icon === 'globe'
                  ? '🌐'
                  : service.icon === 'shopping-cart'
                    ? '🛒'
                    : service.icon === 'search'
                      ? '🔎'
                      : service.icon === 'camera'
                        ? '📸'
                        : '✦'}
        </Text>
      </View>

      <Text
        style={compact ? styles.homeGridTitle : styles.gridTitle}
        numberOfLines={2}
      >
        {serviceTitle(service)}
      </Text>

      {!compact && (
        <Text style={styles.gridDescription} numberOfLines={2}>
          {service.description || 'خدمة احترافية من Dubai Fans'}
        </Text>
      )}
    </Pressable>
  );
}

/* =========================
   SERVICES
========================= */

function ServicesScreen({
  services,
  onServicePress,
}: {
  services: Service[];
  onServicePress: (service: Service) => void;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle
        title="الخدمات"
        subtitle="كل خدمات التسويق التي يحتاجها مشروعك في مكان واحد"
      />

      <View style={styles.servicesGrid}>
        {services.map((service) => (
          <ServiceGridCard
            key={service.id}
            service={service}
            onPress={() => onServicePress(service)}
          />
        ))}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

/* =========================
   ORDERS
========================= */

function OrdersScreen({
  orders,
  onRefresh,
  onSelectOrder,
}: {
  orders: Order[];
  onRefresh: () => Promise<void>;
  onSelectOrder: (order: Order) => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle
        title="طلباتي"
        subtitle="تابع حالة جميع طلباتك من مكان واحد"
      />

      <Pressable
        style={styles.refreshButton}
        onPress={refresh}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator color={RED} size="small" />
        ) : (
          <Text style={styles.refreshText}>↻ تحديث الطلبات</Text>
        )}
      </Pressable>

      {orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="لا توجد طلبات بعد"
          text="ابدأ باختيار إحدى خدمات Dubai Fans."
        />
      ) : (
        orders.map((order) => (
          <Pressable
            key={order.id}
            style={styles.orderCard}
            onPress={() => onSelectOrder(order)}
          >
            <View style={styles.orderTop}>
              <View>
                <Text style={styles.orderNumber}>
                  #{order.orderNo}
                </Text>
                <Text style={styles.orderService}>
                  {order.service?.name || 'خدمة'}
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {statusLabel(order.status)}
                </Text>
              </View>
            </View>

            <View style={styles.orderDivider} />

            <View style={styles.orderBottom}>
              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString('ar-AE')}
              </Text>
              <Text style={styles.orderTotal}>
                {money(order.total)}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

/* =========================
   ORDER DETAILS
========================= */

function OrderDetailsScreen({
  order,
  token,
  onBack,
}: {
  order: Order;
  token: string;
  onBack: () => void;
}) {
  const [details, setDetails] = useState<Order | null>(order);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDetails() {
      try {
        setLoading(true);
        setError(null);

        const [orderData, historyData] = await Promise.all([
          getOrder(token, order.orderNo),
          getOrderHistory(token, order.orderNo),
        ]);

        if (!mounted) return;

        setDetails(orderData);
        setHistory(historyData || []);
      } catch (error) {
        if (!mounted) return;

        setError(
          error instanceof Error
            ? error.message
            : 'تعذر تحميل تفاصيل الطلب.',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      mounted = false;
    };
  }, [order.orderNo, token]);

  const currentOrder = details || order;
  const revisionHistory = history
    .filter((item) => item.status === 'REVISION')
    .slice(-1)[0];

  const [revisionResponse, setRevisionResponse] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  async function handleSubmitRevision() {
    const response = revisionResponse.trim();

    if (!response) {
      Alert.alert(
        'الرد مطلوب',
        'اكتب التعديل أو المعلومات المطلوبة قبل الإرسال.',
      );
      return;
    }

    try {
      setSubmittingRevision(true);

      const updatedOrder = await submitOrderRevision(
        token,
        currentOrder.orderNo,
        response,
        currentOrder.formData || undefined,
      );

      const updatedHistory = await getOrderHistory(
        token,
        currentOrder.orderNo,
      );

      setDetails(updatedOrder);
      setHistory(updatedHistory || []);
      setRevisionResponse('');

      Alert.alert(
        'تم الإرسال',
        'تم إرسال ردك بنجاح، وسيتم مراجعة الطلب.',
      );
    } catch (error) {
      Alert.alert(
        'تعذر الإرسال',
        error instanceof Error
          ? error.message
          : 'تعذر إرسال التعديل.',
      );
    } finally {
      setSubmittingRevision(false);
    }
  }

  function renderFormData() {
    const data = currentOrder.formData;

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return (
      <View style={styles.orderDetailsSection}>
        <Text style={styles.orderDetailsSectionTitle}>
          بيانات الطلب
        </Text>

        {Object.entries(data).map(([key, value]) => (
          <View key={key} style={styles.orderDetailsRow}>
            <Text style={styles.orderDetailsValue}>
              {typeof value === 'object' && value !== null
                ? JSON.stringify(value)
                : String(value ?? '—')}
            </Text>
            <Text style={styles.orderDetailsLabel}>
              {key}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={styles.orderDetailsBackButton}
        onPress={onBack}
      >
        <Text style={styles.orderDetailsBackText}>
          العودة إلى الطلبات
        </Text>
      </Pressable>

      <ScreenTitle
        title="تفاصيل الطلب"
        subtitle={`#${currentOrder.orderNo}`}
      />

      {loading ? (
        <View style={styles.orderDetailsLoading}>
          <ActivityIndicator color={RED} />
          <Text style={styles.orderDetailsLoadingText}>
            جاري تحميل تفاصيل الطلب...
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.orderDetailsError}>
          <Text style={styles.orderDetailsErrorText}>
            {error}
          </Text>
        </View>
      ) : null}

      <View style={styles.orderDetailsCard}>
        <View style={styles.orderTop}>
          <View>
            <Text style={styles.orderNumber}>
              #{currentOrder.orderNo}
            </Text>
            <Text style={styles.orderService}>
              {currentOrder.service?.name || 'خدمة'}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {statusLabel(currentOrder.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDivider} />

        <View style={styles.orderDetailsRow}>
          <Text style={styles.orderDetailsValue}>
            {new Date(currentOrder.createdAt).toLocaleDateString('ar-AE')}
          </Text>
          <Text style={styles.orderDetailsLabel}>
            تاريخ الطلب
          </Text>
        </View>

        <View style={styles.orderDetailsRow}>
          <Text style={styles.orderDetailsValue}>
            {currentOrder.quantity ?? '—'}
          </Text>
          <Text style={styles.orderDetailsLabel}>
            الكمية
          </Text>
        </View>

        <View style={styles.orderDetailsRow}>
          <Text style={styles.orderDetailsValue}>
            {money(currentOrder.unitPrice)}
          </Text>
          <Text style={styles.orderDetailsLabel}>
            سعر الوحدة
          </Text>
        </View>

        <View style={styles.orderDetailsRow}>
          <Text style={styles.orderDetailsValue}>
            {money(currentOrder.subtotal)}
          </Text>
          <Text style={styles.orderDetailsLabel}>
            المجموع الفرعي
          </Text>
        </View>

        <View style={styles.orderDetailsRow}>
          <Text style={styles.orderDetailsValue}>
            {money(currentOrder.vat)}
          </Text>
          <Text style={styles.orderDetailsLabel}>
            الضريبة
          </Text>
        </View>

        <View style={styles.orderDetailsTotalRow}>
          <Text style={styles.orderDetailsTotal}>
            {money(currentOrder.total)}
          </Text>
          <Text style={styles.orderDetailsTotalLabel}>
            الإجمالي
          </Text>
        </View>
      </View>

      {currentOrder.status === 'REVISION' ? (
        <View style={styles.orderRevisionSection}>
          <Text style={styles.orderDetailsSectionTitle}>
            يحتاج تعديل
          </Text>

          <Text style={styles.orderRevisionDescription}>
            يرجى مراجعة ملاحظة فريق Dubai Fans وإرسال المعلومات أو التعديل المطلوب.
          </Text>

          {revisionHistory?.note ? (
            <View style={styles.orderRevisionNoteBox}>
              <Text style={styles.orderRevisionNoteLabel}>
                ملاحظة فريق العمل
              </Text>
              <Text style={styles.orderRevisionNote}>
                {revisionHistory.note}
              </Text>
            </View>
          ) : null}

          <TextInput
            value={revisionResponse}
            onChangeText={setRevisionResponse}
            placeholder="اكتب ردك أو المعلومات المطلوبة هنا..."
            placeholderTextColor={MUTED}
            multiline
            textAlign="right"
            textAlignVertical="top"
            editable={!submittingRevision}
            style={styles.orderRevisionInput}
          />

          <Pressable
            style={[
              styles.orderRevisionButton,
              submittingRevision && styles.orderRevisionButtonDisabled,
            ]}
            onPress={handleSubmitRevision}
            disabled={submittingRevision}
          >
            {submittingRevision ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <Text style={styles.orderRevisionButtonText}>
                إرسال التعديل
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {currentOrder.customerNote ? (
        <View style={styles.orderDetailsSection}>
          <Text style={styles.orderDetailsSectionTitle}>
            ملاحظتك
          </Text>
          <Text style={styles.orderDetailsNote}>
            {currentOrder.customerNote}
          </Text>
        </View>
      ) : null}

      {renderFormData()}

      <View style={styles.orderDetailsSection}>
        <Text style={styles.orderDetailsSectionTitle}>
          سجل الطلب
        </Text>

        {history.length === 0 ? (
          <Text style={styles.orderDetailsEmptyHistory}>
            لا يوجد سجل حالات لهذا الطلب.
          </Text>
        ) : (
          history.map((item) => (
            <View
              key={item.id}
              style={styles.orderHistoryItem}
            >
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {statusLabel(item.status)}
                </Text>
              </View>

              <Text style={styles.orderHistoryDate}>
                {new Date(item.createdAt).toLocaleString('ar-AE')}
              </Text>

              {item.note ? (
                <Text style={styles.orderHistoryNote}>
                  {item.note}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

/* =========================
   CAMPAIGNS
========================= */

function CampaignsScreen({ orders }: { orders: Order[] }) {
  const campaigns = orders.filter(
    (order) => order.service?.slug === 'advertising',
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
    >
      <ScreenTitle
        title="الحملات"
        subtitle="متابعة طلبات إدارة الحملات الإعلانية"
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon="📣"
          title="لا توجد حملات"
          text="ستظهر النتائج هنا عندنا تكمل إعلانك الأول"
        />
      ) : (
        campaigns.map((campaign) => {
          const data = campaign.campaignData;

          return (
            <View key={campaign.id} style={styles.orderCard}>
              <View style={styles.orderTop}>
                <View>
                  <Text style={styles.orderNumber}>
                    #{campaign.orderNo}
                  </Text>
                  <Text style={styles.orderService}>
                    إدارة حملة إعلانية
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {statusLabel(campaign.status)}
                  </Text>
                </View>
              </View>

              {campaign.status === 'IN_PROGRESS' && data ? (
                <View style={{ marginTop: 16 }}>
                  {!!data.campaignName && (
                    <Text style={styles.campaignHint}>
                      اسم الحملة: {String(data.campaignName)}
                    </Text>
                  )}

                  {!!data.platform && (
                    <Text style={styles.campaignHint}>
                      المنصة: {String(data.platform)}
                    </Text>
                  )}

                  {!!data.campaignUrl && (
                    <Text style={styles.campaignHint}>
                      رابط الحملة: {String(data.campaignUrl)}
                    </Text>
                  )}

                  {data.budget !== undefined && data.budget !== null && (
                    <Text style={styles.campaignHint}>
                      الميزانية: {String(data.budget)} AED
                    </Text>
                  )}

                  {!!data.startDate && (
                    <Text style={styles.campaignHint}>
                      تاريخ البداية: {String(data.startDate)}
                    </Text>
                  )}

                  {!!data.endDate && (
                    <Text style={styles.campaignHint}>
                      تاريخ النهاية: {String(data.endDate)}
                    </Text>
                  )}

                  {!!data.result && (
                    <Text style={styles.campaignHint}>
                      النتيجة: {String(data.result)}
                    </Text>
                  )}

                  {!!data.notes && (
                    <Text style={styles.campaignHint}>
                      ملاحظات فريق التنفيذ: {String(data.notes)}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.campaignHint}>
                  {campaign.status === 'REVISION'
                    ? 'يوجد تعديل مطلوب على هذه الحملة. افتح تفاصيل الطلب لمعرفة المطلوب وإرسال التعديل.'
                    : 'لم تتم إضافة نتائج الحملة بعد.'}
                </Text>
              )}
            </View>
          );
        })
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

/* =========================
   NOTIFICATIONS
========================= */

function NotificationsScreen({
  token,
  onBack,
  onUnreadCountChange,
}: {
  token: string;
  onBack: () => void;
  onUnreadCountChange: (count: number) => void;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setError(null);

      const [notificationData, unreadData] = await Promise.all([
        getNotifications(token),
        getUnreadNotificationCount(token),
      ]);

      setNotifications(notificationData || []);
      onUnreadCountChange(Number(unreadData?.count || 0));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'تعذر تحميل الإشعارات.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [token]);

  const handleNotificationPress = async (
    notification: AppNotification,
  ) => {
    if (notification.isRead || readingId) return;

    try {
      setReadingId(notification.id);

      const updated = await markNotificationAsRead(
        token,
        notification.id,
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: updated.isRead }
            : item,
        ),
      );

      const unread = notifications.filter(
        (item) => !item.isRead && item.id !== notification.id,
      ).length;

      onUnreadCountChange(unread);
    } catch (error) {
      Alert.alert(
        'تعذر تحديث الإشعار',
        error instanceof Error
          ? error.message
          : 'تعذر تسجيل الإشعار كمقروء.',
      );
    } finally {
      setReadingId(null);
    }
  };

  const notificationIcon = (status?: string | null) => {
    switch (status) {
      case 'PAID':
        return '💳';
      case 'PENDING_PAYMENT':
        return '💰';
      case 'UNDER_REVIEW':
        return '🔎';
      case 'IN_PROGRESS':
        return '⚙️';
      case 'WAITING_FOR_CUSTOMER':
        return '💬';
      case 'REVISION':
        return '✏️';
      case 'COMPLETED':
        return '✅';
      case 'CANCELLED':
        return '❌';
      case 'REFUNDED':
        return '↩️';
      default:
        return '🔔';
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('ar-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BG,
        paddingHorizontal: 20,
        paddingTop: 24,
      }}
    >
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 22,
        }}
      >
        <Text
          style={{
            color: DARK,
            fontSize: 24,
            fontWeight: '900',
            textAlign: 'right',
          }}
        >
          الإشعارات
        </Text>

        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            {
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: WHITE,
              borderWidth: 1,
              borderColor: BORDER,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            style={{
              color: RED,
              fontSize: 14,
              fontWeight: '800',
            }}
          >
            الرئيسية
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View
          style={{
            backgroundColor: WHITE,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: BORDER,
            padding: 24,
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="small" color={RED} />

          <Text
            style={{
              color: MUTED,
              fontSize: 13,
              fontWeight: '700',
              marginTop: 10,
            }}
          >
            جاري تحميل الإشعارات...
          </Text>
        </View>
      ) : error ? (
        <View
          style={{
            backgroundColor: WHITE,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: BORDER,
            padding: 20,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 34, marginBottom: 10 }}>⚠️</Text>

          <Text
            style={{
              color: DARK,
              fontSize: 17,
              fontWeight: '900',
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            تعذر تحميل الإشعارات
          </Text>

          <Text
            style={{
              color: MUTED,
              fontSize: 13,
              lineHeight: 21,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {error}
          </Text>

          <Pressable
            onPress={() => {
              setLoading(true);
              loadNotifications();
            }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: RED,
            }}
          >
            <Text
              style={{
                color: WHITE,
                fontSize: 13,
                fontWeight: '900',
              }}
            >
              إعادة المحاولة
            </Text>
          </Pressable>
        </View>
      ) : notifications.length === 0 ? (
        <View
          style={{
            backgroundColor: WHITE,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: BORDER,
            padding: 20,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 34, marginBottom: 10 }}>🔔</Text>

          <Text
            style={{
              color: DARK,
              fontSize: 18,
              fontWeight: '900',
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            لا توجد إشعارات جديدة
          </Text>

          <Text
            style={{
              color: MUTED,
              fontSize: 13,
              lineHeight: 21,
              textAlign: 'center',
            }}
          >
            ستظهر هنا تحديثات طلباتك وحملاتك عند توفرها.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {notifications.map((notification) => {
            const unread = !notification.isRead;

            return (
              <Pressable
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                disabled={!unread || readingId === notification.id}
                style={({ pressed }) => [
                  {
                    backgroundColor: WHITE,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: unread ? '#FECACA' : BORDER,
                    padding: 16,
                    marginBottom: 12,
                    opacity:
                      readingId === notification.id ? 0.6 : 1,
                  },
                  pressed && unread && { opacity: 0.75 },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    alignItems: 'flex-start',
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: unread ? '#FEF2F2' : '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 12,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>
                      {notificationIcon(notification.status)}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          color: DARK,
                          fontSize: 15,
                          fontWeight: unread ? '900' : '800',
                          textAlign: 'right',
                        }}
                      >
                        {notification.title}
                      </Text>

                      {unread && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: RED,
                            marginRight: 8,
                          }}
                        />
                      )}
                    </View>

                    <Text
                      style={{
                        color: MUTED,
                        fontSize: 13,
                        lineHeight: 20,
                        textAlign: 'right',
                        marginTop: 5,
                      }}
                    >
                      {notification.message}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 9,
                      }}
                    >
                      {notification.order?.orderNo ? (
                        <Text
                          style={{
                            color: RED,
                            fontSize: 11,
                            fontWeight: '800',
                          }}
                        >
                          #{notification.order.orderNo}
                        </Text>
                      ) : (
                        <View />
                      )}

                      <Text
                        style={{
                          color: '#9CA3AF',
                          fontSize: 10,
                          fontWeight: '600',
                        }}
                      >
                        {formatDate(notification.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

/* =========================
   ACCOUNT
========================= */

function AccountScreen({
  user,
  token,
  onEdit,
  onLogout,
}: {
  user: AuthUser;
  token: string;
  onEdit: () => void;
  onLogout: () => void;
}) {
  const [payments, setPayments] = useState<Awaited<ReturnType<typeof getPaymentHistory>>>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [paymentsExpanded, setPaymentsExpanded] = useState(false);

  const displayedPayments = paymentsExpanded
    ? payments
    : payments.slice(0, 1);

  const loadPaymentHistory = async () => {
    try {
      setPaymentsError(null);
      const data = await getPaymentHistory(token);
      setPayments(data);
    } catch (error) {
      setPaymentsError(
        error instanceof Error ? error.message : "تعذر تحميل سجل المدفوعات"
      );
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentHistory();
  }, [token]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
    >
      <ScreenTitle
        title="حسابي"
        subtitle="إدارة بياناتك وبيانات نشاطك التجاري"
      />

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {(user.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.profileMain}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>

        <Pressable style={styles.editSmallButton} onPress={onEdit}>
          <Text style={styles.editSmallText}>تعديل</Text>
        </Pressable>
      </View>

      <Text style={styles.accountSectionTitle}>البيانات الشخصية</Text>

      <InfoRow label="الاسم" value={user.name} />
      <InfoRow label="البريد الإلكتروني" value={user.email} />
      <InfoRow label="رقم الهاتف" value={user.phone} />

      <Text style={styles.accountSectionTitle}>بيانات النشاط التجاري</Text>

      <InfoRow label="اسم الشركة" value={user.businessName} />
      <InfoRow label="نوع النشاط" value={user.businessType} />
      <InfoRow label="الموقع الإلكتروني" value={user.websiteUrl} />
      <InfoRow label="Instagram" value={user.instagramUrl} />
      <InfoRow label="Facebook" value={user.facebookUrl} />
      <InfoRow label="TikTok" value={user.tiktokUrl} />
      <InfoRow label="Snapchat" value={user.snapchatUrl} />
      <InfoRow label="Google Business" value={user.googleBusinessUrl} />

      <Text style={styles.accountSectionTitle}>سجل المدفوعات</Text>

      <View style={styles.paymentHistoryCard}>
        <Pressable
          style={styles.paymentHistoryHeader}
          onPress={() => {
            if (payments.length > 1) {
              setPaymentsExpanded((current) => !current);
            }
          }}
          disabled={payments.length <= 1}
        >
          <View>
            <Text style={styles.paymentHistoryTitle}>المدفوعات</Text>
            <Text style={styles.paymentHistorySubtitle}>
              {paymentsExpanded
                ? 'جميع عمليات الدفع الخاصة بطلباتك'
                : 'آخر عملية دفع'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.paymentCountBadge}>
              <Text style={styles.paymentCountText}>{payments.length}</Text>
            </View>

            {payments.length > 1 ? (
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '900',
                  color: MUTED,
                  lineHeight: 20,
                }}
              >
                {paymentsExpanded ? '⌃' : '⌄'}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {paymentsLoading ? (
          <View style={styles.paymentLoading}>
            <ActivityIndicator size="small" color={RED} />
            <Text style={styles.paymentLoadingText}>جاري تحميل السجل...</Text>
          </View>
        ) : paymentsError ? (
          <View style={styles.paymentEmptyState}>
            <Text style={styles.paymentEmptyIcon}>!</Text>
            <Text style={styles.paymentEmptyTitle}>تعذر تحميل السجل</Text>
            <Pressable
              style={styles.paymentRetryButton}
              onPress={loadPaymentHistory}
            >
              <Text style={styles.paymentRetryText}>إعادة المحاولة</Text>
            </Pressable>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.paymentEmptyState}>
            <Text style={styles.paymentEmptyIcon}>₿</Text>
            <Text style={styles.paymentEmptyTitle}>لا توجد مدفوعات بعد</Text>
            <Text style={styles.paymentEmptyText}>
              ستظهر عمليات الدفع هنا بعد إنشاء طلب مدفوع.
            </Text>
          </View>
        ) : (
          displayedPayments.map((payment) => {
            const statusMap: Record<string, { label: string; color: string; bg: string }> = {
              COMPLETED: { label: "تم الدفع", color: "#15803D", bg: "#DCFCE7" },
              REQUIRES_ACTION: { label: "بانتظار إتمام الدفع", color: "#B45309", bg: "#FEF3C7" },
              PENDING: { label: "قيد المعالجة", color: "#B45309", bg: "#FEF3C7" },
              FAILED: { label: "فشل الدفع", color: "#B91C1C", bg: "#FEE2E2" },
              CANCELED: { label: "ملغي", color: "#6B7280", bg: "#F3F4F6" },
            };

            const status = statusMap[payment.status] || {
              label: payment.status,
              color: "#6B7280",
              bg: "#F3F4F6",
            };

            const date = new Date(payment.createdAt).toLocaleDateString("ar-AE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentItemTop}>
                  <View style={styles.paymentServiceIcon}>
                    <Text style={styles.paymentServiceIconText}>د</Text>
                  </View>

                  <View style={styles.paymentItemMain}>
                    <Text style={styles.paymentServiceName} numberOfLines={1}>
                      {payment.serviceName}
                    </Text>
                    <Text style={styles.paymentPackageName} numberOfLines={1}>
                      {payment.packageName || "طلب مخصص"}
                    </Text>
                  </View>

                  <View style={styles.paymentAmountBox}>
                    <Text style={styles.paymentAmount}>
                      {payment.amount} {payment.currency}
                    </Text>
                    <View style={[styles.paymentStatusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.paymentStatusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.paymentItemBottom}>
                  <Text style={styles.paymentOrderNo}>طلب #{payment.orderNo}</Text>
                  <Text style={styles.paymentDate}>{date}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <Text style={styles.accountSectionTitle}>هل تحتاج إلى مساعدة؟</Text>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>هل تحتاج إلى مساعدة؟</Text>

        <Pressable
          onPress={() => Linking.openURL('mailto:info@mtuaefans.com')}
          style={({ pressed }) => [
            styles.contactAction,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.contactActionText}>Email ✉️</Text>
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL('tel:+971568952775')}
          style={({ pressed }) => [
            styles.contactAction,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.contactActionText}>Phone 📞</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Linking.openURL('https://wa.me/971568952775')
          }
          style={({ pressed }) => [
            styles.contactAction,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.whatsappText}>WhatsApp 💬</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.pressed,
        ]}
        onPress={onLogout}
      >
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </Pressable>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>
        {value?.trim() ? value : 'غير مضاف'}
      </Text>
    </View>
  );
}

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value} ›</Text>
    </View>
  );
}

/* =========================
   PROFILE MODAL
========================= */

function ProfileModal({
  visible,
  user,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  user: AuthUser;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Parameters<typeof updateProfile>[1]) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [snapchatUrl, setSnapchatUrl] = useState('');
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState('');

  useEffect(() => {
    if (!visible) return;

    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setBusinessName(user.businessName || '');
    setBusinessType(user.businessType || '');
    setWebsiteUrl(user.websiteUrl || '');
    setInstagramUrl(user.instagramUrl || '');
    setFacebookUrl(user.facebookUrl || '');
    setTiktokUrl(user.tiktokUrl || '');
    setSnapchatUrl(user.snapchatUrl || '');
    setGoogleBusinessUrl(user.googleBusinessUrl || '');
  }, [visible, user]);

  async function save() {
    if (!name.trim() || !email.trim()) {
      Alert.alert('تنبيه', 'الاسم والبريد الإلكتروني مطلوبان.');
      return;
    }

    await onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      businessName: businessName.trim(),
      businessType: businessType.trim(),
      websiteUrl: websiteUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      facebookUrl: facebookUrl.trim(),
      tiktokUrl: tiktokUrl.trim(),
      snapchatUrl: snapchatUrl.trim(),
      googleBusinessUrl: googleBusinessUrl.trim(),
    });
  }

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose}>
            <Text style={styles.modalClose}>رجوع</Text>
          </Pressable>

          <Text style={styles.modalTitle}>تعديل الحساب</Text>

          <View style={{ width: 50 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <FormInput label="الاسم" value={name} onChangeText={setName} />
            <FormInput
              label="البريد الإلكتروني"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <FormInput
              label="رقم الهاتف"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.formGroupTitle}>النشاط التجاري</Text>

            <FormInput
              label="اسم الشركة"
              value={businessName}
              onChangeText={setBusinessName}
            />
            <FormInput
              label="نوع النشاط"
              value={businessType}
              onChangeText={setBusinessType}
            />
            <FormInput
              label="الموقع الإلكتروني"
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              keyboardType="url"
            />
            <FormInput
              label="Instagram"
              value={instagramUrl}
              onChangeText={setInstagramUrl}
              keyboardType="url"
            />
            <FormInput
              label="Facebook"
              value={facebookUrl}
              onChangeText={setFacebookUrl}
              keyboardType="url"
            />
            <FormInput
              label="TikTok"
              value={tiktokUrl}
              onChangeText={setTiktokUrl}
              keyboardType="url"
            />
            <FormInput
              label="Snapchat"
              value={snapchatUrl}
              onChangeText={setSnapchatUrl}
              keyboardType="url"
            />
            <FormInput
              label="Google Business"
              value={googleBusinessUrl}
              onChangeText={setGoogleBusinessUrl}
              keyboardType="url"
            />

            <Pressable
              style={styles.primaryButton}
              onPress={save}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  حفظ التغييرات
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={label}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

/* =========================
   SERVICE FLOW
========================= */

function ServiceModal({
  visible,
  service,
  token,
  onClose,
  onCreated,
}: {
  visible: boolean;
  service: Service | null;
  token: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(
    null,
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    null,
  );
  const [businessTypeOpen, setBusinessTypeOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [platform, setPlatform] = useState('');
  const [days, setDays] = useState('1');
  const [accountUrl, setAccountUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [notes, setNotes] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');

  const [campaignObjective, setCampaignObjective] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignLink, setCampaignLink] = useState('');
  const [campaignMedia, setCampaignMedia] = useState<{
    uri: string;
    type: string;
    name?: string;
  } | null>(null);

  useEffect(() => {
    if (!visible || !service) return;

    setStep(0);
    setSelectedPackage(
      service &&
      (service.slug === 'website' || service.slug === 'ecommerce')
        ? service.packages?.[0] || null
        : null,
    );
    setSelectedTemplate(null);
    setBusinessTypeOpen(false);
    setPlatform('');
    setDays('1');
    setAccountUrl('');
    setWebsiteUrl('');
    setBusinessName('');
    setBusinessType('');
    setNotes('');
    setContactName('');
    setContactPhone('');
    setInstagramUrl('');
    setFacebookUrl('');
    setTiktokUrl('');
    setCampaignObjective('');
    setCampaignDescription('');
    setCampaignLink('');
    setCampaignMedia(null);
  }, [visible, service?.id]);

  if (!service) return null;

  const currentService = service;

  async function submitOrder() {
    setLoading(true);

    try {
      const isQuote = currentService.pricingType === 'QUOTE';

      const formData: Record<string, unknown> = {
        platform: platform || undefined,
        days: Number(days) || 1,
        accountUrl: accountUrl.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        businessName: businessName.trim() || undefined,
        businessType: businessType.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
        tiktokUrl: tiktokUrl.trim() || undefined,
        templateId: selectedTemplate || undefined,
        campaignObjective:
          campaignObjective.trim() || undefined,
        campaignDescription:
          campaignDescription.trim() || undefined,
        campaignLink: campaignLink.trim() || undefined,
        campaignMedia: campaignMedia
          ? {
              uri: campaignMedia.uri,
              type: campaignMedia.type,
              name: campaignMedia.name,
            }
          : undefined,
      };

      if (notes.trim()) {
        formData.notes = notes.trim();
      }

      const payload: any = {
        serviceId: currentService.id,
        formData,
      };

      if (selectedPackage) {
        payload.packageId = selectedPackage.id;
      }

      if (currentService.pricingType === 'PER_DAY') {
        payload.quantity = Math.max(1, Number(days) || 1);
      }

      if (isQuote) {
        if (currentService.slug === 'social-media') {
          payload.customerNote = [
            `الباقة: ${selectedPackage?.name || 'غير محددة'}`,
            `اسم الشركة: ${businessName.trim() || 'غير محدد'}`,
            `اسم المسؤول: ${contactName.trim() || 'غير محدد'}`,
            `رقم التواصل: ${contactPhone.trim() || 'غير محدد'}`,
            `Instagram: ${instagramUrl.trim() || 'غير مضاف'}`,
            `Facebook: ${facebookUrl.trim() || 'غير مضاف'}`,
            `TikTok: ${tiktokUrl.trim() || 'غير مضاف'}`,
            notes.trim() ? `ملاحظات: ${notes.trim()}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        } else {
          payload.customerNote = notes.trim() || undefined;
        }
      }

      const createdOrder = await createOrder(token, payload);

      if (isQuote) {
        Alert.alert(
          'تم إرسال الطلب',
          'سيقوم فريقنا بمراجعة طلبك وإرسال عرض السعر.',
          [{ text: 'حسنًا', onPress: onCreated }],
        );
        return;
      }

      const paymentResponse = await createPayment(
        token,
        createdOrder.orderNo,
        `Dubai Fans - ${serviceTitle(currentService)}`,
      );

      const paymentUrl =
        paymentResponse.payment.redirectUrl ||
        paymentResponse.payment.embeddedUrl;

      if (!paymentUrl) {
        Alert.alert(
          'تعذر فتح الدفع',
          'تم إنشاء الطلب، ولكن لم يتم الحصول على رابط الدفع. يمكنك متابعة الطلب من قسم طلباتي.',
          [{ text: 'حسنًا', onPress: onCreated }],
        );
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        paymentUrl,
        undefined,
      );

      // لا نعتبر cancel/dismiss فشلًا قبل التحقق من حالة الدفع في Ziina.
      // بوابة الدفع قد تعيد dismiss بعد نجاح العملية.

      const paymentIntentId =
        paymentResponse.payment.paymentIntentId;

      if (!paymentIntentId) {
        Alert.alert(
          'تعذر التحقق من الدفع',
          'تمت العودة من بوابة الدفع، ولكن لم يتم العثور على رقم عملية الدفع. يمكنك متابعة الطلب من قسم طلباتي.',
          [{ text: 'حسنًا', onPress: onCreated }],
        );
        return;
      }

      let paymentStatus: Awaited<ReturnType<typeof getPayment>> | null = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        paymentStatus = await getPayment(
          token,
          paymentIntentId,
        );

        if (
          paymentStatus.payment.status === 'COMPLETED' ||
          paymentStatus.payment.status === 'FAILED' ||
          paymentStatus.payment.status === 'CANCELED'
        ) {
          break;
        }

        if (attempt < 4) {
          await new Promise((resolve) =>
            setTimeout(resolve, 2000),
          );
        }
      }

      if (paymentStatus?.payment.status === 'COMPLETED') {
        Alert.alert(
          'تم الدفع بنجاح',
          'تم تأكيد الدفع وتحديث حالة الطلب إلى تم الدفع.',
          [{ text: 'حسنًا', onPress: onCreated }],
        );
        return;
      }

      if (paymentStatus?.payment.status === 'FAILED') {
        Alert.alert(
          'فشل الدفع',
          'لم تكتمل عملية الدفع. يمكنك العودة إلى الطلب والمحاولة مرة أخرى.',
          [{ text: 'حسنًا', onPress: onCreated }],
        );
        return;
      }

      if (paymentStatus?.payment.status === 'CANCELED') {
        Alert.alert(
          'تم إلغاء الدفع',
          'تم إلغاء عملية الدفع. يمكنك العودة إلى الطلب والمحاولة مرة أخرى.',
          [{ text: 'حسنًا', onPress: onCreated }],
        );
        return;
      }

      Alert.alert(
        'الدفع قيد المعالجة',
        'تمت العودة من بوابة الدفع، ولكن لم يتم تأكيد العملية بعد. سيتم تحديث حالة الطلب بعد تأكيد الدفع.',
        [{ text: 'حسنًا', onPress: onCreated }],
      );

    } catch (error) {
      Alert.alert(
        'تعذر إنشاء الطلب أو الدفع',
        error instanceof Error ? error.message : 'حدث خطأ غير متوقع.',
      );
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (currentService.slug === 'custom') {
      if (!notes.trim()) {
        Alert.alert(
          'تنبيه',
          'اكتب تفاصيل الخدمة المطلوبة أولًا.',
        );
        return;
      }
    }

    if (currentService.slug === 'advertising') {
      // الخطوة الأولى: اختيار منصة الإعلان فقط
      if (step === 0) {
        if (!platform) {
          Alert.alert(
            'تنبيه',
            'اختر منصة إعلانية واحدة.',
          );
          return;
        }

        setStep(1);
        return;
      }

      // الخطوة الثانية: بيانات الحملة
      if (step === 1) {
        if (!campaignObjective) {
          Alert.alert(
            'تنبيه',
            'اختر هدف الحملة.',
          );
          return;
        }

        if (!campaignDescription.trim()) {
          Alert.alert(
            'تنبيه',
            'اكتب وصف الحملة وتفاصيلها.',
          );
          return;
        }

        if (!campaignLink.trim()) {
          Alert.alert(
            'تنبيه',
            'أدخل رابط الموقع أو واتساب.',
          );
          return;
        }

        if (!campaignMedia) {
          Alert.alert(
            'تنبيه',
            'اختر صورة أو فيديو للحملة.',
          );
          return;
        }

        const campaignDays = Number(days);

        if (
          !Number.isFinite(campaignDays) ||
          campaignDays < 1
        ) {
          Alert.alert(
            'تنبيه',
            'أدخل عدد أيام صحيح.',
          );
          return;
        }

        setStep(2);
        return;
      }

      return;
    }

    if (
      currentService.slug === 'social-media' &&
      step === 1
    ) {
      if (!businessName.trim()) {
        Alert.alert(
          'تنبيه',
          'أدخل اسم الشركة أو النشاط التجاري.',
        );
        return;
      }

      if (!contactPhone.trim()) {
        Alert.alert(
          'تنبيه',
          'أدخل رقم التواصل.',
        );
        return;
      }

      const hasSocialAccount =
        instagramUrl.trim() ||
        facebookUrl.trim() ||
        tiktokUrl.trim();

      if (!hasSocialAccount) {
        Alert.alert(
          'تنبيه',
          'أدخل رابط حساب واحد على الأقل من Instagram أو Facebook أو TikTok.',
        );
        return;
      }

      setStep(2);
      return;
    }

    if (
      currentService.slug === 'followers' &&
      step === 1 &&
      (!platform || !accountUrl.trim())
    ) {
      Alert.alert(
        'تنبيه',
        'اختر المنصة وأدخل رابط الحساب.',
      );
      return;
    }

    if (
      (currentService.slug === 'website' ||
        currentService.slug === 'ecommerce') &&
      step === 0 &&
      !selectedPackage
    ) {
      Alert.alert(
        'تنبيه',
        'اختر القالب أولًا.',
      );
      return;
    }

    if (
      (currentService.slug === 'website' ||
        currentService.slug === 'ecommerce') &&
      !businessName.trim()
    ) {
      Alert.alert(
        'تنبيه',
        'أدخل اسم النشاط التجاري.',
      );
      return;
    }

    if (
      currentService.pricingType !== 'QUOTE' &&
      step === 0 &&
      !selectedPackage &&
      currentService.slug !== 'advertising'
    ) {
      Alert.alert(
        'تنبيه',
        'اختر الباقة أولًا.',
      );
      return;
    }

    setStep((current) => current + 1);
  }

  const packages = service.packages || [];

  const localTemplates =
    currentService.slug === 'website'
      ? [
          {
            id: 'website-template-01',
            name: 'Business Pro',
            description: 'قالب شركة أعمال احترافي',
            image: require('./assets/templates/template-01.png'),
          },
          {
            id: 'website-template-02',
            name: 'Corporate',
            description: 'قالب شركة عصري وأنيق',
            image: require('./assets/templates/template-02.png'),
          },
          {
            id: 'website-template-03',
            name: 'Modern Business',
            description: 'قالب حديث للخدمات والشركات',
            image: require('./assets/templates/template-03.png'),
          },
        ]
      : currentService.slug === 'ecommerce'
        ? [
            {
              id: 'ecommerce-template-01',
              name: 'Electronics Store',
              description: 'متجر إلكترونيات احترافي',
              image: require('./assets/templates/template-04.png'),
            },
            {
              id: 'ecommerce-template-02',
              name: 'Beauty Store',
              description: 'متجر تجميل وعناية',
              image: require('./assets/templates/template-05.png'),
            },
            {
              id: 'ecommerce-template-03',
              name: 'Fashion Store',
              description: 'متجر عصري للمنتجات',
              image: require('./assets/templates/template-06.png'),
            },
            {
              id: 'ecommerce-template-04',
              name: 'Lifestyle Store',
              description: 'متجر منتجات متنوع',
              image: require('./assets/templates/template-07.png'),
            },
            {
              id: 'ecommerce-template-05',
              name: 'Premium Store',
              description: 'متجر بتصميم فاخر',
              image: require('./assets/templates/template-08.png'),
            },
          ]
        : [];

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose}>
            <Text style={styles.modalClose}>رجوع</Text>
          </Pressable>

          <Text style={styles.modalTitle} numberOfLines={1}>
            {serviceTitle(service)}
          </Text>

          <Text style={styles.stepText}>
            {step + 1}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <>
              <Text style={styles.flowTitle}>
                {currentService.slug === 'custom'
                  ? 'أخبرنا بما تحتاج'
                  : currentService.slug === 'social-media'
                    ? 'حدد احتياجك'
                    : currentService.slug === 'advertising'
                      ? 'اختر منصة الإعلان'
                      : currentService.slug === 'followers'
                        ? 'اختر الباقة'
                        : currentService.slug === 'website' ||
                            currentService.slug === 'ecommerce'
                          ? 'اختر التصميم المناسب'
                          : 'اختر الباقة'}
              </Text>

              {currentService.slug === 'social-media' && (
                <View style={styles.socialPlansContainer}>
                  {packages.map((item) => {
                    const isGrowth = item.slug === 'growth-plan';

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.socialPlanCard,
                          isGrowth && styles.socialPlanCardFeatured,
                        ]}
                      >
                        {isGrowth ? (
                          <View style={styles.socialPlanBadge}>
                            <Text style={styles.socialPlanBadgeText}>
                              خطة النمو
                            </Text>
                          </View>
                        ) : null}

                        <Text style={styles.socialPlanName}>
                          {isGrowth
                            ? 'Growth Plan'
                            : 'Domination Plan'}
                        </Text>

                        <Text style={styles.socialPlanArabicName}>
                          {isGrowth ? 'خطة النمو' : 'خطة السيطرة'}
                        </Text>

                        <Text style={styles.socialPlanIntro}>
                          {isGrowth
                            ? 'للشركات التي تريد توسعاً حقيقياً وزيادة مبيعات'
                            : 'للشركات التي تريد الصدارة الكاملة في السوق الرقمي'}
                        </Text>

                        <View style={styles.socialPlanFeatures}>
                          {(isGrowth
                            ? [
                                'إدارة 3 منصات (فيسبوك، إنستغرام، تيك توك)',
                                '20 بوست + 4 ريلز + 4 قصة شهرياً',
                                '12 مقالاً لموقعك وخرائط جوجل',
                                'ربط واتساب + Facebook Pixel + Google Tag',
                                'إدارة الحملات على Meta وGoogle',
                                'جلسة تصوير واحدة كل شهرين',
                                'باقة SEO Growth Plus',
                                'استشارات أسبوعية من جوجل وميتا',
                                'دعم تقني مرتين أسبوعياً',
                                'لوحة تحكم متابعة خاصة',
                                'تقارير أداء تنفيذية شهرية',
                              ]
                            : [
                                'إدارة كاملة لجميع المنصات',
                                'تصميم موقع إلكتروني احترافي + SEO',
                                'منشورات + ريلز + قصص يومياً',
                                'حملات إعلانية على Meta وGoogle وTikTok',
                                'جلسة تصوير شهرية كاملة',
                                'استراتيجية محتوى مخصصة',
                                'SEO شامل وتحسين مستمر',
                                'تقارير تحليلية متعمقة أسبوعياً',
                                'استشارة تسويقية أسبوعية',
                                'دعم VIP على مدار الساعة',
                                'لوحة تحكم تنفيذية متكاملة',
                                'مدير حساب مخصص',
                              ]
                          ).map((feature) => (
                            <View
                              key={feature}
                              style={styles.socialPlanFeatureRow}
                            >
                              <Text style={styles.socialPlanCheck}>
                                ✓
                              </Text>
                              <Text style={styles.socialPlanFeature}>
                                {feature}
                              </Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.socialPlanFooter}>
                          <View>
                            <Text style={styles.socialPlanPrice}>
                              {money(item.price)}
                            </Text>
                            <Text style={styles.socialPlanPeriod}>
                              شهرياً
                            </Text>
                          </View>

                          <Pressable
                            style={[
                              styles.socialSubscribeButton,
                              isGrowth &&
                                styles.socialSubscribeButtonFeatured,
                            ]}
                            onPress={() => {
                              setSelectedPackage(item);
                              setStep(1);
                            }}
                          >
                            <Text
                              style={[
                                styles.socialSubscribeText,
                                isGrowth &&
                                  styles.socialSubscribeTextFeatured,
                              ]}
                            >
                              اشتراك
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {(currentService.slug === 'followers' ||
                service.slug === 'views-likes' ||
                service.slug === 'photography' ||
                service.slug === 'seo-google') &&
                packages.map((item) => (
                  <PackageCard
                    key={item.id}
                    item={item}
                    selected={selectedPackage?.id === item.id}
                    onPress={() => setSelectedPackage(item)}
                  />
                ))}

              {(currentService.slug === 'website' ||
                currentService.slug === 'ecommerce') && (
                <>
                  <Text style={styles.templateSectionTitle}>
                    اختر القالب المناسب
                  </Text>

                  <Text style={styles.templateSectionSubtitle}>
                    يمكنك اختيار التصميم الأقرب لهوية نشاطك، وسيتم اعتماد اختيارك عند تنفيذ الطلب.
                  </Text>

                  <View style={styles.templatesGallery}>
                    {localTemplates.map((template) => {
                      const selected =
                        selectedTemplate === template.id;

                      return (
                        <Pressable
                          key={template.id}
                          style={[
                            styles.templateGalleryCard,
                            selected &&
                              styles.templateGalleryCardSelected,
                          ]}
                          onPress={() =>
                            setSelectedTemplate(template.id)
                          }
                        >
                          <Image
                            source={template.image}
                            style={styles.templateGalleryImage}
                            resizeMode="cover"
                          />

                          <View style={styles.templateGalleryInfo}>
                            <Text style={styles.templateGalleryName}>
                              {template.name}
                            </Text>

                            <Text style={styles.templateGalleryDescription}>
                              {template.description}
                            </Text>

                            <View
                              style={[
                                styles.templateChooseButton,
                                selected &&
                                  styles.templateChooseButtonSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.templateChooseText,
                                  selected &&
                                    styles.templateChooseTextSelected,
                                ]}
                              >
                                {selected
                                  ? '✓ تم اختيار القالب'
                                  : 'اختيار القالب'}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.cleanPriceCard}>
                    <View>
                      <Text style={styles.cleanPriceLabel}>
                        سعر الخدمة
                      </Text>
                      <Text style={styles.cleanPriceValue}>
                        {currentService.slug === 'website'
                          ? '599 AED'
                          : '799 AED'}
                      </Text>
                    </View>

                    <Text style={styles.cleanPriceUnit}>
                      مرة واحدة
                    </Text>
                  </View>

                  <FormInput
                    label="اسم النشاط التجاري"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />

                  <Text style={styles.fieldLabel}>
                    نوع النشاط
                  </Text>

                  <Pressable
                    style={styles.dropdownButton}
                    onPress={() =>
                      setBusinessTypeOpen((current) => !current)
                    }
                  >
                    <Text
                      style={[
                        styles.dropdownButtonText,
                        !businessType &&
                          styles.dropdownPlaceholder,
                      ]}
                    >
                      {businessType || 'اختر نوع النشاط'}
                    </Text>

                    <Text style={styles.dropdownArrow}>
                      {businessTypeOpen ? '▲' : '▼'}
                    </Text>
                  </Pressable>

                  {businessTypeOpen && (
                    <View style={styles.dropdownMenu}>
                      {(currentService.slug === 'website'
                        ? [
                            'شركة',
                            'مطعم',
                            'مركز طبي',
                            'خدمات مهنية',
                            'أخرى',
                          ]
                        : [
                            'متجر عطور',
                            'متجر ملابس',
                            'متجر اكسسوارات',
                            'متجر متعدد الاقسام',
                            'متجر منتجات رقمية',
                            'أخرى',
                          ]
                      ).map((option) => (
                        <Pressable
                          key={option}
                          style={[
                            styles.dropdownOption,
                            businessType === option &&
                              styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setBusinessType(option);
                            setBusinessTypeOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              businessType === option &&
                                styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {option}
                          </Text>

                          {businessType === option ? (
                            <Text style={styles.dropdownCheck}>
                              ✓
                            </Text>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              )}

              {currentService.slug === 'advertising' && (
                <>
                  <View style={styles.platformGrid}>
                    <PlatformButton
                      label="Facebook"
                      icon="facebook"
                      compact
                      selected={platform === 'Facebook'}
                      onPress={() => setPlatform('Facebook')}
                    />
                    <PlatformButton
                      label="Instagram"
                      icon="instagram"
                      compact
                      selected={platform === 'Instagram'}
                      onPress={() => setPlatform('Instagram')}
                    />
                    <PlatformButton
                      label="TikTok"
                      icon="tiktok"
                      compact
                      selected={platform === 'TikTok'}
                      onPress={() => setPlatform('TikTok')}
                    />
                    <PlatformButton
                      label="Snapchat"
                      icon="snapchat"
                      compact
                      selected={platform === 'Snapchat'}
                      onPress={() => setPlatform('Snapchat')}
                    />
                    <PlatformButton
                      label="Google"
                      icon="google"
                      compact
                      selected={platform === 'Google'}
                      onPress={() => setPlatform('Google')}
                    />
                  </View>

                  <FormInput
                    label="عدد الأيام"
                    value={days}
                    onChangeText={setDays}
                    keyboardType="number-pad"
                  />

                  <View style={styles.pricePreview}>
                    <Text style={styles.pricePreviewLabel}>
                      تكلفة الإدارة
                    </Text>
                    <Text style={styles.pricePreviewValue}>
                      {money(80 * Math.max(1, Number(days) || 1))}
                    </Text>
                  </View>
                </>
              )}

              {(currentService.slug === 'custom' ||
                currentService.slug === 'social-media') && (
                <>
                  <Text style={styles.fieldLabel}>
                    تفاصيل الطلب
                  </Text>
                  <TextInput
                    value={contactName}
                    onChangeText={setContactName}
                    placeholder="اكتب بالتفصيل ما تحتاجه..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    style={styles.textArea}
                  />
                </>
              )}

              {service.slug !== 'advertising' &&
                service.slug !== 'followers' &&
                service.slug !== 'website' &&
                service.slug !== 'ecommerce' &&
                service.slug !== 'custom' &&
                service.slug !== 'social-media' && (
                  <FormInput
                    label="رابط الحساب أو الموقع"
                    value={instagramUrl}
                    onChangeText={setInstagramUrl}
                    keyboardType="url"
                  />
                )}
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.flowTitle}>
                التفاصيل الإضافية
              </Text>

              {currentService.slug === 'advertising' && (
                <>
                  <Text style={styles.fieldLabel}>هدف الحملة</Text>

                  <View style={styles.platformGrid}>
                    {[
                      'رسائل واتساب',
                      'زيارات الموقع',
                      'تفاعل',
                      'مشاهدات',
                      'عملاء محتملون',
                      'مبيعات',
                    ].map((item) => (
                      <PlatformButton
                      key={item}
                      label={item}
                      icon={
                        item === 'رسائل واتساب'
                          ? 'whatsapp'
                          : item === 'زيارات الموقع'
                            ? 'website'
                            : item === 'تفاعل'
                              ? 'engagement'
                              : item === 'مشاهدات'
                                ? 'views'
                                : item === 'عملاء محتملون'
                                  ? 'leads'
                                  : 'sales'
                      }
                      selected={campaignObjective === item}
                        onPress={() => setCampaignObjective(item)}
                        compact
                      />
                    ))}
                  </View>

                  <FormInput
                    label="رابط الموقع أو واتساب"
                    value={campaignLink}
                    onChangeText={setCampaignLink}
                    keyboardType="url"
                  />

                  <Text style={styles.fieldLabel}>وصف الحملة</Text>
                  <TextInput
                    value={campaignDescription}
                    onChangeText={setCampaignDescription}
                    placeholder="اكتب تفاصيل الحملة والجمهور أو العرض المطلوب..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    style={styles.textArea}
                  />

                  <Text style={styles.fieldLabel}>الصورة أو الفيديو</Text>

                  <Pressable
                    style={styles.mediaPickerButton}
                    onPress={async () => {
                      const permission =
                        await ImagePicker.requestMediaLibraryPermissionsAsync();

                      if (!permission.granted) {
                        Alert.alert(
                          'صلاحية الصور',
                          'اسمح للتطبيق بالوصول إلى الصور والفيديو لاختيار مادة الحملة.',
                        );
                        return;
                      }

                      const result =
                        await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ['images', 'videos'],
                          allowsEditing: false,
                          quality: 0.9,
                        });

                      if (!result.canceled && result.assets?.[0]) {
                        const asset = result.assets[0];

                        setCampaignMedia({
                          uri: asset.uri,
                          type: asset.type || 'unknown',
                          name: asset.fileName || undefined,
                        });
                      }
                    }}
                  >
                    <Text style={styles.mediaPickerText}>
                      {campaignMedia
                        ? 'تغيير الصورة أو الفيديو'
                        : 'اختيار صورة أو فيديو من الهاتف'}
                    </Text>
                  </Pressable>

                  {campaignMedia ? (
                    <View style={styles.mediaSelectedCard}>
                      <Text style={styles.mediaSelectedTitle}>
                        تم اختيار المادة الإعلانية
                      </Text>

                      <Text style={styles.mediaSelectedText}>
                        النوع: {campaignMedia.type === 'video' ? 'فيديو' : 'صورة'}
                      </Text>

                      {campaignMedia.name ? (
                        <Text
                          style={styles.mediaSelectedText}
                          numberOfLines={2}
                        >
                          {campaignMedia.name}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <FormInput
                    label="عدد الأيام"
                    value={days}
                    onChangeText={setDays}
                    keyboardType="number-pad"
                  />

                  <View style={styles.pricePreview}>
                    <Text style={styles.pricePreviewLabel}>
                      تكلفة الإدارة
                    </Text>
                    <Text style={styles.pricePreviewValue}>
                      {money(80 * Math.max(1, Number(days) || 1))}
                    </Text>
                  </View>
                </>
              )}

              {currentService.slug === 'social-media' && (
                <View style={styles.socialSubscriptionForm}>
                  <View style={styles.selectedPlanSummary}>
                    <Text style={styles.selectedPlanSummaryLabel}>
                      الباقة المختارة
                    </Text>

                    <Text style={styles.selectedPlanSummaryName}>
                      {selectedPackage?.slug === 'growth-plan'
                        ? 'Growth Plan — خطة النمو'
                        : 'Domination Plan — خطة السيطرة'}
                    </Text>

                    <Text style={styles.selectedPlanSummaryPrice}>
                      {selectedPackage
                        ? money(selectedPackage.price)
                        : '—'}{' '}
                      / شهرياً
                    </Text>
                  </View>

                  <Text style={styles.formSectionTitle}>
                    بيانات الاشتراك
                  </Text>

                  <FormInput
                    label="اسم الشركة أو النشاط التجاري"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />

                  <FormInput
                    label="اسم المسؤول"
                    value={notes}
                    onChangeText={setNotes}
                  />

                  <FormInput
                    label="رقم التواصل"
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.fieldLabel}>
                    روابط حسابات التواصل الاجتماعي
                  </Text>

                  <FormInput
                    label="Instagram"
                    value={accountUrl}
                    onChangeText={setAccountUrl}
                    keyboardType="url"
                  />

                  <FormInput
                    label="Facebook"
                    value={facebookUrl}
                    onChangeText={setFacebookUrl}
                    keyboardType="url"
                  />

                  <FormInput
                    label="TikTok"
                    value={tiktokUrl}
                    onChangeText={setTiktokUrl}
                    keyboardType="url"
                  />

                  <View style={styles.socialSubscriptionNote}>
                    <Text style={styles.socialSubscriptionNoteTitle}>
                      لا يوجد دفع الآن
                    </Text>

                    <Text style={styles.socialSubscriptionNoteText}>
                      بعد إرسال الطلب سيتواصل معك فريق دبي فانز لمراجعة البيانات
                      واستكمال إجراءات الاشتراك.
                    </Text>
                  </View>
                </View>
              )}

              {currentService.slug === 'followers' && (
                <>
                  <View style={styles.platformGrid}>
                    <PlatformButton
                      label="Facebook"
                      selected={platform === 'Facebook'}
                      onPress={() => setPlatform('Facebook')}
                      icon="facebook"
                      compact
                    />
                    <PlatformButton
                      label="Instagram"
                      selected={platform === 'Instagram'}
                      onPress={() => setPlatform('Instagram')}
                      icon="instagram"
                      compact
                    />
                    <PlatformButton
                      label="TikTok"
                      selected={platform === 'TikTok'}
                      onPress={() => setPlatform('TikTok')}
                      icon="tiktok"
                      compact
                    />
                  </View>

                  <FormInput
                    label="رابط الحساب"
                    value={accountUrl}
                    onChangeText={setAccountUrl}
                    keyboardType="url"
                  />
                </>
              )}

              {service.slug === 'seo-google' && (
                <>
                  <FormInput
                    label="رابط الموقع الإلكتروني"
                    value={websiteUrl}
                    onChangeText={setWebsiteUrl}
                    keyboardType="url"
                  />

                  <Text style={styles.optionalBox}>
                    Google Maps — اختياري
                  </Text>
                </>
              )}

              {service.slug === 'photography' && (
                <>
                  <FormInput
                    label="المدينة"
                    value={businessType}
                    onChangeText={setBusinessType}
                  />

                  <FormInput
                    label="نوع النشاط"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />

                  <FormInput
                    label="الموقع"
                    value={websiteUrl}
                    onChangeText={setWebsiteUrl}
                  />

                  <Text style={styles.fieldLabel}>ملاحظات</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="نوع المحتوى، أفكار، تفاصيل إضافية..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    style={styles.textArea}
                  />
                </>
              )}

              {service.slug === 'views-likes' && (
                <FormInput
                  label="رابط المحتوى"
                  value={accountUrl}
                  onChangeText={setAccountUrl}
                  keyboardType="url"
                />
              )}

              {currentService.slug === 'website' ||
              currentService.slug === 'ecommerce' ? (
                <>
                  <FormInput
                    label="رابط مرجعي للموقع — اختياري"
                    value={websiteUrl}
                    onChangeText={setWebsiteUrl}
                    keyboardType="url"
                  />

                  <Text style={styles.optionalBox}>
                    سيتم طلب الشعار والصور والبيانات التفصيلية ضمن
                    تنفيذ الطلب.
                  </Text>
                </>
              ) : null}
            </>
          )}

          {step >= 2 && (
            <>
              <Text style={styles.flowTitle}>مراجعة الطلب</Text>

              <View style={styles.reviewCard}>
                <ReviewRow
                  label="الخدمة"
                  value={serviceTitle(service)}
                />

                {selectedPackage && (
                  <ReviewRow
                    label="الباقة"
                    value={selectedPackage.name}
                  />
                )}

                {platform ? (
                  <ReviewRow label="المنصة" value={platform} />
                ) : null}

                {currentService.slug === 'advertising' &&
                campaignObjective ? (
                  <ReviewRow
                    label="هدف الحملة"
                    value={campaignObjective}
                  />
                ) : null}

                {currentService.slug === 'advertising' &&
                campaignDescription ? (
                  <ReviewRow
                    label="تفاصيل الحملة"
                    value={campaignDescription}
                  />
                ) : null}

                {currentService.slug === 'advertising' &&
                campaignLink ? (
                  <ReviewRow
                    label="الرابط"
                    value={campaignLink}
                  />
                ) : null}

                {currentService.slug === 'advertising' &&
                campaignMedia ? (
                  <ReviewRow
                    label="المادة الإعلانية"
                    value={
                      campaignMedia.type === 'video'
                        ? 'فيديو'
                        : 'صورة'
                    }
                  />
                ) : null}

                {days && currentService.slug === 'advertising' ? (
                  <ReviewRow label="عدد الأيام" value={days} />
                ) : null}

                {accountUrl ? (
                  <ReviewRow
                    label="الرابط"
                    value={accountUrl}
                  />
                ) : null}

                <View style={styles.reviewTotal}>
                  <Text style={styles.reviewTotalLabel}>
                    الإجمالي
                  </Text>

                  <Text style={styles.reviewTotalValue}>
                    {service.pricingType === 'QUOTE'
                      ? 'عرض سعر'
                      : money(
                          currentService.slug === 'advertising'
                            ? 80 *
                                Math.max(
                                  1,
                                  Number(days) || 1,
                                )
                            : selectedPackage?.price,
                        )}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.flowActions}>
            {step > 0 && (
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setStep((current) => current - 1)}
              >
                <Text style={styles.secondaryButtonText}>
                  السابق
                </Text>
              </Pressable>
            )}

            {step < 2 ? (
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  if (
                    service.pricingType !== 'QUOTE' &&
                    step === 0 &&
                    !selectedPackage &&
                    service.slug !== 'advertising'
                  ) {
                    Alert.alert(
                      'تنبيه',
                      'اختر الباقة أولًا.',
                    );
                    return;
                  }

                  next();
                }}
              >
                <Text style={styles.primaryButtonText}>
                  التالي
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.primaryButton}
                onPress={submitOrder}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {service.pricingType === 'QUOTE'
                      ? 'إرسال طلب عرض سعر'
                      : 'تأكيد الطلب'}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function PackageCard({
  item,
  selected,
  onPress,
}: {
  item: Package;
  selected: boolean;
  onPress: () => void;
}) {
  const isWebsite =
    item.slug === 'business-website';

  const isEcommerce =
    item.slug === 'ecommerce-store';

  const previewImage = isWebsite
    ? require('./assets/templates/template-01.png')
    : isEcommerce
      ? require('./assets/templates/template-04.png')
      : null;

  return (
    <Pressable
      style={[
        styles.packageCard,
        styles.templateCard,
        selected && styles.packageCardSelected,
      ]}
      onPress={onPress}
    >
      {previewImage ? (
        <Image
          source={previewImage}
          style={styles.templatePreview}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.templateInfo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.packageName}>
            {item.name}
          </Text>

          {item.description ? (
            <Text style={styles.packageDescription}>
              {item.description}
            </Text>
          ) : (
            <Text style={styles.templateHint}>
              {isWebsite
                ? 'معاينة قالب موقع أعمال احترافي'
                : isEcommerce
                  ? 'معاينة قالب متجر إلكتروني احترافي'
                  : 'اختر هذا القالب'}
            </Text>
          )}
        </View>

        <Text style={styles.packagePrice}>
          {money(item.price)}
        </Text>
      </View>

      {selected ? (
        <View style={styles.templateSelectedBadge}>
          <Text style={styles.templateSelectedText}>
            ✓ تم اختيار القالب
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}


function CampaignOptionIcon({
  type,
}: {
  type:
    | 'facebook'
    | 'instagram'
    | 'tiktok'
    | 'snapchat'
    | 'google'
    | 'whatsapp'
    | 'website'
    | 'engagement'
    | 'views'
    | 'leads'
    | 'sales';
}) {
  const icons: Record<
    string,
    ReturnType<typeof require>
  > = {
    facebook: require('./assets/icons/facebook.png'),
    instagram: require('./assets/icons/instagram.png'),
    tiktok: require('./assets/icons/tiktok.png'),
    snapchat: require('./assets/icons/snapchat.png'),
    google: require('./assets/icons/google.png'),
    whatsapp: require('./assets/icons/whatsapp.png'),
    website: require('./assets/website-visits.png'),
    engagement: require('./assets/icons/interaction.png'),
    views: require('./assets/views.png'),
    leads: require('./assets/leads.png'),
    sales: require('./assets/sales.png'),
  };

  return (
    <Image
      source={icons[type]}
      style={{
        width: 28,
        height: 28,
      }}
      resizeMode="contain"
    />
  );
}

function PlatformButton({
  label,
  selected,
  onPress,
  icon,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: Parameters<typeof CampaignOptionIcon>[0]['type'];
  compact?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.platformButton,
        compact && styles.platformButtonCompact,
        selected && styles.platformSelected,
      ]}
      onPress={onPress}
    >
      <View
        style={{
          flexDirection: compact ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: compact ? 4 : 8,
        }}
      >
        {icon ? <CampaignOptionIcon type={icon} /> : null}

        <Text
          style={[
            styles.platformText,
            compact && { textAlign: 'center' },
            selected && styles.platformSelectedText,
          ]}
        >
          {selected ? '✓ ' : ''}
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/* =========================
   COMMON
========================= */

function ScreenTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.screenTitle}>
      <Text style={styles.screenTitleText}>{title}</Text>
      <Text style={styles.screenSubtitle}>{subtitle}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function BottomNavigation({
  activeTab,
  onChange,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  const items: { key: Tab; label: string; icon: string }[] = [
    { key: 'home', label: 'الرئيسية', icon: '⌂' },
    { key: 'services', label: 'الخدمات', icon: '▦' },
    { key: 'orders', label: 'الطلبات', icon: '▣' },
    { key: 'campaigns', label: 'الحملات', icon: '↗' },
    { key: 'account', label: 'حسابي', icon: '●' },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = activeTab === item.key;

        return (
          <Pressable
            key={item.key}
            style={styles.navItem}
            onPress={() => onChange(item.key)}
          >
            <Text
              style={[
                styles.navIcon,
                active && styles.navActive,
              ]}
            >
              {item.icon}
            </Text>

            <Text
              style={[
                styles.navLabel,
                active && styles.navActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  whyCampaignCompact: {
    width: '100%',
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  whyCampaignEyebrowCompact: {
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#D92D20',
    marginBottom: 1,
  },
  whyCampaignTitleCompact: {
    textAlign: 'right',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 3,
  },
  whyCampaignSubtitleCompact: {
    textAlign: 'right',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  campaignStepsRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    minHeight: 105,
  },
  campaignStepCompact: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 3,
  },
  campaignStepTop: {
    width: '100%',
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  campaignStepNumber: {
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914',
  },
  campaignStepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  campaignStepIconCompact: {
    width: 31,
    height: 31,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 23,
    lineHeight: 31,
  },
  campaignStepTitleCompact: {
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  campaignStepTextCompact: {
    width: '100%',
    textAlign: 'center',
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  campaignStepDivider: {
    width: 1,
    height: 76,
    alignSelf: 'center',
    backgroundColor: '#F0F0F0',
  },
  startCampaignButtonCompact: {
    width: '100%',
    height: 45,
    marginTop: 7,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914',
  },
  startCampaignButtonTextCompact: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  },
  whyCampaign: {
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 16,
    backgroundColor: WHITE,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  whyCampaignEyebrow: {
    color: RED,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'right',
    marginBottom: 3,
  },
  whyCampaignTitle: {
    color: DARK,
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 5,
  },
  whyCampaignSubtitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 9,
  },
  campaignStep: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  campaignStepIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFF4F4',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 19,
    marginLeft: 11,
    overflow: 'hidden',
  },
  campaignStepContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  campaignStepTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 1,
  },
  campaignStepText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  startCampaignButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 15,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  startCampaignButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '900',
  },
  allServicesSubtitle: {
    marginHorizontal: 18,
    marginTop: -8,
    marginBottom: 16,
    color: MUTED,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
  },
  heroSection: {
    width: '100%',
    marginTop: 8,
    marginBottom: 4,
  },
  heroScrollContent: {
    alignItems: 'flex-start',
  },
  heroSlide: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heroImagePressable: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  heroIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 7,
    gap: 5,
  },
  heroIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  heroIndicatorActive: {
    width: 18,
    backgroundColor: '#E50914',
  },
  marketingVisual: {
    height: 205,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 18,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: DARK,
    position: 'relative',
  },
  marketingVisualImageWrap: {
    ...StyleSheet.absoluteFill,
  },
  marketingVisualImage: {
    width: '100%',
    height: '100%',
  },
  marketingVisualOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  marketingVisualText: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 34,
  },
  marketingVisualTitle: {
    color: WHITE,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'left',
  },
  marketingVisualSubtitle: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'left',
  },
  marketingDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  marketingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  marketingDotActive: {
    width: 18,
    backgroundColor: '#D4AF37',
  },
  splashScreen: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  splashImageContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  splashShine: {
    position: 'absolute',
    width: 70,
    height: '150%',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  splashProgressTrack: {
    position: 'absolute',
    bottom: 42,
    width: '58%',
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  splashProgress: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#D4AF37',
  },
  authScreen: {
    flex: 1,
    backgroundColor: WHITE,
  },
  authKeyboard: {
    flex: 1,
  },
  authContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: DARK,
    textAlign: 'center',
    marginTop: 18,
  },
  authSubtitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 28,
  },
  authForm: {
    width: '100%',
  },
  authLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 12,
  },
  authInput: {
    height: 52,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    color: DARK,
    fontSize: 15,
  },
  authButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  authButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
  app: {
    flex: 1,
    backgroundColor: BG,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
    gap: 14,
  },

  logoMark: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoMarkText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: '900',
  },

  loadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
  },

  screen: {
    flex: 1,
  },

  screenContent: {
    padding: 18,
    paddingBottom: 120,
  },

  homeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },

  homeHeaderBrand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  homeHeaderLogo: {
    width: 42,
    height: 42,
    marginLeft: 9,
  },

  homeHeaderBrandText: {
    alignItems: 'flex-end',
  },

  homeHeaderTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'right',
  },

  homeHeaderSubtitle: {
    color: MUTED,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
    textAlign: 'right',
  },

  homeHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  homeHeaderAction: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeHeaderActionIcon: {
    color: DARK,
    fontSize: 17,
    fontWeight: '800',
  },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  hello: {
    color: MUTED,
    fontSize: 13,
    textAlign: 'right',
  },

  userName: {
    color: DARK,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 2,
  },

  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerLogoText: {
    color: WHITE,
    fontWeight: '900',
    fontSize: 15,
  },

  hero: {
    minHeight: 185,
    borderRadius: 24,
    backgroundColor: DARK,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 24,
  },

  heroContent: {
    alignItems: 'flex-end',
  },

  heroEyebrow: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },

  heroTitle: {
    color: WHITE,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 5,
  },

  heroText: {
    color: '#D1D5DB',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 8,
  },

  heroButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: RED,
  },

  heroButtonText: {
    color: WHITE,
    fontWeight: '800',
    fontSize: 12,
  },

  heroSymbol: {
    position: 'absolute',
    left: 18,
    bottom: 12,
    color: '#374151',
    fontSize: 80,
    fontWeight: '900',
  },

  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },

  sectionHeaderTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '900',
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },

  horizontalServices: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 16,
  },

  popularServicesHeader: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 10,
  },

  popularServicesTitle: {
    color: DARK,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'right',
  },

  popularServicesSeeAll: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  popularServicesSeeAllText: {
    color: RED,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },

  popularCard: {
    width: Math.min(
      116,
      (Dimensions.get('window').width - 56) / 3,
    ),
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  serviceImage: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#EEF2F7',
    marginBottom: 7,
  },

  serviceImagePhoto: {
    width: '100%',
    height: '100%',
  },

  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F7',
  },

  imageFallbackText: {
    fontSize: 38,
  },

  popularTitle: {
    color: DARK,
    fontWeight: '800',
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'right',
    minHeight: 32,
  },

  popularPrice: {
    color: RED,
    fontWeight: '800',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'right',
    marginTop: 2,
  },


  chooseUsSection: {
    marginTop: 6,
    marginBottom: 22,
  },

  chooseUsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  chooseUsCard: {
    width: '48%',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 142,
    alignItems: 'flex-end',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  chooseUsIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  chooseUsIconText: {
    fontSize: 20,
  },

  chooseUsTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 5,
  },

  chooseUsText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 17,
    textAlign: 'right',
  },

  testimonialsSection: {
    marginTop: 2,
    marginBottom: 22,
  },

  testimonialHomeCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    minHeight: 220,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  testimonialHomeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  testimonialHomeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 11,
  },

  testimonialHomeAvatarText: {
    color: RED,
    fontSize: 18,
    fontWeight: '900',
  },

  testimonialHomeIdentity: {
    flex: 1,
    alignItems: 'flex-end',
  },

  testimonialHomeName: {
    color: DARK,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
  },

  testimonialHomeBusiness: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'right',
  },

  testimonialHomeStars: {
    fontSize: 24,
    letterSpacing: 3,
    color: '#F5B301',
    fontWeight: '800',
  },

  testimonialHomeRating: {
    alignItems: 'flex-end',
    height: 58,
    marginTop: 5,
    overflow: 'hidden',
  },

  testimonialHomeQuote: {
    color: DARK,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 23,
    textAlign: 'right',
    marginTop: 2,
    paddingLeft: 8,
  },

  testimonialHomeMark: {
    position: 'absolute',
    left: 12,
    bottom: -8,
    color: '#F3F4F6',
    fontSize: 72,
    fontWeight: '900',
    lineHeight: 80,
  },

  testimonialHomeDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },

  testimonialHomeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },

  testimonialHomeDotActive: {
    width: 18,
    backgroundColor: RED,
  },

  homeServicesSection: {
    marginTop: 20,
    marginBottom: 4,
  },

  homeServicesHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 4,
  },

  homeServicesTitle: {
    color: DARK,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'right',
  },

  homeServicesSeeAll: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  homeServicesSeeAllText: {
    color: RED,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },

  homeServicesSubtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  homeServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },

  homeGridCard: {
    width: '23.5%',
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ECEDEF',
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  homeGridIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  homeGridTitle: {
    color: DARK,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  gridCard: {
    width: '48%',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 165,
  },

  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 12,
  },

  gridIconText: {
    fontSize: 21,
  },

  gridTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },

  gridDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'right',
    marginTop: 6,
  },
  serviceImageOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 10,
  },
  serviceImageBadge: {
    backgroundColor: 'rgba(17,24,39,0.78)',
    color: WHITE,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  whyDubaiFans: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 24,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  whyEyebrow: {
    color: RED,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'right',
  },
  whyTitle: {
    color: DARK,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 4,
  },
  whySubtitle: {
    color: RED,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 2,
  },
  whyDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 14,
  },
  whyCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  whyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  whyIconText: {
    fontSize: 21,
  },
  whyCardContent: {
    flex: 1,
  },
  whyCardTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
  },
  whyCardText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
    marginTop: 3,
  },
  clientsSection: {
    marginTop: 4,
    marginBottom: 10,
  },

  clientsSubtitle: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 10,
  },

  clientsHorizontal: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
  },

  clientLogoCard: {
    width: 80,
    height: 56,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.025,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  clientLogo: {
    width: '100%',
    height: '100%',
  },

  clientsDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },

  clientsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },

  clientsDotActive: {
    width: 18,
    backgroundColor: RED,
  },

  homeInfoSection: {
    marginTop: 20,
    marginBottom: 6,
  },

  homeInfoCarousel: {
    marginTop: 10,
    marginHorizontal: 20,
  },

  homeInfoCarouselContent: {
    alignItems: 'flex-start',
  },

  homeInfoSlide: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  homeInfoImage: {
    width: '100%',
    height: '100%',
  },

  workSection: {
    marginTop: 22,
    marginBottom: 8,
  },

  workSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
    marginTop: -5,
    marginBottom: 10,
    paddingHorizontal: 16,
  },

  workCarousel: {
    marginTop: 4,
  },

  workSlide: {
    width: 330,
    height: 205,
    marginRight: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  workImage: {
    width: '100%',
    height: '100%',
  },

  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 9,
    gap: 5,
  },

  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },

  carouselDotActive: {
    width: 18,
    backgroundColor: '#DC2626',
  },

  bottomSpace: {
    height: 30,
  },

  screenTitle: {
    marginBottom: 18,
    alignItems: 'flex-end',
  },

  screenTitleText: {
    color: DARK,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'right',
  },

  screenSubtitle: {
    color: MUTED,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 5,
  },

  refreshButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  refreshText: {
    color: RED,
    fontWeight: '800',
    fontSize: 12,
  },

  orderCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },

  orderRevisionSection: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },

  orderRevisionDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 12,
  },

  orderRevisionNoteBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 12,
  },

  orderRevisionNoteLabel: {
    color: DARK,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 6,
  },

  orderRevisionNote: {
    color: DARK,
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'right',
  },

  orderRevisionInput: {
    minHeight: 120,
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: DARK,
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 12,
  },

  orderRevisionButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  orderRevisionButtonDisabled: {
    opacity: 0.6,
  },

  orderRevisionButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '900',
  },

  orderDetailsBackButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },

  orderDetailsBackText: {
    color: RED,
    fontSize: 12,
    fontWeight: '800',
  },

  orderDetailsLoading: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },

  orderDetailsLoadingText: {
    color: MUTED,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },

  orderDetailsError: {
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  orderDetailsErrorText: {
    color: RED,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },

  orderDetailsCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },

  orderDetailsSection: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },

  orderDetailsSectionTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 12,
  },

  orderDetailsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  orderDetailsLabel: {
    color: MUTED,
    fontSize: 11,
    textAlign: 'right',
    flex: 1,
  },

  orderDetailsValue: {
    color: DARK,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'left',
    flex: 1,
  },

  orderDetailsTotalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 4,
  },

  orderDetailsTotalLabel: {
    color: DARK,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },

  orderDetailsTotal: {
    color: RED,
    fontSize: 17,
    fontWeight: '900',
  },

  orderDetailsNote: {
    color: DARK,
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'right',
  },

  orderDetailsEmptyHistory: {
    color: MUTED,
    fontSize: 12,
    textAlign: 'right',
  },

  orderHistoryItem: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 12,
  },

  orderHistoryDate: {
    color: MUTED,
    fontSize: 10,
    marginTop: 8,
    textAlign: 'right',
  },

  orderHistoryNote: {
    color: DARK,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'right',
  },

  orderTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  orderNumber: {
    color: DARK,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
  },

  orderService: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },

  statusBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  statusText: {
    color: RED,
    fontSize: 10,
    fontWeight: '800',
  },

  orderDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 13,
  },

  orderBottom: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  orderDate: {
    color: MUTED,
    fontSize: 11,
  },

  orderTotal: {
    color: DARK,
    fontSize: 15,
    fontWeight: '900',
  },

  campaignHint: {
    color: MUTED,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 14,
  },

  emptyState: {
    backgroundColor: WHITE,
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 10,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: '900',
  },

  emptyText: {
    color: MUTED,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  profileCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },

  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  profileAvatarText: {
    color: WHITE,
    fontSize: 21,
    fontWeight: '900',
  },

  profileMain: {
    flex: 1,
    alignItems: 'flex-end',
  },

  profileName: {
    color: DARK,
    fontSize: 16,
    fontWeight: '900',
  },

  profileEmail: {
    color: MUTED,
    fontSize: 11,
    marginTop: 3,
  },

  editSmallButton: {
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  editSmallText: {
    color: RED,
    fontWeight: '800',
    fontSize: 11,
  },

  authSecondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  authSecondaryText: {
    color: RED,
    fontSize: 13,
    fontWeight: '700',
  },
  authSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
  },
  authSwitchLabel: {
    color: MUTED,
    fontSize: 13,
  },
  authSwitchAction: {
    color: RED,
    fontSize: 13,
    fontWeight: '800',
  },

  paymentHistoryCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  paymentHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  paymentHistoryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: DARK,
    textAlign: 'right',
  },
  paymentHistorySubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    textAlign: 'right',
  },
  paymentCountBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
    backgroundColor: '#FDE8E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: RED,
  },
  paymentLoading: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paymentLoadingText: {
    fontSize: 13,
    color: MUTED,
  },
  paymentEmptyState: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  paymentEmptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: MUTED,
    marginBottom: 10,
    overflow: 'hidden',
  },
  paymentEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    marginBottom: 5,
  },
  paymentEmptyText: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 19,
  },
  paymentRetryButton: {
    marginTop: 12,
    backgroundColor: RED,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  paymentRetryText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '800',
  },
  paymentItem: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
  },
  paymentItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentServiceIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FDE8E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentServiceIconText: {
    color: RED,
    fontSize: 17,
    fontWeight: '900',
  },
  paymentItemMain: {
    flex: 1,
    marginHorizontal: 8,
  },
  paymentServiceName: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    textAlign: 'right',
  },
  paymentPackageName: {
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
    textAlign: 'right',
  },
  paymentAmountBox: {
    alignItems: 'flex-end',
    minWidth: 92,
  },
  paymentAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: DARK,
    textAlign: 'right',
  },
  paymentStatusBadge: {
    marginTop: 6,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  paymentItemBottom: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentOrderNo: {
    fontSize: 10,
    color: MUTED,
    fontWeight: '600',
  },
  paymentDate: {
    fontSize: 10,
    color: MUTED,
  },

  accountSectionTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 12,
    marginBottom: 8,
  },

  infoRow: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 53,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  infoLabel: {
    color: MUTED,
    fontSize: 12,
  },

  infoValue: {
    color: DARK,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },

  settingRow: {
    backgroundColor: WHITE,
    borderRadius: 13,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  settingLabel: {
    color: DARK,
    fontWeight: '700',
    fontSize: 13,
  },

  settingValue: {
    color: MUTED,
    fontSize: 12,
  },

  logoutButton: {
    marginTop: 20,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: RED,
    fontWeight: '900',
  },

  contactAction: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#F6F7F9',
    alignItems: 'center',
  },
  contactActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: DARK,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    alignItems: 'flex-end',
  },

  contactTitle: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '900',
  },

  contactText: {
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: 7,
  },

  whatsappText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },

  bottomNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 14,
    height: 76,
    borderRadius: 28,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#ECEDEF',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },

  navItem: {
    flex: 1,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  navIcon: {
    color: MUTED,
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
  },

  navLabel: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  navActive: {
    color: RED,
  },

  loginScreen: {
    flex: 1,
    backgroundColor: BG,
  },

  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  loginLogo: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginLogoText: {
    color: WHITE,
    fontSize: 25,
    fontWeight: '900',
  },

  loginBrand: {
    color: DARK,
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 14,
  },

  loginSubtitle: {
    color: MUTED,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 25,
  },

  loginCard: {
    backgroundColor: WHITE,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },

  sectionTitle: {
    color: DARK,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 18,
  },

  fieldLabel: {
    color: DARK,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 13,
    color: DARK,
    backgroundColor: '#FAFAFA',
    textAlign: 'right',
    fontSize: 13,
  },

  googleButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  googleButtonIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 16,
  },

  primaryButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
  },

  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: DARK,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.75,
  },

  modalScreen: {
    flex: 1,
    backgroundColor: BG,
  },

  modalHeader: {
    height: 62,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: WHITE,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: '900',
    maxWidth: '60%',
    textAlign: 'center',
  },

  modalClose: {
    color: RED,
    fontWeight: '800',
    width: 50,
    textAlign: 'left',
  },

  stepText: {
    color: MUTED,
    width: 30,
    textAlign: 'right',
  },

  formContent: {
    padding: 18,
    paddingBottom: 40,
  },

  formGroupTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 18,
    marginBottom: 6,
  },

  formField: {
    marginBottom: 4,
  },

  flowTitle: {
    color: DARK,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 18,
  },

  socialPlansContainer: {
    gap: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  socialPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  socialPlanCardFeatured: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  socialPlanBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  socialPlanBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  socialPlanName: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
  },
  socialPlanArabicName: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 2,
  },
  socialPlanIntro: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    marginTop: 10,
    marginBottom: 14,
  },
  socialPlanFeatures: {
    gap: 9,
  },
  socialPlanFeatureRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
  },
  socialPlanCheck: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: '900',
    width: 18,
    textAlign: 'center',
  },
  socialPlanFeature: {
    flex: 1,
    color: '#374151',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  socialPlanFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  socialPlanPrice: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'right',
  },
  socialPlanPeriod: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  socialSubscribeButton: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 105,
    alignItems: 'center',
  },
  socialSubscribeButtonFeatured: {
    backgroundColor: '#DC2626',
  },
  socialSubscribeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  socialSubscribeTextFeatured: {
    color: '#FFFFFF',
  },
  socialSubscriptionForm: {
    gap: 4,
  },
  selectedPlanSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  selectedPlanSummaryLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 5,
  },
  selectedPlanSummaryName: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  selectedPlanSummaryPrice: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 6,
  },
  formSectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 10,
  },
  socialSubscriptionNote: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 15,
    marginTop: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  socialSubscriptionNoteTitle: {
    color: '#C2410C',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 5,
  },
  socialSubscriptionNoteText: {
    color: '#7C2D12',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
  },

  cleanPriceCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 6,
    marginBottom: 4,
  },
  cleanPriceLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  cleanPriceValue: {
    color: '#DC2626',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 3,
  },
  cleanPriceUnit: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    flex: 1,
    color: DARK,
    fontSize: 13,
    textAlign: 'right',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    color: '#6B7280',
    fontSize: 11,
    marginLeft: 10,
  },
  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: WHITE,
    overflow: 'hidden',
  },
  dropdownOption: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionSelected: {
    backgroundColor: '#FEF2F2',
  },
  dropdownOptionText: {
    flex: 1,
    color: DARK,
    fontSize: 13,
    textAlign: 'right',
  },
  dropdownOptionTextSelected: {
    color: '#DC2626',
    fontWeight: '800',
  },
  dropdownCheck: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 10,
  },

  templateSectionTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 4,
  },
  templateSectionSubtitle: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
    marginBottom: 14,
  },
  templatesGallery: {
    gap: 14,
  },
  templateGalleryCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  templateGalleryCardSelected: {
    borderWidth: 2,
    borderColor: RED,
  },
  templateGalleryImage: {
    width: '100%',
    height: 210,
    backgroundColor: '#F3F4F6',
  },
  templateGalleryInfo: {
    padding: 14,
  },
  templateGalleryName: {
    color: DARK,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  templateGalleryDescription: {
    color: MUTED,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 10,
  },
  templateChooseButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  templateChooseButtonSelected: {
    backgroundColor: RED,
    borderColor: RED,
  },
  templateChooseText: {
    color: DARK,
    fontSize: 13,
    fontWeight: '800',
  },
  templateChooseTextSelected: {
    color: WHITE,
  },
  templatePriceTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 18,
    marginBottom: 8,
  },

  templateCard: {
    overflow: 'hidden',
    padding: 0,
  },

  templatePreview: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },

  templateInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },

  templateHint: {
    marginTop: 5,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },

  templateSelectedBadge: {
    marginHorizontal: 16,
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignSelf: 'flex-end',
  },

  templateSelectedText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },

  packageCard: {
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },

  packageCardSelected: {
    borderColor: RED,
    backgroundColor: '#FFF7F7',
  },

  packageName: {
    color: DARK,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
  },

  packageDescription: {
    color: MUTED,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },

  packagePrice: {
    color: RED,
    fontSize: 14,
    fontWeight: '900',
  },

  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },

  platformButton: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 15,
    marginBottom: 9,
  },

  platformButtonCompact: {
    width: '31%',
    minHeight: 72,
    paddingVertical: 9,
    paddingHorizontal: 4,
    marginBottom: 0,
    borderRadius: 12,
  },

  platformSelected: {
    borderColor: RED,
    backgroundColor: '#FFF7F7',
  },

  platformText: {
    color: DARK,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },

  platformSelectedText: {
    color: RED,
  },

  pricePreview: {
    backgroundColor: DARK,
    borderRadius: 16,
    padding: 17,
    marginTop: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pricePreviewLabel: {
    color: '#D1D5DB',
    fontSize: 12,
  },

  pricePreviewValue: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '900',
  },

  textArea: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    backgroundColor: WHITE,
    padding: 13,
    color: DARK,
    textAlign: 'right',
    fontSize: 13,
  },

  optionalBox: {
    backgroundColor: '#FFF7F7',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    color: MUTED,
    textAlign: 'right',
    fontSize: 12,
    marginTop: 10,
  },

  flowActions: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 20,
  },

  flowActionsPrimary: {
    flex: 1,
  },

  reviewCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 17,
  },

  reviewRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },

  reviewLabel: {
    color: MUTED,
    fontSize: 12,
  },

  reviewValue: {
    color: DARK,
    fontSize: 12,
    fontWeight: '800',
    maxWidth: '70%',
    textAlign: 'right',
  },

  reviewTotal: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
  },

  reviewTotalLabel: {
    color: DARK,
    fontSize: 14,
    fontWeight: '900',
  },

  mediaPickerButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginTop: 8,
  },

  mediaPickerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },

  mediaSelectedCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  mediaSelectedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 5,
    textAlign: 'right',
  },

  mediaSelectedText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
    textAlign: 'right',
  },

  reviewTotalValue: {
    color: RED,
    fontSize: 18,
    fontWeight: '900',
  },
});

export default App;
