import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

/// Transaction model for wallet
class TransactionModel {
  final String id;
  final String type; // 'credit', 'debit'
  final String category; // 'competition_win', 'competition_entry', 'add_money', 'withdraw', 'refund'
  final double amount;
  final String description;
  final DateTime createdAt;
  final String status; // 'completed', 'pending', 'failed'

  const TransactionModel({
    required this.id,
    required this.type,
    required this.category,
    required this.amount,
    required this.description,
    required this.createdAt,
    this.status = 'completed',
  });
}

/// Dummy transactions
final List<TransactionModel> _dummyTransactions = [
  TransactionModel(
    id: 'txn_001',
    type: 'credit',
    category: 'competition_win',
    amount: 5000,
    description: 'Won 1st place in "Best Dance Challenge 2024"',
    createdAt: DateTime.now().subtract(const Duration(hours: 2)),
  ),
  TransactionModel(
    id: 'txn_002',
    type: 'debit',
    category: 'competition_entry',
    amount: 100,
    description: 'Entry fee for "Singing Star"',
    createdAt: DateTime.now().subtract(const Duration(days: 1)),
  ),
  TransactionModel(
    id: 'txn_003',
    type: 'credit',
    category: 'add_money',
    amount: 500,
    description: 'Added via UPI',
    createdAt: DateTime.now().subtract(const Duration(days: 2)),
  ),
  TransactionModel(
    id: 'txn_004',
    type: 'credit',
    category: 'competition_win',
    amount: 2000,
    description: 'Won 3rd place in "Comedy King"',
    createdAt: DateTime.now().subtract(const Duration(days: 3)),
  ),
  TransactionModel(
    id: 'txn_005',
    type: 'debit',
    category: 'withdraw',
    amount: 3000,
    description: 'Withdrawn to bank account',
    createdAt: DateTime.now().subtract(const Duration(days: 5)),
  ),
  TransactionModel(
    id: 'txn_006',
    type: 'credit',
    category: 'refund',
    amount: 50,
    description: 'Refund for cancelled competition',
    createdAt: DateTime.now().subtract(const Duration(days: 7)),
  ),
  TransactionModel(
    id: 'txn_007',
    type: 'debit',
    category: 'competition_entry',
    amount: 200,
    description: 'Entry fee for "Fashion Icon"',
    createdAt: DateTime.now().subtract(const Duration(days: 10)),
  ),
];

/// Wallet state provider
final walletProvider = StateNotifierProvider<WalletNotifier, WalletState>((ref) {
  return WalletNotifier();
});

class WalletState {
  final double balance;
  final double totalEarnings;
  final double totalSpent;
  final List<TransactionModel> transactions;
  final bool isLoading;

  const WalletState({
    this.balance = 4450.0,
    this.totalEarnings = 7550.0,
    this.totalSpent = 3100.0,
    this.transactions = const [],
    this.isLoading = false,
  });

