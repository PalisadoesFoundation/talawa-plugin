/**
 * Razorpay Organization Transactions Injector (G2)
 *
 * This component is specifically designed for the G2 extension point to display
 * Razorpay payment provider transactions for organization admins in their transaction management.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';
import { Card, Table, Tag, Button, Space, Typography, message, Spin, Statistic, Row, Col } from 'antd';
import { CreditCardOutlined, EyeOutlined, DownloadOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useParams } from 'react-router-dom';
import useLocalStorage from 'utils/useLocalstorage';

const { Title, Text } = Typography;

// GraphQL queries for fetching organization transactions and stats
const GET_ORG_TRANSACTIONS = gql`
  query GetOrganizationTransactions($orgId: String!, $limit: Int) {
    razorpay_getOrganizationTransactions(orgId: $orgId, limit: $limit) {
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

const GET_ORG_TRANSACTION_STATS = gql`
  query GetOrganizationTransactionStats($orgId: String!) {
    razorpay_getOrganizationTransactionStats(orgId: $orgId) {
      totalTransactions
      totalAmount
      currency
      successCount
      failedCount
      pendingCount
    }
  }
`;

interface RazorpayOrganizationTransaction {
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

interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  currency: string;
  successCount: number;
  failedCount: number;
  pendingCount: number;
}

const RazorpayOrganizationTransactionsInjector: React.FC = () => {
  const { orgId } = useParams();
  const { getItem } = useLocalStorage();

  // GraphQL queries
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
  } = useQuery(GET_ORG_TRANSACTIONS, {
    variables: {
      orgId: orgId || '',
      limit: 10, // Show recent 10 transactions in injector
    },
    skip: !orgId,
    fetchPolicy: 'network-only',
  });

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useQuery(GET_ORG_TRANSACTION_STATS, {
    variables: {
      orgId: orgId || '',
    },
    skip: !orgId,
    fetchPolicy: 'network-only',
  });

  const transactions = transactionsData?.razorpay_getOrganizationTransactions || [];
  const stats = statsData?.razorpay_getOrganizationTransactionStats;

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

  const handleViewDetails = (transaction: RazorpayOrganizationTransaction) => {
    message.info(`Viewing details for transaction: ${transaction.id}`);
    // In a real implementation, this would open a modal or navigate to details
  };

  const handleDownloadReceipt = (transaction: RazorpayOrganizationTransaction) => {
    message.success(`Downloading receipt for transaction: ${transaction.id}`);
    // In a real implementation, this would download the receipt
  };

  const columns: ColumnsType<RazorpayOrganizationTransaction> = [
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
      render: (amount: number, record: RazorpayOrganizationTransaction) => (
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
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Donor',
      key: 'donor',
      render: (_, record: RazorpayOrganizationTransaction) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.donorName || 'Anonymous'}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.donorEmail || 'N/A'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Payment Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => method || 'N/A',
    },
    {
      title: 'Fees',
      dataIndex: 'fee',
      key: 'fee',
      render: (fee: number, record: RazorpayOrganizationTransaction) => (
        <Text type="secondary">
          {fee ? formatAmount(fee, record.currency) : 'N/A'}
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

  if (transactionsLoading || statsLoading) {
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

  if (transactionsError || statsError) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="danger">
            Error loading transactions: {transactionsError?.message || statsError?.message}
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
            Razorpay Organization Transactions
          </Title>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
          Payment transactions for your organization processed through Razorpay
        </Text>
      </div>

      {/* Statistics Row */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Total Amount"
                value={stats.totalAmount ? stats.totalAmount / 100 : 0}
                precision={2}
                prefix={<DollarOutlined />}
                suffix={stats.currency || 'INR'}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Total Transactions"
                value={stats.totalTransactions || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Success Rate"
                value={stats.totalTransactions ? ((stats.successCount || 0) / stats.totalTransactions) * 100 : 0}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Failed Transactions"
                value={stats.failedCount || 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      )}

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
