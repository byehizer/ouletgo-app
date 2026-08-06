import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLogistics, type LogisticsPreference } from '../../context/LogisticsContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';

interface LogisticsModalSheetProps {
  visible: boolean;
  onClose: () => void;
}

type SheetView = 'SELECT' | 'ADD_ADDRESS' | 'LOGIN_PROMPT';

export function LogisticsModalSheet({ visible, onClose }: LogisticsModalSheetProps) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const {
    preference,
    addresses,
    pickupPoints,
    loading,
    setPreference,
    addAddress,
  } = useLogistics();

  const [currentView, setCurrentView] = useState<SheetView>('SELECT');

  // Estado del formulario de dirección
  const [addrName, setAddrName] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrNumber, setAddrNumber] = useState('');
  const [addrApartment, setAddrApartment] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSelectPickup = async (pointId: string, name: string, address: string) => {
    await setPreference({
      type: 'PICKUP',
      referenceId: pointId,
      label: `${name} (${address})`,
    });
    onClose();
  };

  const handleSelectDelivery = async (addressId: string, street: string, number: string) => {
    await setPreference({
      type: 'DELIVERY',
      referenceId: addressId,
      label: `${street} ${number}`,
    });
    onClose();
  };

  const handleAddAddressPress = () => {
    if (!isAuthenticated) {
      setCurrentView('LOGIN_PROMPT');
    } else {
      setCurrentView('ADD_ADDRESS');
    }
  };

  const handleSaveAddress = async () => {
    setFormError(null);
    if (!addrName.trim() || !addrStreet.trim() || !addrNumber.trim() || !addrPostalCode.trim() || !addrCity.trim()) {
      setFormError('Completá todos los campos obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const created = await addAddress({
        name: addrName.trim(),
        street: addrStreet.trim(),
        number: addrNumber.trim(),
        apartment: addrApartment.trim() || undefined,
        postalCode: addrPostalCode.trim(),
        city: addrCity.trim(),
        latitude: -34.6037, // Coordenadas por defecto (CABA)
        longitude: -58.3816,
        isDefault: addresses.length === 0,
      });

      // Seleccionar automáticamente la dirección creada
      await handleSelectDelivery(created.id, created.street, created.number);
      // Limpiar formulario y resetear vista
      resetForm();
    } catch (err) {
      setFormError('Ocurrió un error al guardar la dirección.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setAddrName('');
    setAddrStreet('');
    setAddrNumber('');
    setAddrApartment('');
    setAddrPostalCode('');
    setAddrCity('');
    setFormError(null);
    setCurrentView('SELECT');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop pulsable */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Contenido del Sheet */}
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            {currentView !== 'SELECT' ? (
              <Pressable onPress={resetForm} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color="#0F172A" />
              </Pressable>
            ) : <View style={{ width: 24 }} />}

            <Text style={styles.headerTitle}>
              {currentView === 'SELECT' && 'Opciones de entrega'}
              {currentView === 'ADD_ADDRESS' && 'Nueva dirección'}
              {currentView === 'LOGIN_PROMPT' && 'Iniciar sesión'}
            </Text>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#475569" />
            </Pressable>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2B8FD4" />
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 550 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {currentView === 'SELECT' && (
                <View style={{ paddingBottom: 16 }}>
                  {/* PUNTOS DE RETIRO */}
                  <Text style={styles.sectionTitle}>Puntos de retiro OutletGo (Palermo / Villa Crespo)</Text>
                  {pickupPoints.map((point) => {
                    const isSelected = preference?.type === 'PICKUP' && preference?.referenceId === point.id;
                    return (
                      <Pressable
                        key={point.id}
                        onPress={() => handleSelectPickup(point.id, point.name, point.address)}
                        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      >
                        <View style={styles.optionInfo}>
                          <Ionicons name="pin" size={20} color={isSelected ? '#2B8FD4' : '#64748B'} />
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.optionName}>{point.name}</Text>
                            <Text style={styles.optionSub}>{point.address} · {point.businessHours}</Text>
                          </View>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color="#2B8FD4" />}
                      </Pressable>
                    );
                  })}

                  {/* DIRECCIONES DE ENVIO */}
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionTitle}>Enviar a Domicilio</Text>
                    {isAuthenticated ? (
                      addresses.length === 0 ? (
                        <Text style={styles.emptyText}>No tenés direcciones guardadas aún.</Text>
                      ) : (
                        addresses.map((addr) => {
                          const isSelected = preference?.type === 'DELIVERY' && preference?.referenceId === addr.id;
                          return (
                            <Pressable
                              key={addr.id}
                              onPress={() => handleSelectDelivery(addr.id, addr.street, addr.number)}
                              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                            >
                              <View style={styles.optionInfo}>
                                <Ionicons name="home" size={20} color={isSelected ? '#2B8FD4' : '#64748B'} />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                  <Text style={styles.optionName}>{addr.name}</Text>
                                  <Text style={styles.optionSub}>
                                    {addr.street} {addr.number}
                                    {addr.apartment ? `, Depto ${addr.apartment}` : ''} · {addr.city}
                                  </Text>
                                </View>
                              </View>
                              {isSelected && <Ionicons name="checkmark-circle" size={20} color="#2B8FD4" />}
                            </Pressable>
                          );
                        })
                      )
                    ) : (
                      <View style={styles.guestWarningCard}>
                        <Ionicons name="lock-closed" size={20} color="#94A3B8" />
                        <Text style={styles.guestWarningText}>
                          Iniciá sesión para utilizar tus direcciones de envío.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* BOTON NUEVA DIRECCION */}
                  <Pressable onPress={handleAddAddressPress} style={styles.addAddressButton}>
                    <Ionicons name="add-circle-outline" size={20} color="#2B8FD4" />
                    <Text style={styles.addAddressText}>Agregar nueva dirección</Text>
                  </Pressable>
                </View>
              )}

              {currentView === 'ADD_ADDRESS' && (
                <View style={{ paddingHorizontal: 4, paddingBottom: 16 }}>
                  {formError && (
                    <View style={styles.formErrorContainer}>
                      <Text style={styles.formErrorText}>{formError}</Text>
                    </View>
                  )}

                  <Text style={styles.fieldLabel}>Nombre de la dirección *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Casa, Trabajo, Novio/a"
                    placeholderTextColor="#94A3B8"
                    value={addrName}
                    onChangeText={setAddrName}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.fieldLabel}>Calle *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej: Av. Corrientes"
                        placeholderTextColor="#94A3B8"
                        value={addrStreet}
                        onChangeText={setAddrStreet}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Número *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej: 1234"
                        placeholderTextColor="#94A3B8"
                        value={addrNumber}
                        onChangeText={setAddrNumber}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Piso / Depto</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej: 3B"
                        placeholderTextColor="#94A3B8"
                        value={addrApartment}
                        onChangeText={setAddrApartment}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Cód. Postal *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej: 1043"
                        placeholderTextColor="#94A3B8"
                        value={addrPostalCode}
                        onChangeText={setAddrPostalCode}
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Ciudad *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: CABA"
                    placeholderTextColor="#94A3B8"
                    value={addrCity}
                    onChangeText={setAddrCity}
                  />

                  {/* BOTÓN UNICO DE GUARDAR DIRECCIÓN CON TOUCHABLE OPACITY */}
                  <TouchableOpacity
                    onPress={handleSaveAddress}
                    disabled={saving}
                    activeOpacity={0.8}
                    style={styles.saveBtn}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.saveBtnText}>Guardar y seleccionar dirección</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {currentView === 'LOGIN_PROMPT' && (
                <View style={styles.loginPromptContainer}>
                  <Ionicons name="heart" size={48} color="#E11D48" style={{ marginBottom: 12 }} />
                  <Text style={styles.loginTitle}>Iniciá sesión para continuar</Text>
                  <Text style={styles.loginDesc}>
                    Para agregar direcciones de envío personalizadas y guardarlas en tu cuenta, es necesario que ingreses a tu perfil.
                  </Text>
                  <Pressable
                    onPress={() => {
                      onClose();
                      router.push('/(auth)/login?redirect=/(tabs)/');
                    }}
                    style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.9 }]}
                  >
                    <Text style={styles.loginBtnText}>Iniciar sesión</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: '#2B8FD4',
    backgroundColor: '#E8F4FD',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  guestWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    marginBottom: 10,
  },
  guestWarningText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 10,
    flex: 1,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B8FD4',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B8FD4',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    height: 50,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  formErrorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  formErrorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  loginPromptContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  loginDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: '#2B8FD4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
