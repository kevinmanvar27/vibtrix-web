import 'package:json_annotation/json_annotation.dart';

part 'wallet_model.g.dart';

@JsonSerializable()
class WalletModel {
  final String id;
  final String userId;
  final int balance;
  final String currency;
  final int totalEarnings;
  final int totalWithdrawals;
  final int pendingWithdrawal;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const WalletModel({
    required this.id,
    required this.userId,
    this.balance = 0,
    this.currency = 'INR',
    this.totalEarnings = 0,
    this.totalWithdrawals = 0,
    this.pendingWithdrawal = 0,
    required this.createdAt,
    this.updatedAt,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) =>
      _$WalletModelFromJson(json);

  Map<String, dynamic> toJson() => _$WalletModelToJson(this);

  double get balanceInRupees => balance / 100;
  double get totalEarningsInRupees => totalEarnings / 100;
  double get totalWithdrawalsInRupees => totalWithdrawals / 100;

  WalletModel copyWith({
    String? id,
    String? userId,
    int? balance,
    String? currency,
    int? totalEarnings,
    int? totalWithdrawals,
    int? pendingWithdrawal,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return WalletModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      balance: balance ?? this.balance,
      currency: currency ?? this.currency,
      totalEarnings: totalEarnings ?? this.totalEarnings,
      totalWithdrawals: totalWithdrawals ?? this.totalWithdrawals,
      pendingWithdrawal: pendingWithdrawal ?? this.pendingWithdrawal,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

@JsonSerializable()
class TransactionModel {
  final String id;
  final String userId;
  final TransactionType type;
  final TransactionStatus status;
  final int amount;
  final String currency;
  final String? description;
  final String? referenceId;
  final String? competitionId;
  final String? paymentId;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime? completedAt;

  const TransactionModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.status,
    required this.amount,
    this.currency = 'INR',
    this.description,
    this.referenceId,
    this.competitionId,
    this.paymentId,
    this.metadata,
    required this.createdAt,
    this.completedAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) =>
      _$TransactionModelFromJson(json);

  Map<String, dynamic> toJson() => _$TransactionModelToJson(this);

  double get amountInRupees => amount / 100;
  bool get isCredit => type == TransactionType.prize || 
                       type == TransactionType.refund ||
                       type == TransactionType.deposit;
}

enum TransactionType {
  @JsonValue('entry_fee')
  entryFee,
  @JsonValue('prize')
  prize,
  @JsonValue('withdrawal')
  withdrawal,
  @JsonValue('deposit')
  deposit,
  @JsonValue('refund')
  refund,
}

enum TransactionStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('processing')
  processing,
  @JsonValue('completed')
  completed,
  @JsonValue('failed')
  failed,
  @JsonValue('cancelled')
  cancelled,
}

@JsonSerializable()
class BankAccountModel {
  final String id;
  final String userId;
  final String accountHolderName;
  final String accountNumber;
  final String ifscCode;
  final String bankName;
  final String? branchName;
  final bool isVerified;
  final bool isPrimary;
  final DateTime createdAt;

  const BankAccountModel({
    required this.id,
    required this.userId,
    required this.accountHolderName,
    required this.accountNumber,
    required this.ifscCode,
    required this.bankName,
    this.branchName,
    this.isVerified = false,
    this.isPrimary = false,
    required this.createdAt,
  });

  factory BankAccountModel.fromJson(Map<String, dynamic> json) =>
      _$BankAccountModelFromJson(json);

  Map<String, dynamic> toJson() => _$BankAccountModelToJson(this);

  String get maskedAccountNumber {
    if (accountNumber.length <= 4) return accountNumber;
    return '****${accountNumber.substring(accountNumber.length - 4)}';
  }
}

@JsonSerializable()
class PaymentOrderModel {
  final String orderId;
  final int amount;
  final String currency;
  final String? receipt;
  final String status;
  final Map<String, dynamic>? notes;

  const PaymentOrderModel({
    required this.orderId,
    required this.amount,
    this.currency = 'INR',
    this.receipt,
    required this.status,
    this.notes,
  });

  factory PaymentOrderModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentOrderModelFromJson(json);

  Map<String, dynamic> toJson() => _$PaymentOrderModelToJson(this);
}

// ============ REQUEST MODELS ============

@JsonSerializable()
class CreatePaymentOrderRequest {
  final int amount;
  final String purpose;
  final String? competitionId;
  final Map<String, dynamic>? metadata;

  const CreatePaymentOrderRequest({
    required this.amount,
    required this.purpose,
    this.competitionId,
    this.metadata,
  });

  factory CreatePaymentOrderRequest.fromJson(Map<String, dynamic> json) =>
      _$CreatePaymentOrderRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreatePaymentOrderRequestToJson(this);
}

@JsonSerializable()
class VerifyPaymentRequest {
  final String orderId;
  final String paymentId;
  final String signature;

  const VerifyPaymentRequest({
    required this.orderId,
    required this.paymentId,
    required this.signature,
  });

  factory VerifyPaymentRequest.fromJson(Map<String, dynamic> json) =>
      _$VerifyPaymentRequestFromJson(json);

  Map<String, dynamic> toJson() => _$VerifyPaymentRequestToJson(this);
}

@JsonSerializable()
class WithdrawalRequest {
  final int amount;
  final String bankAccountId;

  const WithdrawalRequest({
    required this.amount,
    required this.bankAccountId,
  });

  factory WithdrawalRequest.fromJson(Map<String, dynamic> json) =>
      _$WithdrawalRequestFromJson(json);

  Map<String, dynamic> toJson() => _$WithdrawalRequestToJson(this);
}

@JsonSerializable()
class AddBankAccountRequest {
  final String accountHolderName;
  final String accountNumber;
  final String ifscCode;
  final String bankName;
  final String? branchName;

  const AddBankAccountRequest({
    required this.accountHolderName,
    required this.accountNumber,
    required this.ifscCode,
    required this.bankName,
    this.branchName,
  });

  factory AddBankAccountRequest.fromJson(Map<String, dynamic> json) =>
      _$AddBankAccountRequestFromJson(json);

  Map<String, dynamic> toJson() => _$AddBankAccountRequestToJson(this);
}

// ============ UPI MODELS ============

@JsonSerializable()
class UpiIdModel {
  final String id;
  final String upiId;
  final String? name;
  final bool isPrimary;
  final bool isVerified;
  final DateTime createdAt;

  const UpiIdModel({
    required this.id,
    required this.upiId,
    this.name,
    this.isPrimary = false,
    this.isVerified = false,
    required this.createdAt,
  });

  factory UpiIdModel.fromJson(Map<String, dynamic> json) =>
      _$UpiIdModelFromJson(json);

  Map<String, dynamic> toJson() => _$UpiIdModelToJson(this);
}

// ============ EARNINGS MODELS ============

@JsonSerializable()
class EarningsModel {
  final int totalEarnings;
  final int competitionEarnings;
  final int referralEarnings;
  final int bonusEarnings;
  final String currency;
  final DateTime? periodStart;
  final DateTime? periodEnd;

  const EarningsModel({
    this.totalEarnings = 0,
    this.competitionEarnings = 0,
    this.referralEarnings = 0,
    this.bonusEarnings = 0,
    this.currency = 'INR',
    this.periodStart,
    this.periodEnd,
  });

  factory EarningsModel.fromJson(Map<String, dynamic> json) =>
      _$EarningsModelFromJson(json);

  Map<String, dynamic> toJson() => _$EarningsModelToJson(this);

  double get totalEarningsInRupees => totalEarnings / 100;
}

@JsonSerializable()
class EarningsBreakdownModel {
  final List<EarningsBreakdownItem> items;
  final int total;

  const EarningsBreakdownModel({
    this.items = const [],
    this.total = 0,
  });

  factory EarningsBreakdownModel.fromJson(Map<String, dynamic> json) =>
      _$EarningsBreakdownModelFromJson(json);

  Map<String, dynamic> toJson() => _$EarningsBreakdownModelToJson(this);
}

@JsonSerializable()
class EarningsBreakdownItem {
  final String category;
  final int amount;
  final int count;

  const EarningsBreakdownItem({
    required this.category,
    required this.amount,
    this.count = 0,
  });

  factory EarningsBreakdownItem.fromJson(Map<String, dynamic> json) =>
      _$EarningsBreakdownItemFromJson(json);

  Map<String, dynamic> toJson() => _$EarningsBreakdownItemToJson(this);
}

// ============ REWARDS MODELS ============

@JsonSerializable()
class RewardModel {
  final String id;
  final String title;
  final String? description;
  final int amount;
  final String type;
  final DateTime? expiresAt;
  final bool isClaimed;

  const RewardModel({
    required this.id,
    required this.title,
    this.description,
    required this.amount,
    required this.type,
    this.expiresAt,
    this.isClaimed = false,
  });

  factory RewardModel.fromJson(Map<String, dynamic> json) =>
      _$RewardModelFromJson(json);

  Map<String, dynamic> toJson() => _$RewardModelToJson(this);

  double get amountInRupees => amount / 100;
}

// ============ REFERRAL MODELS ============

@JsonSerializable()
class ReferralInfoModel {
  final String? referralCode;
  final String? shareUrl;
  final int totalReferrals;
  final int successfulReferrals;
  final int totalEarnings;
  final int pendingEarnings;

  const ReferralInfoModel({
    this.referralCode,
    this.shareUrl,
    this.totalReferrals = 0,
    this.successfulReferrals = 0,
    this.totalEarnings = 0,
    this.pendingEarnings = 0,
  });

  factory ReferralInfoModel.fromJson(Map<String, dynamic> json) =>
      _$ReferralInfoModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReferralInfoModelToJson(this);
}

// ============ KYC MODELS ============

@JsonSerializable()
class KycStatusModel {
  final KycStatus status;
  final String? rejectionReason;
  final DateTime? submittedAt;
  final DateTime? verifiedAt;
  final KycDocuments? documents;

  const KycStatusModel({
    this.status = KycStatus.notSubmitted,
    this.rejectionReason,
    this.submittedAt,
    this.verifiedAt,
    this.documents,
  });

  factory KycStatusModel.fromJson(Map<String, dynamic> json) =>
      _$KycStatusModelFromJson(json);

  Map<String, dynamic> toJson() => _$KycStatusModelToJson(this);

  bool get isVerified => status == KycStatus.verified;
  bool get isPending => status == KycStatus.pending;
}

enum KycStatus {
  @JsonValue('not_submitted')
  notSubmitted,
  @JsonValue('pending')
  pending,
  @JsonValue('verified')
  verified,
  @JsonValue('rejected')
  rejected,
}

@JsonSerializable()
class KycDocuments {
  final String? panNumber;
  final String? aadhaarNumber;
  final String? panImageUrl;
  final String? aadhaarFrontUrl;
  final String? aadhaarBackUrl;
  final String? selfieUrl;

  const KycDocuments({
    this.panNumber,
    this.aadhaarNumber,
    this.panImageUrl,
    this.aadhaarFrontUrl,
    this.aadhaarBackUrl,
    this.selfieUrl,
  });

  factory KycDocuments.fromJson(Map<String, dynamic> json) =>
      _$KycDocumentsFromJson(json);

  Map<String, dynamic> toJson() => _$KycDocumentsToJson(this);
}

@JsonSerializable()
class KycSubmissionRequest {
  final String panNumber;
  final String aadhaarNumber;
  final String panImageBase64;
  final String aadhaarFrontBase64;
  final String aadhaarBackBase64;
  final String selfieBase64;

  const KycSubmissionRequest({
    required this.panNumber,
    required this.aadhaarNumber,
    required this.panImageBase64,
    required this.aadhaarFrontBase64,
    required this.aadhaarBackBase64,
    required this.selfieBase64,
  });

  factory KycSubmissionRequest.fromJson(Map<String, dynamic> json) =>
      _$KycSubmissionRequestFromJson(json);

  Map<String, dynamic> toJson() => _$KycSubmissionRequestToJson(this);
}
