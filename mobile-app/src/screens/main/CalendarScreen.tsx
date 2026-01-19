import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Calendario</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Vista de calendario próximamente
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  placeholder: {
    marginTop: 20,
    opacity: 0.6,
  },
});
