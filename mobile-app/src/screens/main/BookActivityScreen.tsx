import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { activitiesService, Activity, ActivitySchedule } from '../../services/apiServices';

export default function BookActivityScreen({ route, navigation }: any) {
  const { activityId } = route.params;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ActivitySchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [participantsCount, setParticipantsCount] = useState<number>(0);

  useEffect(() => {
    loadActivityDetails();
  }, [activityId]);

  const loadActivityDetails = async () => {
    try {
      setLoading(true);
      const response = await activitiesService.getById(activityId);
      setActivity(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al cargar la actividad');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (date: Date) => {
    if (!activity) return;
    
    try {
      const response = await activitiesService.countParticipants(activity.id, date.toISOString());
      setParticipantsCount(response.data.count);
    } catch (error: any) {
      console.error('Error checking availability:', error);
    }
  };

  useEffect(() => {
    if (selectedSchedule && selectedDate) {
      checkAvailability(selectedDate);
    }
  }, [selectedDate, selectedSchedule]);

  const handleBookActivity = async () => {
    if (!activity || !selectedSchedule) {
      Alert.alert('Error', 'Por favor selecciona un horario');
      return;
    }

    if (participantsCount >= activity.maxParticipants) {
      Alert.alert('No disponible', 'Esta sesión ya está completa');
      return;
    }

    try {
      setSubmitting(true);
      await activitiesService.bookActivity(activity.id, {
        sessionDate: selectedDate.toISOString(),
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Reserva Confirmada',
        `Tu plaza para ${activity.name} ha sido reservada exitosamente.`,
        [
          {
            text: 'Ver mis reservas',
            onPress: () => navigation.navigate('MyBookings'),
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al reservar la actividad');
    } finally {
      setSubmitting(false);
    }
  };

  const getNextAvailableDates = () => {
    if (!selectedSchedule) return [];
    
    const dates: Date[] = [];
    const today = new Date();
    const daysMap: any = {
      MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, 
      FRIDAY: 5, SATURDAY: 6, SUNDAY: 0
    };
    
    const targetDay = daysMap[selectedSchedule.dayOfWeek];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() === targetDay) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  const getDayName = (dayOfWeek: string) => {
    const days: any = {
      MONDAY: 'Lunes',
      TUESDAY: 'Martes',
      WEDNESDAY: 'Miércoles',
      THURSDAY: 'Jueves',
      FRIDAY: 'Viernes',
      SATURDAY: 'Sábado',
      SUNDAY: 'Domingo',
    };
    return days[dayOfWeek] || dayOfWeek;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.centered}>
        <Text>Actividad no encontrada</Text>
      </View>
    );
  }

  const availableDates = getNextAvailableDates();
  const spotsLeft = activity.maxParticipants - participantsCount;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.activityName}>{activity.name}</Text>
        <Text style={styles.activityType}>{activity.type}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecciona un Horario</Text>
        {activity.schedules?.map((schedule) => (
          <TouchableOpacity
            key={schedule.id}
            style={[
              styles.scheduleCard,
              selectedSchedule?.id === schedule.id && styles.scheduleCardSelected,
            ]}
            onPress={() => {
              setSelectedSchedule(schedule);
              // Set first available date for this schedule
              const dates = getNextAvailableDates();
              if (dates.length > 0) {
                setSelectedDate(dates[0]);
              }
            }}
          >
            <Text style={styles.scheduleDayOfWeek}>{getDayName(schedule.dayOfWeek)}</Text>
            <Text style={styles.scheduleTime}>
              {schedule.startTime} - {schedule.endTime}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedSchedule && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona una Fecha</Text>
          <View style={styles.datesContainer}>
            {availableDates.map((date, index) => (
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
                  {formatDate(date)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {selectedSchedule && selectedDate && (
        <View style={styles.section}>
          <View style={styles.availabilityCard}>
            <Text style={styles.availabilityTitle}>Disponibilidad</Text>
            <View style={styles.availabilityInfo}>
              <Text style={[
                styles.spotsLeft,
                spotsLeft <= 3 && styles.spotsLimitedWarning,
                spotsLeft === 0 && styles.spotsFullWarning,
              ]}>
                {spotsLeft} {spotsLeft === 1 ? 'plaza disponible' : 'plazas disponibles'}
              </Text>
              <Text style={styles.maxParticipants}>
                de {activity.maxParticipants} totales
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notas (opcional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Agrega cualquier información relevante..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.characterCount}>{notes.length}/500</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.instructorLabel}>Instructor</Text>
        {activity.physiotherapist && (
          <Text style={styles.instructorName}>
            {activity.physiotherapist.user.firstName} {activity.physiotherapist.user.lastName}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.bookButton,
          (!selectedSchedule || spotsLeft === 0 || submitting) && styles.bookButtonDisabled,
        ]}
        onPress={handleBookActivity}
        disabled={!selectedSchedule || spotsLeft === 0 || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.bookButtonText}>
            {spotsLeft === 0 ? 'Sesión Completa' : 'Confirmar Reserva'}
          </Text>
        )}
      </TouchableOpacity>

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
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 20,
  },
  activityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  activityType: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
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
  scheduleCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  scheduleCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FF',
  },
  scheduleDayOfWeek: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#666',
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dateCard: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 100,
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
  availabilityCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spotsLeft: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  spotsLimitedWarning: {
    color: '#FF9500',
  },
  spotsFullWarning: {
    color: '#FF3B30',
  },
  maxParticipants: {
    fontSize: 14,
    color: '#666',
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  instructorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});
