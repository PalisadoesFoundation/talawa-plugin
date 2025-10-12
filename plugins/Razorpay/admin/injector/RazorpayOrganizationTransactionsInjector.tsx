/**
 * Razorpay Organization Transactions Injector (G2)
 *
 * This component is specifically designed for the G2 extension point to display
 * Razorpay payment provider transactions for organization admins in their transaction management.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  CreditCardOutlined,
  EyeOutlined,
  DownloadOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface RazorpayOrganizationTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'captured' | 'authorized' | 'failed' | 'refunded';
  description: string;
  createdAt: string;
  userEmail: string;
  userName: string;
  paymentMethod: string;
  fees: number;
}

const RazorpayOrganizationTransactionsInjector: React.FC = () => {
  const [transactions, setTransactions] = useState<
    RazorpayOrganizationTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    successRate: 0,
    totalFees: 0,
  });

  useEffect(() => {
    // Simulate loading Razorpay organization transactions
    // In a real implementation, this would fetch from the API
    const mockTransactions: RazorpayOrganizationTransaction[] = [
      {
        id: 'txn_123456789',
        amount: 1000,
        currency: 'INR',
        status: 'captured',
        description: 'Donation from John Doe',
        createdAt: '2024-01-15T10:30:00Z',
        userEmail: 'john.doe@example.com',
        userName: 'John Doe',
        paymentMethod: 'Card',
        fees: 20,
      },
      {
        id: 'txn_987654321',
        amount: 500,
        currency: 'INR',
        status: 'captured',
        description: 'Event Registration Fee',
        createdAt: '2024-01-14T15:45:00Z',
        userEmail: 'jane.smith@example.com',
        userName: 'Jane Smith',
        paymentMethod: 'UPI',
        fees: 10,
      },
      {
        id: 'txn_456789123',
        amount: 2000,
        currency: 'INR',
        status: 'refunded',
        description: 'Donation from Bob Wilson',
        createdAt: '2024-01-13T09:20:00Z',
        userEmail: 'bob.wilson@example.com',
        userName: 'Bob Wilson',
        paymentMethod: 'Net Banking',
        fees: 40,
      },
      {
        id: 'txn_789123456',
        amount: 750,
        currency: 'INR',
        status: 'captured',
        description: 'Membership Fee',
        createdAt: '2024-01-12T14:15:00Z',
        userEmail: 'alice.brown@example.com',
        userName: 'Alice Brown',
        paymentMethod: 'Card',
        fees: 15,
      },
      {
        id: 'txn_321654987',
        amount: 1500,
        currency: 'INR',
        status: 'captured',
        description: 'Workshop Registration',
        createdAt: '2024-01-11T11:20:00Z',
        userEmail: 'charlie.davis@example.com',
        userName: 'Charlie Davis',
        paymentMethod: 'UPI',
        fees: 30,
      },
    ];

    setTimeout(() => {
      setTransactions(mockTransactions);

      // Calculate stats for admin view
      const totalAmount = mockTransactions
        .filter((t) => t.status === 'captured')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalTransactions = mockTransactions.length;
      const successfulTransactions = mockTransactions.filter(
        (t) => t.status === 'captured',
      ).length;
      const successRate =
        totalTransactions > 0
          ? (successfulTransactions / totalTransactions) * 100
          : 0;

      const totalFees = mockTransactions
        .filter((t) => t.status === 'captured')
        .reduce((sum, t) => sum + t.fees, 0);

      setStats({
        totalAmount,
        totalTransactions,
        successRate,
        totalFees,
      });

      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'captured':
        return 'success';
      case 'authorized':
        return 'processing';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (transaction: RazorpayOrganizationTransaction) => {
    message.info(`Viewing details for transaction: ${transaction.id}`);
    // In a real implementation, this would open a modal or navigate to details
  };

  const handleDownloadReceipt = (
    transaction: RazorpayOrganizationTransaction,
  ) => {
    message.success(`Downloading receipt for transaction: ${transaction.id}`);
    // In a real implementation, this would download the receipt
  };

  const columns: ColumnsType<RazorpayOrganizationTransaction> = [
    {
      title: 'Transaction ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {id}
        </Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: RazorpayOrganizationTransaction) => (
        <Text strong>{formatAmount(amount, record.currency)}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record: RazorpayOrganizationTransaction) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.userName}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.userEmail}
          </Text>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
    },
    {
      title: 'Fees',
      dataIndex: 'fees',
      key: 'fees',
      render: (fees: number, record: RazorpayOrganizationTransaction) => (
        <Text type="secondary">{formatAmount(fees, record.currency)}</Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: RazorpayOrganizationTransaction) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadReceipt(record)}
            size="small"
          >
            Receipt
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Loading Razorpay organization transactions...</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ marginBottom: '16px' }}>
        <Space align="center">
          <CreditCardOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            Razorpay Organization Transactions
          </Title>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
          Payment transactions for your organization processed through Razorpay
        </Text>
      </div>

      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Amount"
              value={stats.totalAmount / 100}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="INR"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Transactions"
              value={stats.totalTransactions}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Success Rate"
              value={stats.successRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Fees"
              value={stats.totalFees / 100}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="INR"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={transactions}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} transactions`,
        }}
        scroll={{ x: 1000 }}
      />
    </Card>
  );
};

export default RazorpayOrganizationTransactionsInjector;
