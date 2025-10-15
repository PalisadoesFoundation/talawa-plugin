/**
 * Razorpay User Transactions Injector (G1)
 *
 * This component is specifically designed for the G1 extension point to display
 * Razorpay payment provider transactions for users in their transaction history.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Spin,
} from 'antd';
import {
  CreditCardOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useParams } from 'react-router-dom';
import useLocalStorage from 'utils/useLocalstorage';

const { Title, Text } = Typography;

// GraphQL query for fetching user transactions
const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions($userId: String!, $orgId: String!, $limit: Int) {
    razorpay_getUserTransactions(
      userId: $userId
      orgId: $orgId
      limit: $limit
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

interface RazorpayUserTransaction {
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

const RazorpayUserTransactionsInjector: React.FC = () => {
  const { orgId } = useParams();
  const { getItem } = useLocalStorage();
  const userId = getItem('id') as string | null;

  // GraphQL query
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
  } = useQuery(GET_USER_TRANSACTIONS, {
    variables: {
      userId: userId || '',
      orgId: orgId || '',
      limit: 10, // Show recent 10 transactions in injector
    },
    skip: !userId || !orgId,
    fetchPolicy: 'network-only',
  });

  const transactions = transactionsData?.razorpay_getUserTransactions || [];

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

  const handleViewDetails = (transaction: RazorpayUserTransaction) => {
    message.info(`Viewing details for transaction: ${transaction.id}`);
    // In a real implementation, this would open a modal or navigate to details
  };

  const handleDownloadReceipt = (transaction: RazorpayUserTransaction) => {
    message.success(`Downloading receipt for transaction: ${transaction.id}`);
    // In a real implementation, this would download the receipt
  };

  const columns: ColumnsType<RazorpayUserTransaction> = [
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
      render: (amount: number, record: RazorpayUserTransaction) => (
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
      title: 'Payment Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => method || 'N/A',
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
      render: (_, record: RazorpayUserTransaction) => (
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

  if (transactionsLoading) {
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

  if (transactionsError) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="danger">
            Error loading transactions: {transactionsError.message}
          </Text>
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
            Razorpay Transactions
          </Title>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
          Your payment transactions processed through Razorpay
        </Text>
      </div>

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
        scroll={{ x: 800 }}
      />
    </Card>
  );
};

export default RazorpayUserTransactionsInjector;
