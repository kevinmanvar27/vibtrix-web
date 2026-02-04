import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../data/models/wallet_model.dart';

/// Abstract repository for wallet operations
/// NOTE: Most wallet endpoints are NOT implemented in backend.
/// Only payment endpoints for competition entry fees exist:
/// - POST /payments/create-order
/// - POST /payments/verify
abstract class WalletRepository {
  // Payment operations (these are the only working endpoints)
  Future<Result<PaymentOrderModel>> createPaymentOrder(int amountPaise, {String purpose = 'add_money'});
  Future<Result<TransactionModel>> verifyPayment(String orderId, String paymentId, String signature);
}
