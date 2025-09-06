/**
 * Razorpay Injector Component
 *
 * This component injects Razorpay payment provider functionality into extension points.
 * It handles both G1 (user transactions) and G2 (organization transactions) extension points.
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Typography, message, Spin, Statistic, Row, Col } from 'antd';
import { CreditCardOutlined, EyeOutlined, DownloadOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface RazorpayTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'captured' | 'authorized' | 'failed' | 'refunded';
  description: string;
  createdAt: string;
  organizationName?: string;
  userEmail?: string;
  userName?: string;
  paymentMethod: string;
  fees?: number;
}

interface RazorpayInjectorProps {
  extensionPointId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'small' | 'default' | 'large';
  showBadge?: boolean;
}

const RazorpayInjector: React.FC<RazorpayInjectorProps> = ({
  extensionPointId = 'G1',
  position = 'top',
  size = 'default',
  showBadge = true,
}) => {
  const [transactions, setTransactions] = useState<RazorpayTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    successRate: 0,
    totalFees: 0
  });

  const isUserView = extensionPointId === 'G1';
  const isAdminView = extensionPointId === 'G2';

  useEffect(() => {
    // Simulate loading Razorpay transactions based on extension point
    const mockUserTransactions: RazorpayTransaction[] = [
      {
        id: 'txn_123456789',
        amount: 1000,
        currency: 'INR',
        status: 'captured',
        description: 'Donation to Organization A',
        createdAt: '2024-01-15T10:30:00Z',
        organizationName: 'Organization A',
        paymentMethod: 'Card'
      },
      {
        id: 'txn_987654321',
        amount: 500,
        currency: 'INR',
        status: 'captured',
        description: 'Event Registration Fee',
        createdAt: '2024-01-14T15:45:00Z',
        organizationName: 'Organization B',
        paymentMethod: 'UPI'
      },
      {
        id: 'txn_456789123',
        amount: 2000,
        currency: 'INR',
        status: 'refunded',
        description: 'Donation to Organization C',
        createdAt: '2024-01-13T09:20:00Z',
        organizationName: 'Organization C',
        paymentMethod: 'Net Banking'
      }
    ];

    const mockAdminTransactions: RazorpayTransaction[] = [
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
        fees: 20
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
        fees: 10
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
        fees: 40
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
        fees: 15
      }
    ];

    const mockTransactions = isUserView ? mockUserTransactions : mockAdminTransactions;

    setTimeout(() => {
      setTransactions(mockTransactions);
      
      if (isAdminView) {
        // Calculate stats for admin view
        const totalAmount = mockTransactions
          .filter(t => t.status === 'captured')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalTransactions = mockTransactions.length;
        const successfulTransactions = mockTransactions.filter(t => t.status === 'captured').length;
        const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
        
        const totalFees = mockTransactions
          .filter(t => t.status === 'captured')
          .reduce((sum, t) => sum + (t.fees || 0), 0);

        setStats({
          totalAmount,
          totalTransactions,
          successRate,
          totalFees
        });
      }
      
      setLoading(false);
    }, 1000);
  }, [isUserView, isAdminView]);

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
      minute: '2-digit'
    });
  };

  const handleViewDetails = (transaction: RazorpayTransaction) => {
    message.info(`Viewing details for transaction: ${transaction.id}`);
  };

  const handleDownloadReceipt = (transaction: RazorpayTransaction) => {
    message.success(`Downloading receipt for transaction: ${transaction.id}`);
  };

  const getUserColumns = (): ColumnsType<RazorpayTransaction> => [
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
      render: (amount: number, record: RazorpayTransaction) => (
        <Text strong>
          {formatAmount(amount, record.currency)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Organization',
      dataIndex: 'organizationName',
      key: 'organizationName',
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
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: RazorpayTransaction) => (
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

  const getAdminColumns = (): ColumnsType<RazorpayTransaction> => [
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
      render: (amount: number, record: RazorpayTransaction) => (
        <Text strong>
          {formatAmount(amount, record.currency)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record: RazorpayTransaction) => (
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
      render: (fees: number, record: RazorpayTransaction) => (
        <Text type="secondary">
          {formatAmount(fees || 0, record.currency)}
        </Text>
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
      render: (_, record: RazorpayTransaction) => (
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
            <Text>Loading Razorpay transactions...</Text>
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
            {isUserView ? 'Razorpay Transactions' : 'Razorpay Organization Transactions'}
          </Title>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
          {isUserView 
            ? 'Your payment transactions processed through Razorpay'
            : 'Payment transactions for your organization processed through Razorpay'
          }
        </Text>
      </div>

      {/* Statistics Row for Admin View */}
      {isAdminView && (
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
      )}

      <Table
        columns={isUserView ? getUserColumns() : getAdminColumns()}
        dataSource={transactions}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} transactions`,
        }}
        scroll={{ x: isAdminView ? 1000 : 800 }}
      />
    </Card>
  );
};

export default RazorpayInjector;
