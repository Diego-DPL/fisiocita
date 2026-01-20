import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { appointmentsService, physiotherapistsService, calendarService, Physiotherapist } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export default function CreateAppointmentScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [physiotherapists, setPhysiotherapists] = useState<Physiotherapist[]>([]);
  const [selectedPhysio, setSelectedPhysio] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPhysiotherapists();
  }, []);

  useEffect(() => {
    if (selectedPhysio && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedPhysio, selectedDate]);

  const loadPhysiotherapists = async () => {
    try {
      setLoading(true);
      console.log('📋 Cargando fisioterapeutas...');
      const response = await physiotherapistsService.getAll();
      console.log('✅ Fisioterapeutas cargados:', response.data.length);
      setPhysiotherapists(response.data);
    } catch (error: any) {
      console.error('❌ Error cargando fisioterapeutas:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al cargar fisioterapeutas');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedPhysio) return;

    try {
      setLoadingSlots(true);
      console.log('🕐 Cargando slots para:', selectedPhysio, 'Fecha:', selectedDate.toISOString().split('T')[0]);
      const response = await calendarService.getAvailableSlots(
        selectedPhysio,
        selectedDate.toISOString().split('T')[0],
        60 // Duration in minutes
      );
      console.log('✅ Slots disponibles:', response.data.length);
      setAvailableSlots(response.data);
      setSelectedSlot(null);
    } catch (error: any) {
      console.error('❌ Error cargando slots:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al cargar horarios disponibles');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedPhysio || !selectedSlot || !reason.trim()) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setSubmitting(true);
      
      const startDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.startTime.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = selectedSlot.endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      await appointmentsService.create({
        patientId: '', // El backend puede obtenerlo del token o lo asignamos desde el perfil
        physiotherapistId: selectedPhysio,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Cita Creada',
        'Tu cita ha sido agendada exitosamente',
        [
          {
            text: 'Ver mis citas',
            onPress: () => navigation.navigate('MyAppointments'),
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al crear la cita');
    } finally {
      setSubmitting(false);
    }
  };

  const getNextDays = (count: number = 7) => {
    const days: Date[] = [];
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecciona Fisioterapeuta</Text>
        {physiotherapists.map((physio) => (
          <TouchableOpacity
            key={physio.id}
            style={[
              styles.physioCard,
              selectedPhysio === physio.id && styles.physioCardSelected,
            ]}
            onPress={() => setSelectedPhysio(physio.id)}
          >
            <View style={styles.physioInfo}>
              <Text style={styles.physioName}>
                {physio.user.firstName} {physio.user.lastName}
              </Text>
              {physio.specialization && (
                <Text style={styles.specialty}>
                  {physio.specialization}
                </Text>
              )}
            </View>
            {selectedPhysio === physio.id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {selectedPhysio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona Fecha</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.datesContainer}>
              {getNextDays(14).map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    selectedDate.toDateString() === date.toDateString() && styles.dateCardSelected,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dateText,
                    selectedDate.toDateString() === date.toDateString() && styles.dateTextSelected,
                  ]}>
                    {isToday(date) ? 'Hoy' : formatDateShort(date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {selectedPhysio && selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horarios Disponibles</Text>
          {loadingSlots ? (
            <View style={styles.loadingSlots}>
              <ActivityIndicator color="#007AFF" />
              <Text style={styles.loadingText}>Cargando horarios...</Text>
            </View>
          ) : availableSlots.length === 0 ? (
            <View style={styles.emptySlots}>
              <Text style={styles.emptyText}>No hay horarios disponibles para esta fecha</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.slotCard,
                    selectedSlot?.startTime === slot.startTime && styles.slotCardSelected,
                    !slot.available && styles.slotCardDisabled,
                  ]}
                  onPress={() => slot.available && setSelectedSlot(slot)}
                  disabled={!slot.available}
                >
                  <Text style={[
                    styles.slotTime,
                    selectedSlot?.startTime === slot.startTime && styles.slotTimeSelected,
                    !slot.available && styles.slotTimeDisabled,
                  ]}>
                    {slot.startTime}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {selectedSlot && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Motivo de la Cita *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Dolor de espalda, rehabilitación..."
              value={reason}
              onChangeText={setReason}
              maxLength={200}
            />
            <Text style={styles.characterCount}>{reason.length}/200</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas Adicionales (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Información adicional que el fisioterapeuta deba conocer..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{notes.length}/500</Text>
          </View>

          <TouchableOpacity
            style={[styles.createButton, submitting && styles.createButtonDisabled]}
            onPress={handleCreateAppointment}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.createButtonText}>Agendar Cita</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  physioCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  physioCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FF',
  },
  physioInfo: {
    flex: 1,
  },
  physioName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  specialty: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  checkmark: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 15,
  },
  dateCard: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 90,
  },
  dateCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  dateTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  loadingSlots: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptySlots: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
  },
  slotCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  slotCardDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.5,
  },
  slotTime: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  slotTimeSelected: {
    color: 'white',
    fontWeight: '600',
  },
  slotTimeDisabled: {
    color: '#999',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  createButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});
