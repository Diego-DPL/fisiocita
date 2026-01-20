import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image } from 'react-native';
import { activitiesService, Activity } from '../../services/apiServices';

export default function AvailableActivitiesScreen({ navigation }: any) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await activitiesService.getAvailable();
      setActivities(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  }, []);

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return '#34C759';
      case 'INTERMEDIATE':
        return '#FF9500';
      case 'ADVANCED':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    const map: any = {
      BEGINNER: 'Principiante',
      INTERMEDIATE: 'Intermedio',
      ADVANCED: 'Avanzado',
    };
    return map[difficulty] || difficulty;
  };

  const getTypeText = (type: string) => {
    const map: any = {
      PILATES: 'Pilates',
      YOGA: 'Yoga',
      REHABILITATION: 'Rehabilitación',
      FUNCTIONAL_TRAINING: 'Entrenamiento Funcional',
      OTHER: 'Otro',
    };
    return map[type] || type;
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ActivityDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>{getTypeIcon(item.type)}</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.type}>{getTypeText(item.type)}</Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.difficultyText}>{getDifficultyText(item.difficulty)}</Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duración</Text>
            <Text style={styles.detailValue}>{item.durationMinutes} min</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Max. Participantes</Text>
            <Text style={styles.detailValue}>{item.maxParticipants}</Text>
          </View>
          {item.price && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Precio</Text>
              <Text style={styles.detailValue}>{item.price}€</Text>
            </View>
          )}
        </View>

        {item.physiotherapist && (
          <Text style={styles.instructor}>
            Instructor: {item.physiotherapist.user.firstName} {item.physiotherapist.user.lastName}
          </Text>
        )}

        {item.schedules && item.schedules.length > 0 && (
          <View style={styles.schedules}>
            <Text style={styles.schedulesTitle}>Horarios:</Text>
            {item.schedules.slice(0, 2).map((schedule, index) => (
              <Text key={index} style={styles.scheduleItem}>
                • {schedule.dayOfWeek}: {schedule.startTime} - {schedule.endTime}
              </Text>
            ))}
            {item.schedules.length > 2 && (
              <Text style={styles.moreSchedules}>+{item.schedules.length - 2} más</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookActivity', { activityId: item.id })}
        >
          <Text style={styles.bookButtonText}>Reservar Plaza</Text>
        </TouchableOpacity>
      </TouchableOpacity>
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
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay actividades disponibles</Text>
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
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
    fontSize: 40,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  type: {
    fontSize: 14,
    color: '#666',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 10,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  instructor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  schedules: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  schedulesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  scheduleItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  moreSchedules: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
