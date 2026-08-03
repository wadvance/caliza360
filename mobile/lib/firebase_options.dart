import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
///
/// Proyecto Firebase: caliza360
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions no están soportados para esta plataforma.',
        );
    }
  }

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  Proyecto: caliza360                                        ║
  // ║  android/app/google-services.json debe existir              ║
  // ╚══════════════════════════════════════════════════════════════╝

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCTYHIKkw1y1HBtZ4RhHnAWk50eGPc0khg',
    appId: '1:321221946315:android:cf71faf2035704940ca44e',
    messagingSenderId: '321221946315',
    projectId: 'caliza360',
    storageBucket: 'caliza360.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAfcinHAhD075EwXkMvB66WbXhFdgsGbw8',
    appId: '1:321221946315:ios:1e6c40ab8b0887310ca44e',
    messagingSenderId: '321221946315',
    projectId: 'caliza360',
    storageBucket: 'caliza360.firebasestorage.app',
    iosBundleId: 'com.calizalosos.mobile',
  );
}
