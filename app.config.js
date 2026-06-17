/** @type {import('expo/config').ExpoConfig} */
module.exports = () => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return {
    name: 'OutletGo',
    slug: 'outletgo-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    androidStatusBar: {
      barStyle: 'dark-content',
      backgroundColor: '#ffffff',
      translucent: false,
    },
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.outletgo.app',
      config: {
        googleMapsApiKey: googleMapsApiKey || undefined,
      },
      infoPlist: {
        NSCameraUsageDescription: 'OutletGo usa la cámara para buscar productos visualmente.',
        NSPhotoLibraryUsageDescription: 'OutletGo accede a tus fotos para que puedas subir imágenes.',
        NSLocationWhenInUseUsageDescription:
          'OutletGo usa tu ubicación para mostrarte tiendas cercanas.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.outletgo.app',
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey || undefined,
        },
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'READ_MEDIA_IMAGES',
        'READ_EXTERNAL_STORAGE',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      'expo-web-browser',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#2B8FD4',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'OutletGo usa tu ubicación para mostrarte tiendas cercanas.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'OutletGo usa la cámara para buscar productos visualmente.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'OutletGo accede a tus fotos para buscar productos y actualizar tu perfil.',
          colors: {
            cropToolbarColor: '#ffffff',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    scheme: 'outletgo',
    extra: {
      eas: {
        projectId: 'outletgo-app',
      },
    },
  };
};
