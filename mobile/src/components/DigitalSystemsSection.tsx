import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getServiceBySlug } from '../api/client';

type DigitalSystem = {
  id: 'am lak' | 'clinic';
  title: string;
  englishTitle: string;
  subtitle: string;
  icon: string;
  description: string;
  features: string[];
};

type Props = {
  serviceId?: string;
  token: string;
  onCreated?: () => Promise<void>;
};

const AMLAK_IMAGES = [
  require('../../assets/amlak-01.png'),
  require('../../assets/amlak-02.png'),
  require('../../assets/amlak-03.png'),
  require('../../assets/amlak-04.png'),
  require('../../assets/amlak-05.png'),
  require('../../assets/amlak-06.png'),
];

const CLINIC_IMAGES = [
  require('../../assets/clinic-01.png'),
  require('../../assets/clinic-02.png'),
  require('../../assets/clinic-03.png'),
  require('../../assets/clinic-04.png'),
  require('../../assets/clinic-05.png'),
  require('../../assets/clinic-06.png'),
];

const SYSTEMS: DigitalSystem[] = [
  {
    id: 'am lak',
    title: 'AMLAK OS',
    englishTitle: 'AMLAK OS',
    subtitle: 'نظام متكامل لإدارة العقارات والملاك',
    icon: '🏢',
    description:
      'منصة متكاملة لإدارة العقارات والوحدات والملاك والمستأجرين والعقود والمدفوعات والصيانة والقضايا القانونية من مكان واحد.',
    features: [
      'إدارة العقارات والوحدات',
      'الملّاك والمستأجرون',
      'العقود والتجديدات',
      'المدفوعات والتحصيل',
      'القضايا القانونية',
      'طلبات الصيانة',
      'إشعارات ذكية',
      'التحكم في الصلاحيات',
    ],
  },
  {
    id: 'clinic',
    title: 'Clinic OS',
    englishTitle: 'Clinic OS',
    subtitle: 'نظام إدارة عيادتك والمراكز الطبية',
    icon: '🏥',
    description:
      'نظام إداري ذكي يساعد العيادات والمراكز الطبية على إدارة المرضى والحجوزات والماليات والمخزون والتواصل مع المرضى.',
    features: [
      'الإدخال الصوتي والذكاء اللغوي',
      'تكامل واتساب المتقدم',
      'الروشتة الإلكترونية الذكية',
      'ملف المريض الذكي',
      'الحجز الإلكتروني',
      'الحسابات والماليات',
      'التقارير والتحليلات',
      'إدارة المنتجات والمخزون',
    ],
  },
];

