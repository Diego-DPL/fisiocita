import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Bienvenido, {user?.firstName}!</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Rol: {user?.role}
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Próximas Citas</Text>
            <Text variant="bodyMedium" style={styles.placeholder}>
              No tienes citas programadas
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Actividades Disponibles</Text>
            <Text variant="bodyMedium" style={styles.placeholder}>
              Explora las actividades grupales
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button>Ver Actividades</Button>
          </Card.Actions>
        </Card>
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
    padding: 20,
    backgroundColor: '#fff',
  },
  subtitle: {
    marginTop: 5,
    opacity: 0.7,
  },
  content: {
    padding: 15,
  },
  card: {
    marginBottom: 15,
  },
  placeholder: {
    marginTop: 10,
    opacity: 0.6,
  },
});
