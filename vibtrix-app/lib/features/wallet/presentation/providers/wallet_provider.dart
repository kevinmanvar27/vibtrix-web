/// Wallet/Payment state management using Riverpod
/// NOTE: Most wallet endpoints are NOT implemented in backend.
/// Only payment endpoints for competition entry fees exist:
/// - POST /payments/create-order
/// - POST /payments/verify

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../data/models/wallet_model.dart';
import '../../domain/repositories/wallet_repository.dart';

// ============================================================================
// Payment State
// ============================================================================

class PaymentState {
  final bool isProcessing;
  final String? errorMessage;
  final TransactionModel? lastTransaction;
  final PaymentOrderModel? currentOrder;

  const PaymentState({
    this.isProcessing = false,
    this.errorMessage,
    this.lastTransaction,
    this.currentOrder,
  });

  PaymentState copyWith({
    bool? isProcessing,
    String? errorMessage,
    TransactionModel? lastTransaction,
    PaymentOrderModel? currentOrder,
    bool clearError = false,
    bool clearOrder = false,
  }) {
    return PaymentState(
      isProcessing: isProcessing ?? this.isProcessing,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastTransaction: lastTransaction ?? this.lastTransaction,
      currentOrder: clearOrder ? null : (currentOrder ?? this.currentOrder),
    );
  }
}

// ============================================================================
// Payment Notifier
// ============================================================================

class PaymentNotifier extends StateNotifier<PaymentState> {
  final WalletRepository _repository;

  PaymentNotifier(this._repository) : super(const PaymentState());

  /// Create payment order (for competition entry fees, etc.)
  Future<PaymentOrderModel?> createPaymentOrder(int amountInPaise, {String purpose = 'add_money'}) async {
    state = state.copyWith(isProcessing: true, clearError: true);

    final result = await _repository.createPaymentOrder(amountInPaise, purpose: purpose);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isProcessing: false,
          errorMessage: failure.message ?? 'Failed to create payment order',
        );
        return null;
      },
      (order) {
        state = state.copyWith(
          isProcessing: false,
          currentOrder: order,
        );
        return order;
      },
    );
  }

  /// Verify payment after completion
  Future<bool> verifyPayment(String orderId, String paymentId, String signature) async {
    state = state.copyWith(isProcessing: true, clearError: true);

    final result = await _repository.verifyPayment(orderId, paymentId, signature);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isProcessing: false,
          errorMessage: failure.message ?? 'Failed to verify payment',
        );
        return false;
      },
      (transaction) {
        state = state.copyWith(
          isProcessing: false,
          lastTransaction: transaction,
          clearOrder: true,
        );
        return true;
      },
    );
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(clearError: true);
  }

  /// Reset state
  void reset() {
    state = const PaymentState();
  }
}

// ============================================================================
// Providers
// ============================================================================

/// Payment provider - the only working wallet functionality
final paymentProvider = StateNotifierProvider<PaymentNotifier, PaymentState>((ref) {
  final repository = ref.watch(walletRepositoryProvider);
  return PaymentNotifier(repository);
});
