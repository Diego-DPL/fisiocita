import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    await logout();
  };

  const getRoleDisplayName = (role: string) => {
    const roles: any = {
      SUPER_ADMIN: 'Super Administrador',
      CLINIC_ADMIN: 'Administrador',
      PHYSIOTHERAPIST: 'Fisioterapeuta',
      PATIENT: 'Paciente',
    };
    return roles[role] || role;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`} 
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email}
        </Text>
        <Text variant="bodySmall" style={styles.role}>
          {getRoleDisplayName(user?.role || '')}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Acciones Rápidas</Text>
            
            {(user?.role === 'PATIENT' || user?.role === 'PHYSIOTHERAPIST') && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('CreateAppointment')}
              >
                <MaterialCommunityIcons name="calendar-plus" size={24} color="#007AFF" />
                <Text style={styles.actionButtonText}>Nueva Cita</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('MyAppointments')}
            >
              <MaterialCommunityIcons name="calendar-check" size={24} color="#007AFF" />
              <Text style={styles.actionButtonText}>Mis Citas</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            {user?.role === 'PATIENT' && (
              <>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('AvailableActivities')}
                >
                  <MaterialCommunityIcons name="run" size={24} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Actividades Disponibles</Text>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('MyBookings')}
                >
                  <MaterialCommunityIcons name="ticket" size={24} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Mis Reservas</Text>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <MaterialCommunityIcons name="account-edit" size={24} color="#007AFF" />
              <Text style={styles.actionButtonText}>Editar Perfil</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Información</Text>
            {user?.phone && (
              <View style={styles.infoRow}>
                <Text>Teléfono:</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text>ID Clínica:</Text>
              <Text style={styles.infoValue}>{user?.clinicId || 'N/A'}</Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
        >
          Cerrar Sesión
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  name: {
    marginTop: 15,
    fontWeight: 'bold',
  },
  email: {
    marginTop: 5,
    opacity: 0.7,
  },
  role: {
    marginTop: 5,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  content: {
    padding: 15,
  },
  card: {
    marginBottom: 15,
  },
  sectionTitle: {
    marginBottom: 15,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  infoValue: {
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
  },
});
