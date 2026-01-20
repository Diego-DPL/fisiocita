import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { patientsService, ActivityBooking } from '../../services/apiServices';
import { activitiesService } from '../../services/apiServices';

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState<ActivityBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const profileResponse = await patientsService.getMyProfile();
      const patientId = profileResponse.data.id;
      
      const response = await patientsService.getActivityBookings(patientId);
      setBookings(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, []);

  const handleCancelBooking = (activityId: string, bookingId: string, activityName: string) => {
    Alert.alert(
      'Cancelar Reserva',
      `¿Estás seguro de que deseas cancelar tu reserva para "${activityName}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          style: 'destructive',
          onPress: async () => {
            try {
              await activitiesService.cancelBooking(activityId, bookingId);
              Alert.alert('Éxito', 'Reserva cancelada correctamente');
              loadBookings();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Error al cancelar la reserva');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FF9500';
      case 'CONFIRMED':
        return '#007AFF';
      case 'ATTENDED':
        return '#34C759';
      case 'CANCELLED':
        return '#FF3B30';
      case 'NO_SHOW':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: any = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      ATTENDED: 'Asistida',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'No asistió',
    };
    return statusMap[status] || status;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    const icons: any = {
      PILATES: '🧘',
      YOGA: '🧘‍♀️',
      REHABILITATION: '🏥',
      FUNCTIONAL_TRAINING: '💪',
      OTHER: '🏃',
    };
    return icons[type] || '🏃';
  };

  const renderBooking = ({ item }: { item: ActivityBooking }) => {
    const canCancel = item.status !== 'CANCELLED' && item.status !== 'ATTENDED';
    const sessionDate = new Date(item.sessionDate);
    const isPast = sessionDate < new Date();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>{item.activity ? getTypeIcon(item.activity.type) : '🏃'}</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.activityName}>{item.activity?.name || 'Actividad'}</Text>
            <Text style={styles.sessionDate}>{formatDateTime(item.sessionDate)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {item.activity && (
          <View style={styles.activityDetails}>
            <Text style={styles.activityType}>{item.activity.type}</Text>
            <Text style={styles.activityDifficulty}>{item.activity.difficulty}</Text>
            <Text style={styles.activityDuration}>{item.activity.durationMinutes} min</Text>
          </View>
        )}

        {item.notes && (
          <Text style={styles.notes}>Notas: {item.notes}</Text>
        )}

        {canCancel && !isPast && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(
              item.activityId,
              item.id,
              item.activity?.name || 'esta actividad'
            )}
          >
            <Text style={styles.cancelButtonText}>Cancelar Reserva</Text>
          </TouchableOpacity>
        )}

        {isPast && item.status === 'CONFIRMED' && (
          <Text style={styles.pastNotice}>Esta sesión ya pasó</Text>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tienes reservas de actividades</Text>
            <Text style={styles.emptySubtext}>
              Explora las actividades disponibles y reserva tu plaza
            </Text>
          </View>
        }
      />
    </View>
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
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 32,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activityDetails: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  activityType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activityDifficulty: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activityDuration: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  pastNotice: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
});
