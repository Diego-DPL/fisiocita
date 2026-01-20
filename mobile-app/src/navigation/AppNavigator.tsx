import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainNavigator from './MainNavigator';
import MyAppointmentsScreen from '../screens/main/MyAppointmentsScreen';
import AvailableActivitiesScreen from '../screens/main/AvailableActivitiesScreen';
import MyBookingsScreen from '../screens/main/MyBookingsScreen';
import BookActivityScreen from '../screens/main/BookActivityScreen';
import CreateAppointmentScreen from '../screens/main/CreateAppointmentScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Main" 
        component={MainNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MyAppointments" 
        component={MyAppointmentsScreen}
        options={{ 
          title: 'Mis Citas',
          headerBackTitle: 'Volver',
        }}
      />
      <Stack.Screen 
        name="AvailableActivities" 
        component={AvailableActivitiesScreen}
        options={{ 
          title: 'Actividades Disponibles',
          headerBackTitle: 'Volver',
        }}
      />
      <Stack.Screen 
        name="MyBookings" 
        component={MyBookingsScreen}
        options={{ 
          title: 'Mis Reservas',
          headerBackTitle: 'Volver',
        }}
      />
      <Stack.Screen 
        name="BookActivity" 
        component={BookActivityScreen}
        options={{ 
          title: 'Reservar Actividad',
          headerBackTitle: 'Volver',
        }}
      />
      <Stack.Screen 
        name="CreateAppointment" 
        component={CreateAppointmentScreen}
        options={{ 
          title: 'Nueva Cita',
          headerBackTitle: 'Volver',
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Editar Perfil',
          headerBackTitle: 'Volver',
        }}
      />
    </Stack.Navigator>
  );
}
