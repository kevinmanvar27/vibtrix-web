import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/wallet_model.dart';

part 'wallet_api_service.g.dart';

/// Wallet/Payments API Service - Matches Backend API exactly
/// All endpoints verified against API_DOCUMENTATION.txt
/// 
/// NOTE: Most wallet endpoints are NOT implemented in backend.
/// Only payment endpoints for competition entry fees exist.
@RestApi()
abstract class WalletApiService {
  factory WalletApiService(Dio dio, {String baseUrl}) = _WalletApiService;

  // ============ PAYMENT ENDPOINTS (Working) ============

  /// POST /payments/create-order - Create payment order for competition
  @POST('/payments/create-order')
  Future<PaymentOrderModel> createPaymentOrder(@Body() CreatePaymentOrderRequest request);

  /// POST /payments/verify - Verify payment after completion
  @POST('/payments/verify')
  Future<TransactionModel> verifyPayment(@Body() VerifyPaymentRequest request);

  // ============ NOTE: These endpoints do NOT exist in backend ============
  // - GET /wallet - Wallet info
  // - GET /wallet/balance - Balance info
  // - GET /wallet/transactions - Transaction history
  // - POST /wallet/withdraw - Withdrawals
  // - GET /wallet/bank-accounts - Bank accounts
  // - GET /wallet/upi - UPI IDs
  // - GET /wallet/earnings - Earnings
  // - GET /wallet/rewards - Rewards
  // - GET /wallet/referral - Referrals
  // - GET /wallet/kyc/status - KYC
}

// ============ Response Models ============
// NOTE: These models are not currently used since wallet endpoints don't exist
// Manual fromJson/toJson to avoid build_runner dependency

class WalletBalanceResponse {
  final int balance;
  final int pendingBalance;
  final int withdrawableBalance;
  final String currency;

  WalletBalanceResponse({
    required this.balance,
    required this.pendingBalance,
    required this.withdrawableBalance,
    required this.currency,
  });

  double get balanceInRupees => balance / 100;
  double get pendingBalanceInRupees => pendingBalance / 100;
  double get withdrawableBalanceInRupees => withdrawableBalance / 100;

  factory WalletBalanceResponse.fromJson(Map<String, dynamic> json) =>
      WalletBalanceResponse(
        balance: json['balance'] as int? ?? 0,
        pendingBalance: json['pendingBalance'] as int? ?? 0,
        withdrawableBalance: json['withdrawableBalance'] as int? ?? 0,
        currency: json['currency'] as String? ?? 'INR',
      );
  
  Map<String, dynamic> toJson() => {
        'balance': balance,
        'pendingBalance': pendingBalance,
        'withdrawableBalance': withdrawableBalance,
        'currency': currency,
      };
}

class ReferralCodeResponse {
  final String code;
  final String shareUrl;

  ReferralCodeResponse({
    required this.code,
    required this.shareUrl,
  });

  factory ReferralCodeResponse.fromJson(Map<String, dynamic> json) =>
      ReferralCodeResponse(
        code: json['code'] as String? ?? '',
        shareUrl: json['shareUrl'] as String? ?? '',
      );
  
  Map<String, dynamic> toJson() => {
        'code': code,
        'shareUrl': shareUrl,
      };
}

class AddUpiIdRequest {
  final String upiId;
  final String? name;
  final bool isPrimary;

  AddUpiIdRequest({
    required this.upiId,
    this.name,
    this.isPrimary = false,
  });

  factory AddUpiIdRequest.fromJson(Map<String, dynamic> json) =>
      AddUpiIdRequest(
        upiId: json['upiId'] as String? ?? '',
        name: json['name'] as String?,
        isPrimary: json['isPrimary'] as bool? ?? false,
      );
  
  Map<String, dynamic> toJson() => {
        'upiId': upiId,
        if (name != null) 'name': name,
        'isPrimary': isPrimary,
      };
}
