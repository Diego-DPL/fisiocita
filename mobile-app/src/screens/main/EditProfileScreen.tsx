import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { patientsService, physiotherapistsService } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';

export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUser } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      if (user.role === 'PATIENT') {
        const response = await patientsService.getMyProfile();
        const profile = response.data;
        setFirstName(profile.user.firstName);
        setLastName(profile.user.lastName);
        setPhone(profile.user.phone || '');
        setDateOfBirth(profile.dateOfBirth || '');
        // setAddress(profile.address || ''); // address no existe en el modelo
      } else if (user.role === 'PHYSIOTHERAPIST') {
        const response = await physiotherapistsService.getAll();
        const myProfile = response.data.find((p: any) => p.user.email === user.email);
        if (myProfile) {
          setFirstName(myProfile.user.firstName);
          setLastName(myProfile.user.lastName);
          setPhone(myProfile.user.phone || '');
          // setSpecialties(myProfile.specialties || []); // specialties no disponible en el tipo
        }
      } else {
        // Admin/Clinic Admin - usar datos del user store
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setPhone(user.phone || '');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'El nombre y apellido son obligatorios');
      return;
    }

    try {
      setSubmitting(true);

      if (user?.role === 'PATIENT') {
        await patientsService.updateMyProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
        });
      } else if (user?.role === 'PHYSIOTHERAPIST') {
        // Note: Necesitaríamos el ID del physiotherapist
        // Por ahora mostramos mensaje
        Alert.alert('Info', 'La edición de perfil de fisioterapeuta requiere implementación adicional');
        setSubmitting(false);
        return;
      }

      // Actualizar user en store
      if (user) {
        updateUser({
          ...user,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || user.phone,
        });
      }

      Alert.alert(
        'Perfil Actualizado',
        'Tus datos han sido actualizados correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSpecialty = () => {
    if (!newSpecialty.trim()) return;
    
    if (specialties.includes(newSpecialty.trim())) {
      Alert.alert('Error', 'Esta especialidad ya está agregada');
      return;
    }

    setSpecialties([...specialties, newSpecialty.trim()]);
    setNewSpecialty('');
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty));
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
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Tu nombre"
          maxLength={50}
        />

        <Text style={styles.label}>Apellido *</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Tu apellido"
          maxLength={50}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+34 600 000 000"
          keyboardType="phone-pad"
          maxLength={20}
        />

        {user?.role === 'PATIENT' && (
          <>
            <Text style={styles.label}>Fecha de Nacimiento</Text>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
              maxLength={10}
            />
          </>
        )}

        {user?.role === 'PHYSIOTHERAPIST' && (
          <>
            <Text style={styles.sectionTitle}>Especialidades</Text>
            
            <View style={styles.specialtiesContainer}>
              {specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSpecialty(specialty)}>
                    <Text style={styles.removeSpecialty}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.addSpecialtyContainer}>
              <TextInput
                style={[styles.input, styles.specialtyInput]}
                value={newSpecialty}
                onChangeText={setNewSpecialty}
                placeholder="Nueva especialidad"
                maxLength={50}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddSpecialty}
              >
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.infoText}>
          * Campos obligatorios
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
        onPress={handleSaveProfile}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar Cambios</Text>
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
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    marginTop: 10,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  specialtyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  removeSpecialty: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addSpecialtyContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  specialtyInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});
