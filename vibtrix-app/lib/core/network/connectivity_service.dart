/// Connectivity service for monitoring network status
/// Uses connectivity_plus package

import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

enum ConnectionStatus {
  online,
  offline,
  unknown,
}

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  
  StreamController<ConnectionStatus>? _statusController;
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  ConnectionStatus _currentStatus = ConnectionStatus.unknown;

  Stream<ConnectionStatus> get statusStream {
    _statusController ??= StreamController<ConnectionStatus>.broadcast();
    return _statusController!.stream;
  }

  ConnectionStatus get currentStatus => _currentStatus;

  bool get isOnline => _currentStatus == ConnectionStatus.online;
  bool get isOffline => _currentStatus == ConnectionStatus.offline;

  /// Initialize connectivity monitoring
  Future<void> init() async {
    // Get initial status
    final results = await _connectivity.checkConnectivity();
    _updateStatus(results);

    // Listen for changes
    _subscription = _connectivity.onConnectivityChanged.listen(_updateStatus);
  }

  void _updateStatus(List<ConnectivityResult> results) {
    ConnectionStatus newStatus;

    if (results.isEmpty || results.contains(ConnectivityResult.none)) {
      newStatus = ConnectionStatus.offline;
    } else {
      newStatus = ConnectionStatus.online;
    }

    if (newStatus != _currentStatus) {
      _currentStatus = newStatus;
      _statusController?.add(_currentStatus);
      
      if (kDebugMode) {
        debugPrint('Connectivity changed: $_currentStatus');
      }
    }
  }

  /// Check current connectivity
  Future<ConnectionStatus> checkConnectivity() async {
    final results = await _connectivity.checkConnectivity();
    _updateStatus(results);
    return _currentStatus;
  }

  /// Get connection type
  Future<String> getConnectionType() async {
    final results = await _connectivity.checkConnectivity();
    
    if (results.contains(ConnectivityResult.wifi)) {
      return 'WiFi';
    } else if (results.contains(ConnectivityResult.mobile)) {
      return 'Mobile';
    } else if (results.contains(ConnectivityResult.ethernet)) {
      return 'Ethernet';
    } else if (results.contains(ConnectivityResult.vpn)) {
      return 'VPN';
    } else if (results.contains(ConnectivityResult.bluetooth)) {
      return 'Bluetooth';
    } else if (results.contains(ConnectivityResult.other)) {
      return 'Other';
    } else {
      return 'None';
    }
  }

  /// Dispose resources
  void dispose() {
    _subscription?.cancel();
    _statusController?.close();
    _statusController = null;
  }
}
