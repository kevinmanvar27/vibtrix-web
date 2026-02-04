// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'wallet_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

WalletModel _$WalletModelFromJson(Map<String, dynamic> json) => WalletModel(
  id: json['id'] as String,
  userId: json['userId'] as String,
  balance: (json['balance'] as num?)?.toInt() ?? 0,
  currency: json['currency'] as String? ?? 'INR',
  totalEarnings: (json['totalEarnings'] as num?)?.toInt() ?? 0,
  totalWithdrawals: (json['totalWithdrawals'] as num?)?.toInt() ?? 0,
  pendingWithdrawal: (json['pendingWithdrawal'] as num?)?.toInt() ?? 0,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt:
      json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$WalletModelToJson(WalletModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'balance': instance.balance,
      'currency': instance.currency,
      'totalEarnings': instance.totalEarnings,
      'totalWithdrawals': instance.totalWithdrawals,
      'pendingWithdrawal': instance.pendingWithdrawal,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };

TransactionModel _$TransactionModelFromJson(Map<String, dynamic> json) =>
    TransactionModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: $enumDecode(_$TransactionTypeEnumMap, json['type']),
      status: $enumDecode(_$TransactionStatusEnumMap, json['status']),
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String? ?? 'INR',
      description: json['description'] as String?,
      referenceId: json['referenceId'] as String?,
      competitionId: json['competitionId'] as String?,
      paymentId: json['paymentId'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      completedAt:
          json['completedAt'] == null
              ? null
              : DateTime.parse(json['completedAt'] as String),
    );

Map<String, dynamic> _$TransactionModelToJson(TransactionModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'type': _$TransactionTypeEnumMap[instance.type]!,
      'status': _$TransactionStatusEnumMap[instance.status]!,
      'amount': instance.amount,
      'currency': instance.currency,
      'description': instance.description,
      'referenceId': instance.referenceId,
      'competitionId': instance.competitionId,
      'paymentId': instance.paymentId,
      'metadata': instance.metadata,
      'createdAt': instance.createdAt.toIso8601String(),
      'completedAt': instance.completedAt?.toIso8601String(),
    };

const _$TransactionTypeEnumMap = {
  TransactionType.entryFee: 'entry_fee',
  TransactionType.prize: 'prize',
  TransactionType.withdrawal: 'withdrawal',
  TransactionType.deposit: 'deposit',
  TransactionType.refund: 'refund',
};

const _$TransactionStatusEnumMap = {
  TransactionStatus.pending: 'pending',
  TransactionStatus.processing: 'processing',
  TransactionStatus.completed: 'completed',
  TransactionStatus.failed: 'failed',
  TransactionStatus.cancelled: 'cancelled',
};

BankAccountModel _$BankAccountModelFromJson(Map<String, dynamic> json) =>
    BankAccountModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      accountHolderName: json['accountHolderName'] as String,
      accountNumber: json['accountNumber'] as String,
      ifscCode: json['ifscCode'] as String,
      bankName: json['bankName'] as String,
      branchName: json['branchName'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      isPrimary: json['isPrimary'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$BankAccountModelToJson(BankAccountModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'accountHolderName': instance.accountHolderName,
      'accountNumber': instance.accountNumber,
      'ifscCode': instance.ifscCode,
      'bankName': instance.bankName,
      'branchName': instance.branchName,
      'isVerified': instance.isVerified,
      'isPrimary': instance.isPrimary,
      'createdAt': instance.createdAt.toIso8601String(),
    };

PaymentOrderModel _$PaymentOrderModelFromJson(Map<String, dynamic> json) =>
    PaymentOrderModel(
      orderId: json['orderId'] as String,
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String? ?? 'INR',
      receipt: json['receipt'] as String?,
      status: json['status'] as String,
      notes: json['notes'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$PaymentOrderModelToJson(PaymentOrderModel instance) =>
    <String, dynamic>{
      'orderId': instance.orderId,
      'amount': instance.amount,
      'currency': instance.currency,
      'receipt': instance.receipt,
      'status': instance.status,
      'notes': instance.notes,
    };

CreatePaymentOrderRequest _$CreatePaymentOrderRequestFromJson(
  Map<String, dynamic> json,
) => CreatePaymentOrderRequest(
  amount: (json['amount'] as num).toInt(),
  purpose: json['purpose'] as String,
  competitionId: json['competitionId'] as String?,
  metadata: json['metadata'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$CreatePaymentOrderRequestToJson(
  CreatePaymentOrderRequest instance,
) => <String, dynamic>{
  'amount': instance.amount,
  'purpose': instance.purpose,
  'competitionId': instance.competitionId,
  'metadata': instance.metadata,
};

VerifyPaymentRequest _$VerifyPaymentRequestFromJson(
  Map<String, dynamic> json,
) => VerifyPaymentRequest(
  orderId: json['orderId'] as String,
  paymentId: json['paymentId'] as String,
  signature: json['signature'] as String,
);

Map<String, dynamic> _$VerifyPaymentRequestToJson(
  VerifyPaymentRequest instance,
) => <String, dynamic>{
  'orderId': instance.orderId,
  'paymentId': instance.paymentId,
  'signature': instance.signature,
};

WithdrawalRequest _$WithdrawalRequestFromJson(Map<String, dynamic> json) =>
    WithdrawalRequest(
      amount: (json['amount'] as num).toInt(),
      bankAccountId: json['bankAccountId'] as String,
    );

Map<String, dynamic> _$WithdrawalRequestToJson(WithdrawalRequest instance) =>
    <String, dynamic>{
      'amount': instance.amount,
      'bankAccountId': instance.bankAccountId,
    };

AddBankAccountRequest _$AddBankAccountRequestFromJson(
  Map<String, dynamic> json,
) => AddBankAccountRequest(
  accountHolderName: json['accountHolderName'] as String,
  accountNumber: json['accountNumber'] as String,
  ifscCode: json['ifscCode'] as String,
  bankName: json['bankName'] as String,
  branchName: json['branchName'] as String?,
);

Map<String, dynamic> _$AddBankAccountRequestToJson(
  AddBankAccountRequest instance,
) => <String, dynamic>{
  'accountHolderName': instance.accountHolderName,
  'accountNumber': instance.accountNumber,
  'ifscCode': instance.ifscCode,
  'bankName': instance.bankName,
  'branchName': instance.branchName,
};

UpiIdModel _$UpiIdModelFromJson(Map<String, dynamic> json) => UpiIdModel(
  id: json['id'] as String,
  upiId: json['upiId'] as String,
  name: json['name'] as String?,
  isPrimary: json['isPrimary'] as bool? ?? false,
  isVerified: json['isVerified'] as bool? ?? false,
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$UpiIdModelToJson(UpiIdModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'upiId': instance.upiId,
      'name': instance.name,
      'isPrimary': instance.isPrimary,
      'isVerified': instance.isVerified,
      'createdAt': instance.createdAt.toIso8601String(),
    };

EarningsModel _$EarningsModelFromJson(Map<String, dynamic> json) =>
    EarningsModel(
      totalEarnings: (json['totalEarnings'] as num?)?.toInt() ?? 0,
      competitionEarnings: (json['competitionEarnings'] as num?)?.toInt() ?? 0,
      referralEarnings: (json['referralEarnings'] as num?)?.toInt() ?? 0,
      bonusEarnings: (json['bonusEarnings'] as num?)?.toInt() ?? 0,
      currency: json['currency'] as String? ?? 'INR',
      periodStart:
          json['periodStart'] == null
              ? null
              : DateTime.parse(json['periodStart'] as String),
      periodEnd:
          json['periodEnd'] == null
              ? null
              : DateTime.parse(json['periodEnd'] as String),
    );

Map<String, dynamic> _$EarningsModelToJson(EarningsModel instance) =>
    <String, dynamic>{
      'totalEarnings': instance.totalEarnings,
      'competitionEarnings': instance.competitionEarnings,
      'referralEarnings': instance.referralEarnings,
      'bonusEarnings': instance.bonusEarnings,
      'currency': instance.currency,
      'periodStart': instance.periodStart?.toIso8601String(),
      'periodEnd': instance.periodEnd?.toIso8601String(),
    };

EarningsBreakdownModel _$EarningsBreakdownModelFromJson(
  Map<String, dynamic> json,
) => EarningsBreakdownModel(
  items:
      (json['items'] as List<dynamic>?)
          ?.map(
            (e) => EarningsBreakdownItem.fromJson(e as Map<String, dynamic>),
          )
          .toList() ??
      const [],
  total: (json['total'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$EarningsBreakdownModelToJson(
  EarningsBreakdownModel instance,
) => <String, dynamic>{'items': instance.items, 'total': instance.total};

EarningsBreakdownItem _$EarningsBreakdownItemFromJson(
  Map<String, dynamic> json,
) => EarningsBreakdownItem(
  category: json['category'] as String,
  amount: (json['amount'] as num).toInt(),
  count: (json['count'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$EarningsBreakdownItemToJson(
  EarningsBreakdownItem instance,
) => <String, dynamic>{
  'category': instance.category,
  'amount': instance.amount,
  'count': instance.count,
};

RewardModel _$RewardModelFromJson(Map<String, dynamic> json) => RewardModel(
  id: json['id'] as String,
  title: json['title'] as String,
  description: json['description'] as String?,
  amount: (json['amount'] as num).toInt(),
  type: json['type'] as String,
  expiresAt:
      json['expiresAt'] == null
          ? null
          : DateTime.parse(json['expiresAt'] as String),
  isClaimed: json['isClaimed'] as bool? ?? false,
);

Map<String, dynamic> _$RewardModelToJson(RewardModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'amount': instance.amount,
      'type': instance.type,
      'expiresAt': instance.expiresAt?.toIso8601String(),
      'isClaimed': instance.isClaimed,
    };

ReferralInfoModel _$ReferralInfoModelFromJson(Map<String, dynamic> json) =>
    ReferralInfoModel(
      referralCode: json['referralCode'] as String?,
      shareUrl: json['shareUrl'] as String?,
      totalReferrals: (json['totalReferrals'] as num?)?.toInt() ?? 0,
      successfulReferrals: (json['successfulReferrals'] as num?)?.toInt() ?? 0,
      totalEarnings: (json['totalEarnings'] as num?)?.toInt() ?? 0,
      pendingEarnings: (json['pendingEarnings'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$ReferralInfoModelToJson(ReferralInfoModel instance) =>
    <String, dynamic>{
      'referralCode': instance.referralCode,
      'shareUrl': instance.shareUrl,
      'totalReferrals': instance.totalReferrals,
      'successfulReferrals': instance.successfulReferrals,
      'totalEarnings': instance.totalEarnings,
      'pendingEarnings': instance.pendingEarnings,
    };

KycStatusModel _$KycStatusModelFromJson(Map<String, dynamic> json) =>
    KycStatusModel(
      status:
          $enumDecodeNullable(_$KycStatusEnumMap, json['status']) ??
          KycStatus.notSubmitted,
      rejectionReason: json['rejectionReason'] as String?,
      submittedAt:
          json['submittedAt'] == null
              ? null
              : DateTime.parse(json['submittedAt'] as String),
      verifiedAt:
          json['verifiedAt'] == null
              ? null
              : DateTime.parse(json['verifiedAt'] as String),
      documents:
          json['documents'] == null
              ? null
              : KycDocuments.fromJson(
                json['documents'] as Map<String, dynamic>,
              ),
    );

Map<String, dynamic> _$KycStatusModelToJson(KycStatusModel instance) =>
    <String, dynamic>{
      'status': _$KycStatusEnumMap[instance.status]!,
      'rejectionReason': instance.rejectionReason,
      'submittedAt': instance.submittedAt?.toIso8601String(),
      'verifiedAt': instance.verifiedAt?.toIso8601String(),
      'documents': instance.documents,
    };

const _$KycStatusEnumMap = {
  KycStatus.notSubmitted: 'not_submitted',
  KycStatus.pending: 'pending',
  KycStatus.verified: 'verified',
  KycStatus.rejected: 'rejected',
};

KycDocuments _$KycDocumentsFromJson(Map<String, dynamic> json) => KycDocuments(
  panNumber: json['panNumber'] as String?,
  aadhaarNumber: json['aadhaarNumber'] as String?,
  panImageUrl: json['panImageUrl'] as String?,
  aadhaarFrontUrl: json['aadhaarFrontUrl'] as String?,
  aadhaarBackUrl: json['aadhaarBackUrl'] as String?,
  selfieUrl: json['selfieUrl'] as String?,
);

Map<String, dynamic> _$KycDocumentsToJson(KycDocuments instance) =>
    <String, dynamic>{
      'panNumber': instance.panNumber,
      'aadhaarNumber': instance.aadhaarNumber,
      'panImageUrl': instance.panImageUrl,
      'aadhaarFrontUrl': instance.aadhaarFrontUrl,
      'aadhaarBackUrl': instance.aadhaarBackUrl,
      'selfieUrl': instance.selfieUrl,
    };

KycSubmissionRequest _$KycSubmissionRequestFromJson(
  Map<String, dynamic> json,
) => KycSubmissionRequest(
  panNumber: json['panNumber'] as String,
  aadhaarNumber: json['aadhaarNumber'] as String,
  panImageBase64: json['panImageBase64'] as String,
  aadhaarFrontBase64: json['aadhaarFrontBase64'] as String,
  aadhaarBackBase64: json['aadhaarBackBase64'] as String,
  selfieBase64: json['selfieBase64'] as String,
);

Map<String, dynamic> _$KycSubmissionRequestToJson(
  KycSubmissionRequest instance,
) => <String, dynamic>{
  'panNumber': instance.panNumber,
  'aadhaarNumber': instance.aadhaarNumber,
  'panImageBase64': instance.panImageBase64,
  'aadhaarFrontBase64': instance.aadhaarFrontBase64,
  'aadhaarBackBase64': instance.aadhaarBackBase64,
  'selfieBase64': instance.selfieBase64,
};
