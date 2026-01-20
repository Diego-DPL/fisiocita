import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();

  const getRoleDisplayName = (role: string) => {
    const roles: any = {
      SUPER_ADMIN: 'Super Administrador',
      CLINIC_ADMIN: 'Administrador',
      PHYSIOTHERAPIST: 'Fisioterapeuta',
      PATIENT: 'Paciente',
    };
    return roles[role] || role;
  };

  const menuItems = React.useMemo(() => {
    if (!user) return [];

    const common = [
      { title: 'Mi Agenda', screen: 'Calendar', icon: '📅' },
      { title: 'Mi Perfil', screen: 'EditProfile', icon: '👤' },
    ];

    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'CLINIC_ADMIN':
        return [
          { title: 'Vista General', screen: 'ClinicOverview', icon: '🏥' },
          { title: 'Fisioterapeutas', screen: 'Physiotherapists', icon: '👨‍⚕️' },
          { title: 'Pacientes', screen: 'Patients', icon: '👥' },
          { title: 'Actividades', screen: 'Activities', icon: '🏃' },
          { title: 'Citas', screen: 'Appointments', icon: '📋' },
          { title: 'Solicitudes', screen: 'ClinicRequests', icon: '📨' },
          ...common,
        ];
      
      case 'PHYSIOTHERAPIST':
        return [
          { title: 'Mis Citas', screen: 'MyAppointments', icon: '📋' },
          { title: 'Mis Actividades', screen: 'MyActivities', icon: '🏃' },
          { title: 'Nueva Cita', screen: 'CreateAppointment', icon: '➕' },
          ...common,
          { title: 'Solicitar Clínica', screen: 'RequestClinic', icon: '📨' },
        ];
      
      case 'PATIENT':
        return [
          { title: 'Mis Citas', screen: 'MyAppointments', icon: '📋' },
          { title: 'Nueva Cita', screen: 'CreateAppointment', icon: '➕' },
          { title: 'Actividades Disponibles', screen: 'AvailableActivities', icon: '🏃' },
          { title: 'Mis Reservas', screen: 'MyBookings', icon: '🎟️' },
          ...common,
        ];
      
      default:
        return common;
    }
  }, [user]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Hola, {user?.firstName || 'Usuario'}
        </Text>
        <Text style={styles.roleText}>{getRoleDisplayName(user?.role || '')}</Text>
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickStats}>
        <Text style={styles.sectionTitle}>Resumen Rápido</Text>
        <Text style={styles.comingSoon}>Próximamente: estadísticas y métricas</Text>
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
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  menuItem: {
    width: '47%',
    backgroundColor: 'white',
    margin: '1.5%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  quickStats: {
    margin: 15,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  comingSoon: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
