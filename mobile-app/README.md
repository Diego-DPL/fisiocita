# Fisiocita Mobile App

Aplicación móvil multiplataforma para Fisiocita construida con React Native y Expo.

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+
- pnpm (recomendado) o npm
- Expo CLI
- Para iOS: Xcode (solo macOS)
- Para Android: Android Studio

### Instalación

1. **Navegar al directorio**
```bash
cd fisiocita/mobile-app
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Copiar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` y configurar la URL del backend:
```env
API_URL=http://localhost:3000/api/v1
```

> **Nota**: Para desarrollo en dispositivos físicos, usar la IP local:
> ```
> API_URL=http://192.168.1.X:3000/api/v1
> ```

4. **Iniciar Expo**
```bash
pnpm start
```

Esto abrirá Expo DevTools en el navegador.

## 📱 Ejecutar la App

### iOS (solo macOS)

```bash
pnpm ios
```

O escanear el QR con la app de Expo Go desde el iPhone.

### Android

```bash
pnpm android
```

O escanear el QR con la app de Expo Go desde Android.

### Web

```bash
pnpm web
```

Abre en: http://localhost:19006

## 📋 Credenciales de Prueba

Usa las mismas credenciales del backend:

**Paciente**
- Email: `carlos.rodriguez@email.com`
- Password: `Patient123!`

**Fisioterapeuta**
- Email: `maria.garcia@clinicafisio.com`
- Password: `Fisio123!`

**Admin**
- Email: `admin@clinicafisio.com`
- Password: `Admin123!`

## 📁 Estructura del Proyecto

```
mobile-app/
├── src/
│   ├── navigation/          # Navegación de la app
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/             # Pantallas
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   └── main/
│   │       ├── HomeScreen.tsx
│   │       ├── CalendarScreen.tsx
│   │       └── ProfileScreen.tsx
│   ├── services/            # Servicios API
│   │   ├── apiClient.ts
│   │   └── authService.ts
│   ├── store/               # Estado global (Zustand)
│   │   └── authStore.ts
│   ├── components/          # Componentes reutilizables
│   ├── utils/               # Utilidades
│   └── types/               # Tipos TypeScript
├── assets/                  # Imágenes, iconos, etc.
├── App.tsx                  # Punto de entrada
├── app.json                 # Configuración de Expo
└── package.json
```

## 🎨 UI Components

Usamos **React Native Paper** para componentes de UI:

```tsx
import { Button, TextInput, Card } from 'react-native-paper';

<Button mode="contained" onPress={handlePress}>
  Click me
</Button>
```

## 🗺️ Navegación

La app tiene 3 niveles de navegación:

1. **RootNavigator**: Decide entre Auth o Main según autenticación
2. **AuthNavigator**: Pantallas de login/registro
3. **MainNavigator**: Bottom tabs (Inicio, Calendario, Perfil)

## 💾 Estado Global

Usamos **Zustand** para gestión de estado:

```tsx
// Uso en componentes
const { user, login, logout } = useAuthStore();

// Login
await login(email, password);

// Logout
await logout();
```

## 🔐 Autenticación

Los tokens se almacenan de forma segura con **Expo SecureStore**:

```tsx
import * as SecureStore from 'expo-secure-store';

// Guardar
await SecureStore.setItemAsync('accessToken', token);

// Leer
const token = await SecureStore.getItemAsync('accessToken');

// Eliminar
await SecureStore.deleteItemAsync('accessToken');
```

## 🌐 Llamadas a la API

Configuramos Axios con interceptors para tokens:

```tsx
// services/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.API_URL,
});

// Interceptor para añadir token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 📱 Pantallas Disponibles

### Auth Flow
- ✅ **LoginScreen**: Inicio de sesión

### Main Flow (Autenticado)
- ✅ **HomeScreen**: Dashboard con resumen
- ✅ **CalendarScreen**: Vista de calendarios (próximamente)
- ✅ **ProfileScreen**: Perfil del usuario

### Por Implementar
- [ ] Listado de fisioterapeutas
- [ ] Detalle de fisioterapeuta
- [ ] Reservar cita
- [ ] Listado de actividades
- [ ] Detalle de actividad
- [ ] Reservar actividad
- [ ] Historial de citas
- [ ] Notificaciones

## 🎨 Theming

Personalizar el tema en `App.tsx`:

```tsx
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#03A9F4',
  },
};
```

## 🔔 Notificaciones (Próximamente)

```bash
pnpm expo install expo-notifications
```

## 📸 Cámara/Galería (Próximamente)

```bash
pnpm expo install expo-image-picker
```

## 🌍 Localización (Próximamente)

```bash
pnpm install i18next react-i18next
```

## 🚀 Build para Producción

### Configurar EAS

1. **Instalar EAS CLI**
```bash
npm install -g eas-cli
```

2. **Login**
```bash
eas login
```

3. **Configurar proyecto**
```bash
eas build:configure
```

### Build Android

```bash
eas build --platform android
```

### Build iOS

```bash
eas build --platform ios
```

### Build para ambos

```bash
eas build --platform all
```

## 📦 Actualización OTA

Para enviar actualizaciones sin pasar por stores:

```bash
eas update --branch production
```

## 🧪 Testing

```bash
# Tests unitarios
pnpm test

# Tests con watch
pnpm test:watch
```

## 🐛 Troubleshooting

### Error de conexión al backend

1. Verificar que el backend esté corriendo
2. Verificar la IP en `.env` si usas dispositivo físico
3. Verificar firewall

```bash
# Obtener IP local (macOS/Linux)
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### Expo Go no conecta

1. Asegurarse de estar en la misma red WiFi
2. Reiniciar Expo DevTools: `r` en la terminal
3. Limpiar caché: `pnpm start --clear`

### Error de TypeScript

```bash
# Limpiar caché de TypeScript
rm -rf node_modules
pnpm install
```

### Problemas con iOS

```bash
# Limpiar pods
cd ios
pod deintegrate
pod install
cd ..
```

## 📊 Performance

### Optimización de Imágenes

Usar optimizadores de imágenes:
```bash
pnpm expo install expo-image
```

### Bundle Size

Verificar tamaño del bundle:
```bash
npx react-native-bundle-visualizer
```

## 🔍 Debug

### React Native Debugger

```bash
# Instalar
brew install --cask react-native-debugger

# Abrir menú de desarrollo en dispositivo
# iOS: Cmd+D
# Android: Cmd+M (macOS) o Ctrl+M (Windows/Linux)
```

### Logs

```bash
# Ver logs de iOS
npx react-native log-ios

# Ver logs de Android
npx react-native log-android
```

## 📚 Recursos

- [Expo Docs](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contribución

1. Crear rama: `git checkout -b feature/nueva-pantalla`
2. Commit: `git commit -m 'Add: nueva pantalla'`
3. Push: `git push origin feature/nueva-pantalla`
4. Pull Request

## 📝 Notas

### Platform-Specific Code

```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
});
```

### Environment Variables

Usar `process.env.VARIABLE_NAME` para acceder a variables de entorno.

## 📞 Soporte

Para problemas o preguntas, contactar al equipo de desarrollo.
