/// Centralized error handling utilities for consistent error display
import 'package:flutter/material.dart';
import '../error/failures.dart';

/// Utility class for displaying errors consistently across the app
class ErrorHandler {
  ErrorHandler._();

  /// Show an error snackbar with consistent styling
  static void showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'Dismiss',
          textColor: Colors.white,
          onPressed: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
          },
        ),
      ),
    );
  }

  /// Show a success snackbar with consistent styling
  static void showSuccess(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.green.shade700,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  /// Show an info snackbar with consistent styling
  static void showInfo(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.info_outline, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.blue.shade700,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  /// Show error from Failure object
  static void showFailure(BuildContext context, Failure failure) {
    showError(context, failure.message);
  }

  /// Get user-friendly error message from exception
  static String getErrorMessage(dynamic error) {
    if (error is Failure) {
      return error.message;
    }
    
    final errorString = error.toString().toLowerCase();
    
    if (errorString.contains('socket') || 
        errorString.contains('connection') ||
        errorString.contains('network')) {
      return 'No internet connection. Please check your network.';
    }
    
    if (errorString.contains('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (errorString.contains('unauthorized') || 
        errorString.contains('401')) {
      return 'Session expired. Please login again.';
    }
    
    if (errorString.contains('forbidden') || 
        errorString.contains('403')) {
      return 'You don\'t have permission to perform this action.';
    }
    
    if (errorString.contains('not found') || 
        errorString.contains('404')) {
      return 'The requested resource was not found.';
    }
    
    if (errorString.contains('server') || 
        errorString.contains('500') ||
        errorString.contains('502') ||
        errorString.contains('503')) {
      return 'Server error. Please try again later.';
    }
    
    return 'Something went wrong. Please try again.';
  }
}
