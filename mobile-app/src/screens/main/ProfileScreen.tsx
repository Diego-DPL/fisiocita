import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Avatar } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={`${user?.firstName[0]}${user?.lastName[0]}`} />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email}
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Información</Text>
            <View style={styles.infoRow}>
              <Text>Rol:</Text>
              <Text style={styles.infoValue}>{user?.role}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text>ID Clínica:</Text>
              <Text style={styles.infoValue}>{user?.clinicId}</Text>
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
  content: {
    padding: 15,
  },
  card: {
    marginBottom: 15,
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