function SystemGallery({
  images,
  title,
  description,
}: {
  images: Array<any>;
  title: string;
  description: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <View style={styles.galleryContainer}>
      <View style={styles.galleryImageWrap}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const width = event.nativeEvent.layoutMeasurement.width;
            if (!width) return;

            const index = Math.round(
              event.nativeEvent.contentOffset.x / width,
            );

            setCurrentIndex(
              Math.max(0, Math.min(index, images.length - 1)),
            );
          }}
        >
          {images.map((source, index) => (
            <View
              key={index}
              style={styles.gallerySlide}
            >
              <Text style={styles.galleryImageCounter}>
                {index + 1} / {images.length}
              </Text>

              <Image
                source={source}
                style={styles.galleryImage}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.galleryTitle}>
        {title}
      </Text>

      <Text style={styles.galleryText}>
        {description}
      </Text>

      <View style={styles.galleryDots}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.galleryDot,
              index === currentIndex && styles.galleryDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function DigitalSystemsSection({
  serviceId,
  token,
  onCreated,
}: Props) {
  const [activeSystem, setActiveSystem] = useState<DigitalSystem | null>(
    null,
  );

  const [clinicModalVisible, setClinicModalVisible] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function openAmlak() {
    try {
      await Linking.openURL('https://amlakly.app/register');
    } catch {
      Alert.alert('تعذر فتح الرابط', 'يرجى المحاولة مرة أخرى.');
    }
  }

  function openClinicForm() {
    setClinicName('');
    setDoctorName('');
    setPhone('');
    setClinicModalVisible(true);
  }

  async function submitClinicDemo() {
    if (!clinicName.trim()) {
      Alert.alert('بيانات مطلوبة', 'أدخل اسم العيادة أو المركز الطبي.');
      return;
    }

    if (!doctorName.trim()) {
      Alert.alert('بيانات مطلوبة', 'أدخل اسم المسؤول أو الطبيب.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('بيانات مطلوبة', 'أدخل رقم التواصل.');
      return;
    }

    setLoading(true);

    try {
      let resolvedServiceId = serviceId;

      if (!resolvedServiceId) {
        const clinicService = await getServiceBySlug<{
          id: string;
          slug: string;
          isActive?: boolean;
        }>('clinic-os');

        resolvedServiceId = clinicService.id;
      }

      if (!resolvedServiceId) {
        throw new Error('تعذر العثور على خدمة Clinic OS.');
      }

      const response = await fetch(
        'https://api.mtuaefans.com/api/orders',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceId: resolvedServiceId,
            formData: {
              system: 'Clinic OS',
              clinicName: clinicName.trim(),
              responsibleName: doctorName.trim(),
              contactPhone: phone.trim(),
              requestType: 'demo',
            },
            customerNote: [
              'طلب عرض تجريبي - Clinic OS',
              `اسم العيادة: ${clinicName.trim()}`,
              `اسم المسؤول/الطبيب: ${doctorName.trim()}`,
              `رقم التواصل: ${phone.trim()}`,
              'بدون دفع',
            ].join('\n'),
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || 'تعذر إرسال طلب العرض التجريبي.',
        );
      }

      setClinicModalVisible(false);

      Alert.alert(
        'تم إرسال الطلب ✓',
        'تم تسجيل طلب العرض التجريبي وسيقوم فريق Dubai Fans بالتواصل معك.',
        [
          {
            text: 'حسنًا',
            onPress: async () => {
              if (onCreated) {
                await onCreated();
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'تعذر إرسال الطلب',
        error instanceof Error
          ? error.message
          : 'حدث خطأ غير متوقع.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionEyebrow}>DIGITAL SOLUTIONS</Text>

            <Text style={styles.sectionTitle}>
              أنظمة رقمية لإدارة الشركات
            </Text>

            <Text style={styles.sectionSubtitle}>
              حلول متخصصة لإدارة أعمالك بشكل أذكى وأكثر احترافية
            </Text>
          </View>
        </View>

        <View style={styles.systemsGrid}>
          {SYSTEMS.map((system) => {
            const isAmlak = system.id === 'am lak';

            return (
              <View key={system.id} style={styles.systemCard}>
                <View style={styles.systemBadge}>
                  <Text style={styles.systemBadgeText}>
                    {isAmlak ? 'PROPERTY OS' : 'MEDICAL OS'}
                  </Text>
                </View>

                <Text style={styles.systemEnglish}>
                  {system.englishTitle}
                </Text>

                <Text style={styles.systemTitle}>
                  {system.subtitle}
                </Text>

                <Text
                  style={styles.systemDescription}
                  numberOfLines={4}
                >
                  {system.description}
                </Text>

                <View style={styles.features}>
                  {system.features.slice(0, 4).map((feature) => (
                    <View
                      key={feature}
                      style={styles.featureRow}
                    >
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>

                      <Text
                        style={styles.featureText}
                        numberOfLines={1}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setActiveSystem(system)}
                >
                  <Text style={styles.secondaryButtonText}>
                    تعرف على النظام
                  </Text>

                  <Text style={styles.arrow}>←</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      {/* تفاصيل النظام */}
      <Modal
        visible={!!activeSystem}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveSystem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailsModal}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailsContent}
            >
              <View style={styles.modalHeader}>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setActiveSystem(null)}
                >
                  <Text style={styles.closeText}>×</Text>
                </Pressable>

                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalEnglish}>
                    {activeSystem?.englishTitle}
                  </Text>

                  <Text style={styles.modalTitle}>
                    {activeSystem?.subtitle}
                  </Text>
                </View>

                <View style={styles.modalIcon}>
                  <Text style={styles.modalIconText}>
                    {activeSystem?.icon}
                  </Text>
                </View>
              </View>

              {/* معرض صور النظام */}
              {activeSystem?.id === 'am lak' ? (
                <SystemGallery
                  images={AMLAK_IMAGES}
                  title="شاهد AMLAK OS من الداخل"
                  description="استعرض واجهة النظام ومختلف أقسام إدارة العقارات."
                />
              ) : (
                <SystemGallery
                  images={CLINIC_IMAGES}
                  title="شاهد Clinic OS من الداخل"
                  description="استعرض واجهة النظام ومختلف أدوات إدارة العيادات."
                />
              )}

              <Text style={styles.detailsHeading}>
                أهم المزايا
              </Text>

              <View style={styles.detailsFeatures}>
                {activeSystem?.features.map((feature, index) => (
                  <View
                    key={feature}
                    style={styles.detailFeatureCard}
                  >
                    <View style={styles.detailNumber}>
                      <Text style={styles.detailNumberText}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </View>

                    <Text style={styles.detailFeatureText}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={styles.modalPrimaryButton}
                onPress={() => {
                  if (activeSystem?.id === 'am lak') {
                    openAmlak();
                  } else {
                    setActiveSystem(null);
                    openClinicForm();
                  }
                }}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {activeSystem?.id === 'am lak'
                    ? 'ابدأ تجربتك المجانية الآن'
                    : 'احجز عرضًا تجريبيًا'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Clinic OS Demo Form */}
      <Modal
        visible={clinicModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!loading) {
            setClinicModalVisible(false);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.formModal}>
            <View style={styles.modalHeader}>
              <Pressable
                style={styles.closeButton}
                disabled={loading}
                onPress={() => setClinicModalVisible(false)}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>

              <View style={styles.modalHeaderText}>
                <Text style={styles.modalEnglish}>
                  CLINIC OS
                </Text>

                <Text style={styles.modalTitle}>
                  احجز عرضًا تجريبيًا
                </Text>
              </View>

              <View style={styles.modalIcon}>
                <Text style={styles.modalIconText}>🏥</Text>
              </View>
            </View>

            <Text style={styles.formIntro}>
              اترك بياناتك وسيتواصل معك فريق Dubai Fans
              لعرض النظام ومناقشة احتياجات عيادتك.
            </Text>

            <Text style={styles.inputLabel}>
              اسم العيادة أو المركز الطبي
            </Text>

            <TextInput
              value={clinicName}
              onChangeText={setClinicName}
              placeholder="مثال: عيادة دبي الطبية"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              textAlign="right"
            />

            <Text style={styles.inputLabel}>
              اسم المسؤول أو الطبيب
            </Text>

            <TextInput
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="أدخل الاسم"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              textAlign="right"
            />

            <Text style={styles.inputLabel}>
              رقم التواصل
            </Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+971 5X XXX XXXX"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              keyboardType="phone-pad"
              textAlign="right"
            />

            <View style={styles.noPaymentBox}>
              <Text style={styles.noPaymentIcon}>✓</Text>

              <Text style={styles.noPaymentText}>
                لا يوجد دفع الآن — الطلب مخصص لحجز العرض التجريبي فقط.
              </Text>
            </View>

            <Pressable
              style={[
                styles.modalPrimaryButton,
                loading && styles.disabledButton,
              ]}
              disabled={loading}
              onPress={submitClinicDemo}
            >
              <Text style={styles.modalPrimaryButtonText}>
                {loading ? 'جاري الإرسال...' : 'إرسال طلب العرض'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  sectionTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },

  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CC0000',
    letterSpacing: 1.2,
    textAlign: 'right',
    marginBottom: 5,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
  },

  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 19,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 5,
  },

  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionIconText: {
    fontSize: 22,
  },

  systemsGrid: {
    gap: 14,
  },

  systemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  systemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  systemIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  systemIconText: {
    fontSize: 28,
  },

  systemBadge: {
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  systemBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  systemEnglish: {
    color: '#CC0000',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'right',
  },

  systemTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 27,
    marginTop: 4,
    textAlign: 'right',
  },

  systemDescription: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 9,
    textAlign: 'right',
  },

  features: {
    marginTop: 15,
    gap: 9,
  },

  featureRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  checkCircle: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  checkText: {
    color: '#CC0000',
    fontSize: 12,
    fontWeight: '900',
  },

  featureText: {
    flex: 1,
    color: '#374151',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },

  secondaryButton: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 17,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },

  arrow: {
    color: '#CC0000',
    fontSize: 18,
    marginRight: 8,
  },

  primaryButton: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: '#CC0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
    paddingHorizontal: 12,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },

  detailsModal: {
    maxHeight: '92%',
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },

  formModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 28,
  },

  detailsContent: {
    padding: 20,
    paddingBottom: 35,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    color: '#111827',
    fontSize: 27,
    lineHeight: 30,
  },

  modalHeaderText: {
    flex: 1,
    paddingHorizontal: 12,
  },

  modalEnglish: {
    color: '#CC0000',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
  },

  modalTitle: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 3,
  },

  modalIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalIconText: {
    fontSize: 27,
  },

  galleryPlaceholder: {
    minHeight: 190,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    marginBottom: 22,
  },

  galleryIcon: {
    fontSize: 42,
    color: '#CC0000',
  },

  galleryTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center',
  },

  galleryText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
  },

  detailsHeading: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 12,
  },

  detailsFeatures: {
    gap: 9,
  },

  detailFeatureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 13,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  detailNumber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 11,
  },

  detailNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  detailFeatureText: {
    flex: 1,
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },

  modalPrimaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#CC0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  formIntro: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
    marginBottom: 16,
  },

  inputLabel: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    color: '#111827',
    paddingHorizontal: 15,
    fontSize: 13,
  },

  noPaymentBox: {
    marginTop: 15,
    padding: 12,
    borderRadius: 15,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  noPaymentIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '900',
    marginLeft: 8,
  },

  noPaymentText: {
    flex: 1,
    color: '#166534',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
  },

  galleryContainer: {
    marginTop: 18,
    marginBottom: 8,
  },
  galleryImageWrap: {
    width: '100%',
    height: 230,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F4F5F7',
  },
  gallerySlide: {
    width: 310,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryImageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  galleryDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 5,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  galleryDotActive: {
    width: 20,
    backgroundColor: '#E21B23',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
