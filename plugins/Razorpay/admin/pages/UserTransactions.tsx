/**
 * User Transactions Page for Razorpay Plugin
 *
 * This component provides a global view of all user transactions across all organizations
 * processed through Razorpay. It allows users to see their complete transaction history
 * in one place, regardless of which organization the transactions were made to.
 */

import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
// @ts-expect-error - Apollo Client v4 types issue
import { useQuery } from '@apollo/client';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
} from 'antd';
import {
  CreditCardOutlined,
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useParams, Navigate } from 'react-router-dom';
import useLocalStorage from '../../../../__mocks__/useLocalstorage';

const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

// GraphQL operations
const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions(
    $userId: String!
    $limit: Int
    $offset: Int
    $status: String
    $dateFrom: String
    $dateTo: String
  ) {
    razorpay_getUserTransactions(
      userId: $userId
      limit: $limit
      offset: $offset
      status: $status
      dateFrom: $dateFrom
      dateTo: $dateTo
    ) {
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
      email
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
`;

const GET_USER_TRANSACTION_STATS = gql`
  query GetUserTransactionStats(
    $userId: String!
    $dateFrom: String
    $dateTo: String
  ) {
    razorpay_getUserTransactionStats(
      userId: $userId
      dateFrom: $dateFrom
      dateTo: $dateTo
    ) {
      totalTransactions
      totalAmount
      currency
      successCount
      failedCount
      pendingCount
    }
  }
`;

interface RazorpayTransaction {
  id: string;
  paymentId?: string;
  amount?: number;
  currency: string;
  status: string;
  donorName?: string;
  donorEmail?: string;
  method?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email?: string;
  contact?: string;
  fee?: number;
  tax?: number;
  errorCode?: string;
  errorDescription?: string;
  refundStatus?: string;
  capturedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const UserTransactions: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );

  // Get user data (no orgId needed for global user transactions)
  const { getItem } = useLocalStorage();
  const userId = getItem('id') as string | null;

  // Redirect if no userId is available
  if (!userId) {
    return <Navigate to="/" replace />;
  }

  // GraphQL queries
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery(GET_USER_TRANSACTIONS, {
    variables: {
      userId: userId || '',
      limit: 100, // Get more transactions for user view
    },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useQuery(GET_USER_TRANSACTION_STATS, {
    variables: {
      userId: userId || '',
    },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  const transactions = transactionsData?.razorpay_getUserTransactions || [];
  const stats = statsData?.razorpay_getUserTransactionStats;

  // Apply filters to transactions
  const filteredTransactions = transactions.filter(
    (transaction: RazorpayTransaction) => {
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          transaction.paymentId?.toLowerCase().includes(searchLower) ||
          transaction.donorName?.toLowerCase().includes(searchLower) ||
          transaction.donorEmail?.toLowerCase().includes(searchLower) ||
          transaction.id.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (transaction.status !== statusFilter) return false;
      }

      // Date range filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const transactionDate = dayjs(transaction.createdAt);
        if (
          !transactionDate.isAfter(dateRange[0]) ||
          !transactionDate.isBefore(dateRange[1])
        ) {
          return false;
        }
      }

      return true;
    },
  );

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

  const getMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
        return 'blue';
      case 'upi':
        return 'green';
      case 'netbanking':
        return 'purple';
      case 'wallet':
        return 'orange';
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

  const handleViewDetails = (transaction: RazorpayTransaction) => {
    message.info(`Viewing details for transaction: ${transaction.id}`);
  };

  const handleDownloadReceipt = (transaction: RazorpayTransaction) => {
    message.success(`Downloading receipt for transaction: ${transaction.id}`);
  };

  const columns: ColumnsType<RazorpayTransaction> = [
    {
      title: 'Transaction ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
      render: (paymentId: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {paymentId || 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: RazorpayTransaction) => (
        <Text strong>
          {amount ? formatAmount(amount, record.currency) : 'N/A'}
        </Text>
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
      title: 'Donor',
      dataIndex: 'donorName',
      key: 'donorName',
      render: (name: string, record: RazorpayTransaction) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name || 'Anonymous'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.donorEmail}
          </div>
        </div>
      ),
    },
    {
      title: 'Payment Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <Tag color={getMethodColor(method)}>{method || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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

  if (transactionsLoading || statsLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Loading your transaction history...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (transactionsError || statsError) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="danger">
            Failed to load transaction data:{' '}
            {transactionsError?.message || statsError?.message}
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Space align="center">
            <CreditCardOutlined
              style={{ fontSize: '24px', color: '#1890ff' }}
            />
            <Title level={3} style={{ margin: 0 }}>
              My Razorpay Transactions
            </Title>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
            View all your payment transactions across all organizations
          </Text>
        </div>

        {/* Filters */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Search
              placeholder="Search transactions..."
              aria-label="Search transactions"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Select
              placeholder="Filter by status"
              aria-label="Filter transactions by status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="all">All Statuses</Select.Option>
              <Select.Option value="captured">Captured</Select.Option>
              <Select.Option value="authorized">Authorized</Select.Option>
              <Select.Option value="failed">Failed</Select.Option>
              <Select.Option value="refunded">Refunded</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <RangePicker
              value={dateRange}
              onChange={(dates) =>
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              aria-label="Filter by date range"
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredTransactions}
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
    </div>
  );
};

export default UserTransactions;
