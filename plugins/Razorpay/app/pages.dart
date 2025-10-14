import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:talawa/locator.dart';
import 'package:talawa/services/user_config.dart';
import 'package:talawa/services/graphql_config.dart';
import 'package:intl/intl.dart';

/// Razorpay Donation Page
/// 
/// Allows users to make donations to the current organization
class RazorpayDonationPage extends StatefulWidget {
  const RazorpayDonationPage({super.key});

  @override
  State<RazorpayDonationPage> createState() => _RazorpayDonationPageState();
}

class _RazorpayDonationPageState extends State<RazorpayDonationPage> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _messageController = TextEditingController();
  
  String _selectedCurrency = 'INR';
  final List<int> _quickAmounts = [100, 500, 1000, 2000, 5000];
  
  @override
  void initState() {
    super.initState();
    // Pre-fill user data
    final userConfig = locator<UserConfig>();
    final user = userConfig.currentUser;
    if (user != null) {
      _nameController.text = '${user.firstName ?? ''} ${user.lastName ?? ''}'.trim();
      _emailController.text = user.email ?? '';
    }
  }
  
  @override
  void dispose() {
    _amountController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  String _getCurrencySymbol(String currency) {
    const symbols = {
      'INR': '₹',
      'USD': '\$',
      'EUR': '€',
      'GBP': '£',
    };
    return symbols[currency] ?? currency;
  }

  String _formatAmount(double amount, String currency) {
    final formatter = NumberFormat.currency(
      symbol: _getCurrencySymbol(currency),
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }

  @override
  Widget build(BuildContext context) {
    final userConfig = locator<UserConfig>();
    final orgId = userConfig.currentOrg.id;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Make a Donation'),
        backgroundColor: Theme.of(context).primaryColor,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Organization Info Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      if (userConfig.currentOrg.image != null)
                        CircleAvatar(
                          radius: 30,
                          backgroundImage: NetworkImage(userConfig.currentOrg.image!),
                        ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              userConfig.currentOrg.name ?? 'Organization',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            if (userConfig.currentOrg.description != null)
                              Text(
                                userConfig.currentOrg.description!,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.grey[600],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Amount Section
              Text(
                'Donation Amount',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Amount',
                        prefixText: _getCurrencySymbol(_selectedCurrency),
                        border: const OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter an amount';
                        }
                        final amount = double.tryParse(value);
                        if (amount == null || amount <= 0) {
                          return 'Please enter a valid amount';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedCurrency,
                      decoration: const InputDecoration(
                        labelText: 'Currency',
                        border: OutlineInputBorder(),
                      ),
                      items: ['INR', 'USD', 'EUR', 'GBP']
                          .map((currency) => DropdownMenuItem(
                                value: currency,
                                child: Text('$currency (${_getCurrencySymbol(currency)})'),
                              ))
                          .toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedCurrency = value!;
                        });
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Quick Amount Buttons
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _quickAmounts.map((amount) {
                  return OutlinedButton(
                    onPressed: () {
                      _amountController.text = amount.toString();
                    },
                    child: Text(_formatAmount(amount.toDouble(), _selectedCurrency)),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Donor Information
              Text(
                'Your Information',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email Address *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your email';
                  }
                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number (Optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _messageController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Message (Optional)',
                  hintText: 'Add a personal message with your donation',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),

              // Payment Summary
              if (_amountController.text.isNotEmpty)
                Card(
                  color: Colors.grey[100],
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Payment Summary',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Donation Amount:'),
                            Text(
                              _formatAmount(
                                double.tryParse(_amountController.text) ?? 0,
                                _selectedCurrency,
                              ),
                              style: const TextStyle(fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Processing Fee:'),
                            Text(
                              _formatAmount(0, _selectedCurrency),
                              style: const TextStyle(fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                        const Divider(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total Amount:',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              _formatAmount(
                                double.tryParse(_amountController.text) ?? 0,
                                _selectedCurrency,
                              ),
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Theme.of(context).primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 24),

              // Donate Button
              ElevatedButton(
                onPressed: () {
                  if (_formKey.currentState!.validate()) {
                    // TODO: Implement Razorpay payment integration
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Razorpay integration coming soon!'),
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Theme.of(context).primaryColor,
                ),
                child: Text(
                  'Donate ${_amountController.text.isNotEmpty ? _formatAmount(double.tryParse(_amountController.text) ?? 0, _selectedCurrency) : ""}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 16),

              // Security Notice
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      const Icon(Icons.lock, color: Colors.blue),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Secure Payment',
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Your payment information is encrypted and secure. We use Razorpay, a trusted payment gateway.',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Razorpay User Transactions Page
/// 
/// Displays payment transactions made by the user in the current organization
class RazorpayTransactionsPage extends StatelessWidget {
  const RazorpayTransactionsPage({super.key});

  String _getTransactionsQuery() {
    return '''
      query GetUserTransactions(\$userId: String!, \$orgId: String!, \$limit: Int) {
        razorpay_getUserTransactions(userId: \$userId, orgId: \$orgId, limit: \$limit) {
          id
          paymentId
          amount
          currency
          status
          donorName
          donorEmail
          method
          bank
          wallet
          vpa
          contact
          fee
          tax
          errorCode
          errorDescription
          refundStatus
          capturedAt
          createdAt
          updatedAt
        }
      }
    ''';
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'captured':
        return Colors.green;
      case 'authorized':
        return Colors.blue;
      case 'failed':
        return Colors.red;
      case 'refunded':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _formatAmount(int amountInPaise, String currency) {
    final amount = amountInPaise / 100;
    final symbols = {
      'INR': '₹',
      'USD': '\$',
      'EUR': '€',
      'GBP': '£',
    };
    final symbol = symbols[currency] ?? currency;
    return '$symbol ${amount.toStringAsFixed(2)}';
  }

  String _formatDate(String dateString) {
    final date = DateTime.parse(dateString);
    return DateFormat('MMM dd, yyyy HH:mm').format(date);
  }

  @override
  Widget build(BuildContext context) {
    final userConfig = locator<UserConfig>();
    final userId = userConfig.currentUser.id;
    final orgId = userConfig.currentOrg.id;
    final graphqlConfig = locator<GraphqlConfig>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Transactions'),
        backgroundColor: Theme.of(context).primaryColor,
      ),
      body: GraphQLProvider(
        client: ValueNotifier<GraphQLClient>(graphqlConfig.authClient()),
        child: Query(
          options: QueryOptions(
            document: gql(_getTransactionsQuery()),
            variables: {
              'userId': userId,
              'orgId': orgId,
              'limit': 50,
            },
            fetchPolicy: FetchPolicy.networkOnly,
          ),
          builder: (result, {fetchMore, refetch}) {
          if (result.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (result.hasException) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                    const SizedBox(height: 16),
                    Text(
                      'Error loading transactions',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      result.exception.toString(),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => refetch?.call(),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          final transactions = result.data?['razorpay_getUserTransactions'] as List? ?? [];

          if (transactions.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'No transactions yet',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Your payment transactions will appear here',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await refetch?.call();
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: transactions.length,
              itemBuilder: (context, index) {
                final transaction = transactions[index];
                final status = transaction['status'] as String? ?? 'unknown';
                final amount = transaction['amount'] as int? ?? 0;
                final currency = transaction['currency'] as String? ?? 'INR';
                final method = transaction['method'] as String? ?? 'N/A';
                final createdAt = transaction['createdAt'] as String? ?? '';
                final paymentId = transaction['paymentId'] as String? ?? '';

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: InkWell(
                    onTap: () {
                      // TODO: Show transaction details dialog
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Transaction Details'),
                          content: SingleChildScrollView(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _buildDetailRow('Payment ID', paymentId),
                                _buildDetailRow('Amount', _formatAmount(amount, currency)),
                                _buildDetailRow('Status', status.toUpperCase()),
                                _buildDetailRow('Method', method),
                                _buildDetailRow('Date', _formatDate(createdAt)),
                                if (transaction['bank'] != null)
                                  _buildDetailRow('Bank', transaction['bank']),
                                if (transaction['wallet'] != null)
                                  _buildDetailRow('Wallet', transaction['wallet']),
                                if (transaction['errorDescription'] != null)
                                  _buildDetailRow('Error', transaction['errorDescription']),
                              ],
                            ),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Close'),
                            ),
                          ],
                        ),
                      );
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  _formatAmount(amount, currency),
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(status).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  status.toUpperCase(),
                                  style: TextStyle(
                                    color: _getStatusColor(status),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.payment, size: 16, color: Colors.grey[600]),
                              const SizedBox(width: 4),
                              Text(
                                method,
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(width: 16),
                              Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                              const SizedBox(width: 4),
                              Text(
                                _formatDate(createdAt),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          if (paymentId.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              'ID: $paymentId',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey[500],
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
}
