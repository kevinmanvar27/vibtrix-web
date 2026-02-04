import 'package:dio/dio.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/error_handler.dart';
import '../../domain/repositories/wallet_repository.dart';
import '../datasources/wallet_api_service.dart';
import '../models/wallet_model.dart';

/// Implementation of WalletRepository
/// NOTE: Most wallet endpoints are NOT implemented in backend.
/// Only payment endpoints for competition entry fees exist.
class WalletRepositoryImpl implements WalletRepository {
  final WalletApiService _apiService;

  WalletRepositoryImpl({required WalletApiService apiService})
      : _apiService = apiService;

  @override
  Future<Result<PaymentOrderModel>> createPaymentOrder(int amountPaise, {String purpose = 'add_money'}) async {
    try {
      final order = await _apiService.createPaymentOrder(
        CreatePaymentOrderRequest(amount: amountPaise, purpose: purpose),
      );
      return Right(order);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<TransactionModel>> verifyPayment(
    String orderId,
    String paymentId,
    String signature,
  ) async {
    try {
      final transaction = await _apiService.verifyPayment(
        VerifyPaymentRequest(
          orderId: orderId,
          paymentId: paymentId,
          signature: signature,
        ),
      );
      return Right(transaction);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }
}