  WalletState copyWith({
    double? balance,
    double? totalEarnings,
    double? totalSpent,
    List<TransactionModel>? transactions,
    bool? isLoading,
  }) {
    return WalletState(
      balance: balance ?? this.balance,
      totalEarnings: totalEarnings ?? this.totalEarnings,
      totalSpent: totalSpent ?? this.totalSpent,
      transactions: transactions ?? this.transactions,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class WalletNotifier extends StateNotifier<WalletState> {
  WalletNotifier() : super(WalletState(transactions: _dummyTransactions));

  void addMoney(double amount) {
    final newTransaction = TransactionModel(
      id: 'txn_${DateTime.now().millisecondsSinceEpoch}',
      type: 'credit',
      category: 'add_money',
      amount: amount,
      description: 'Added via UPI',
      createdAt: DateTime.now(),
    );
    state = state.copyWith(
      balance: state.balance + amount,
      transactions: [newTransaction, ...state.transactions],
    );
  }

  void withdraw(double amount) {
    if (amount > state.balance) return;
    final newTransaction = TransactionModel(
      id: 'txn_${DateTime.now().millisecondsSinceEpoch}',
      type: 'debit',
      category: 'withdraw',
      amount: amount,
      description: 'Withdrawn to bank account',
      createdAt: DateTime.now(),
      status: 'pending',
    );
    state = state.copyWith(
      balance: state.balance - amount,
      transactions: [newTransaction, ...state.transactions],
    );
  }
}

/// Main wallet page showing balance and quick actions
class WalletPage extends ConsumerStatefulWidget {
  const WalletPage({super.key});

  @override
  ConsumerState<WalletPage> createState() => _WalletPageState();
}

class _WalletPageState extends ConsumerState<WalletPage> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  Future<void> _loadWallet() async {
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _refresh() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final wallet = ref.watch(walletProvider);
    final currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Wallet'),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () => _showWalletInfo(context),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refresh,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Balance card
                    _buildBalanceCard(context, wallet, currencyFormat),
                    const SizedBox(height: 16),
                    
                    // Stats row
                    _buildStatsRow(context, wallet, currencyFormat),
                    const SizedBox(height: 24),
                    
                    // Quick actions
                    _buildQuickActions(context),
                    const SizedBox(height: 24),
                    
                    // Transactions
                    _buildTransactionsSection(context, wallet, currencyFormat),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildBalanceCard(BuildContext context, WalletState wallet, NumberFormat format) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withValues(alpha: 0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            'Available Balance',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            format.format(wallet.balance),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildBalanceAction(
                Icons.add,
                'Add Money',
                () => _showAddMoneySheet(context),
              ),
              Container(
                width: 1,
                height: 40,
                color: Colors.white24,
              ),
              _buildBalanceAction(
                Icons.arrow_upward,
                'Withdraw',
                () => _showWithdrawSheet(context, wallet.balance),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceAction(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 28),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsRow(BuildContext context, WalletState wallet, NumberFormat format) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            context,
            'Total Earnings',
            format.format(wallet.totalEarnings),
            Icons.trending_up,
            Colors.green,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            context,
            'Total Spent',
            format.format(wallet.totalSpent),
            Icons.trending_down,
            Colors.orange,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 16),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildQuickActionItem(
              context,
              Icons.emoji_events,
              'Join\nCompetition',
              Colors.amber,
              () => Navigator.pushNamed(context, '/competitions'),
            ),
            _buildQuickActionItem(
              context,
              Icons.history,
              'Transaction\nHistory',
              Colors.blue,
              () => _showAllTransactions(context),
            ),
            _buildQuickActionItem(
              context,
              Icons.card_giftcard,
              'Rewards\n& Offers',
              Colors.purple,
              () => _showRewards(context),
            ),
            _buildQuickActionItem(
              context,
              Icons.help_outline,
              'Help &\nSupport',
              Colors.teal,
              () => _showWalletHelp(context),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActionItem(
    BuildContext context,
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionsSection(
    BuildContext context,
    WalletState wallet,
    NumberFormat format,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Transactions',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            TextButton(
              onPressed: () => _showAllTransactions(context),
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (wallet.transactions.isEmpty)
          Center(
            child: Column(
              children: [
                const SizedBox(height: 32),
                Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey.shade400),
                const SizedBox(height: 12),
                Text(
                  'No transactions yet',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
                const SizedBox(height: 8),
                FilledButton.tonal(
                  onPressed: () => _showAddMoneySheet(context),
                  child: const Text('Add Money'),
                ),
              ],
            ),
          )
        else
          ...wallet.transactions.take(5).map(
                (txn) => _buildTransactionTile(context, txn, format),
              ),
      ],
    );
  }

  Widget _buildTransactionTile(
    BuildContext context,
    TransactionModel txn,
    NumberFormat format,
  ) {
    final isCredit = txn.type == 'credit';
    final icon = _getTransactionIcon(txn.category);
    final color = isCredit ? Colors.green : Colors.red;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        txn.description,
        style: const TextStyle(fontSize: 14),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        _formatDate(txn.createdAt),
        style: TextStyle(
          fontSize: 12,
          color: Colors.grey.shade600,
        ),
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            '${isCredit ? '+' : '-'}${format.format(txn.amount)}',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (txn.status != 'completed')
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                txn.status.toUpperCase(),
                style: const TextStyle(
                  fontSize: 9,
                  color: Colors.orange,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }

  IconData _getTransactionIcon(String category) {
    switch (category) {
      case 'competition_win':
        return Icons.emoji_events;
      case 'competition_entry':
        return Icons.sports_score;
      case 'add_money':
        return Icons.add_circle;
      case 'withdraw':
        return Icons.account_balance;
      case 'refund':
        return Icons.replay;
      default:
        return Icons.swap_horiz;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      return 'Today, ${DateFormat.jm().format(date)}';
    } else if (diff.inDays == 1) {
      return 'Yesterday, ${DateFormat.jm().format(date)}';
    } else if (diff.inDays < 7) {
      return DateFormat('EEEE, h:mm a').format(date);
    } else {
      return DateFormat('MMM d, yyyy').format(date);
    }
  }

  // Bottom sheets and dialogs
  void _showAddMoneySheet(BuildContext context) {
    final amountController = TextEditingController();
    final amounts = [100, 200, 500, 1000, 2000, 5000];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Add Money',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Enter Amount',
                    prefixText: '₹ ',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: amounts.map((amount) {
                    return ActionChip(
                      label: Text('₹$amount'),
                      onPressed: () {
                        amountController.text = amount.toString();
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {
                      final amount = double.tryParse(amountController.text);
                      if (amount != null && amount > 0) {
                        ref.read(walletProvider.notifier).addMoney(amount);
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('₹${amount.toStringAsFixed(0)} added successfully!'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      }
                    },
                    child: const Text('Add Money'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showWithdrawSheet(BuildContext context, double balance) {
    final amountController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Withdraw Money',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Available: ₹${balance.toStringAsFixed(2)}',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Enter Amount',
                    prefixText: '₹ ',
                    border: const OutlineInputBorder(),
                    suffixIcon: TextButton(
                      onPressed: () {
                        amountController.text = balance.toStringAsFixed(0);
                      },
                      child: const Text('MAX'),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue, size: 20),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Minimum withdrawal: ₹100\nProcessing time: 1-3 business days',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {
                      final amount = double.tryParse(amountController.text);
                      if (amount != null && amount >= 100 && amount <= balance) {
                        ref.read(walletProvider.notifier).withdraw(amount);
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Withdrawal of ₹${amount.toStringAsFixed(0)} initiated'),
                            backgroundColor: Colors.orange,
                          ),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Invalid amount'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    },
                    child: const Text('Withdraw'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showAllTransactions(BuildContext context) {
    final wallet = ref.read(walletProvider);
    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const Text('All Transactions'),
            actions: [
              IconButton(
                icon: const Icon(Icons.filter_list),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Filter coming soon')),
                  );
                },
              ),
            ],
          ),
          body: wallet.transactions.isEmpty
              ? const Center(child: Text('No transactions'))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: wallet.transactions.length,
                  separatorBuilder: (_, __) => const Divider(),
                  itemBuilder: (context, index) {
                    return _buildTransactionTile(
                      context,
                      wallet.transactions[index],
                      format,
                    );
                  },
                ),
        ),
      ),
    );
  }

  void _showRewards(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.card_giftcard, size: 64, color: Colors.purple),
              const SizedBox(height: 16),
              const Text(
                'Rewards Coming Soon!',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Win competitions to earn exclusive rewards and offers.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade600),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  void _showWalletHelp(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(title: const Text('Wallet Help')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildHelpItem(
                'How to add money?',
                'Tap "Add Money" and enter the amount. You can pay using UPI, cards, or net banking.',
              ),
              _buildHelpItem(
                'How to withdraw?',
                'Tap "Withdraw" and enter the amount. Minimum withdrawal is ₹100. Money will be transferred to your linked bank account in 1-3 business days.',
              ),
              _buildHelpItem(
                'How do I earn money?',
                'Participate and win competitions! Prize money is automatically credited to your wallet.',
              ),
              _buildHelpItem(
                'Is my money safe?',
                'Yes! All transactions are secure and encrypted. Your wallet balance is protected.',
              ),
              _buildHelpItem(
                'What if my withdrawal fails?',
                'Failed withdrawals are automatically refunded to your wallet within 24 hours.',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHelpItem(String question, String answer) {
    return ExpansionTile(
      title: Text(question, style: const TextStyle(fontWeight: FontWeight.w600)),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Text(answer, style: TextStyle(color: Colors.grey.shade700)),
        ),
      ],
    );
  }

  void _showWalletInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About Wallet'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('💰 Add money via UPI, cards, or net banking'),
            SizedBox(height: 8),
            Text('🏆 Win competitions to earn prize money'),
            SizedBox(height: 8),
            Text('💸 Withdraw to your bank account anytime'),
            SizedBox(height: 8),
            Text('🔒 100% secure transactions'),
          ],
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }
}
