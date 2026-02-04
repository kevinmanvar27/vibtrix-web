import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Page for adding money to wallet
class AddMoneyPage extends ConsumerStatefulWidget {
  const AddMoneyPage({super.key});

  @override
  ConsumerState<AddMoneyPage> createState() => _AddMoneyPageState();
}

class _AddMoneyPageState extends ConsumerState<AddMoneyPage> {
  final _amountController = TextEditingController();

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Money'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Amount',
                prefixText: '₹ ',
                border: OutlineInputBorder(),
                hintText: 'Enter amount',
              ),
            ),
            const SizedBox(height: 16),
            // Quick amount buttons
            Wrap(
              spacing: 8,
              children: [100, 500, 1000, 2000, 5000].map((amount) {
                return ActionChip(
                  label: Text('₹$amount'),
                  onPressed: () {
                    _amountController.text = amount.toString();
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            const Text(
              'Payment Method',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(Icons.credit_card),
              title: const Text('Razorpay'),
              subtitle: const Text('UPI, Cards, Net Banking'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // TODO: Select payment method
              },
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  // TODO: Process payment
                },
                child: const Text('Add Money'),
              ),
            ),
            const SizedBox(height: 8),
            const Center(
              child: Text(
                'Secured by Razorpay',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
