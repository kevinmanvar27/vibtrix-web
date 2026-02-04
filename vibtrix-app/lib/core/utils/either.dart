import '../error/failures.dart';

/// A simple Either type for functional error handling
/// Left represents failure, Right represents success
sealed class Either<L, R> {
  const Either();

  /// Returns true if this is a Left (failure)
  bool get isLeft => this is Left<L, R>;

  /// Returns true if this is a Right (success)
  bool get isRight => this is Right<L, R>;

  /// Gets the left value or throws if this is Right
  L get left => (this as Left<L, R>).value;

  /// Gets the right value or throws if this is Left
  R get right => (this as Right<L, R>).value;

  /// Fold the Either into a single value
  T fold<T>(T Function(L left) onLeft, T Function(R right) onRight) {
    return switch (this) {
      Left(value: final l) => onLeft(l),
      Right(value: final r) => onRight(r),
    };
  }

  /// Map the right value
  Either<L, T> map<T>(T Function(R right) f) {
    return switch (this) {
      Left(value: final l) => Left(l),
      Right(value: final r) => Right(f(r)),
    };
  }

  /// Map the left value
  Either<T, R> mapLeft<T>(T Function(L left) f) {
    return switch (this) {
      Left(value: final l) => Left(f(l)),
      Right(value: final r) => Right(r),
    };
  }

  /// FlatMap the right value
  Either<L, T> flatMap<T>(Either<L, T> Function(R right) f) {
    return switch (this) {
      Left(value: final l) => Left(l),
      Right(value: final r) => f(r),
    };
  }

  /// Get right value or default
  R getOrElse(R Function() defaultValue) {
    return switch (this) {
      Left() => defaultValue(),
      Right(value: final r) => r,
    };
  }

  /// Get right value or null
  R? getOrNull() {
    return switch (this) {
      Left() => null,
      Right(value: final r) => r,
    };
  }
}

/// Left side of Either (typically represents failure)
final class Left<L, R> extends Either<L, R> {
  final L value;
  const Left(this.value);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Left<L, R> &&
          runtimeType == other.runtimeType &&
          value == other.value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => 'Left($value)';
}

/// Right side of Either (typically represents success)
final class Right<L, R> extends Either<L, R> {
  final R value;
  const Right(this.value);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Right<L, R> &&
          runtimeType == other.runtimeType &&
          value == other.value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => 'Right($value)';
}

/// Type alias for repository results
typedef Result<T> = Either<Failure, T>;
