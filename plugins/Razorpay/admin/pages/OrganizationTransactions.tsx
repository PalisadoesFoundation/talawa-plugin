import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import Loader from '../../../../components/Loader/Loader';

// GraphQL operations
const GET_ORG_TRANSACTIONS = gql`
  query GetOrganizationTransactions(
    $orgId: String!
    $limit: Int
    $offset: Int
    $status: String
    $dateFrom: String
    $dateTo: String
  ) {
    razorpay_getOrganizationTransactions(
      orgId: $orgId
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

const GET_ORG_TRANSACTION_STATS = gql`
  query GetOrganizationTransactionStats(
    $orgId: String!
    $dateFrom: String
    $dateTo: String
  ) {
    razorpay_getOrganizationTransactionStats(
      orgId: $orgId
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

interface Transaction {
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

interface Pagination {
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
}

const OrganizationTransactions: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    limit: 20,
    offset: 0,
  });

  const [statsPeriod, setStatsPeriod] = useState('30d');

  // GraphQL queries
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery(GET_ORG_TRANSACTIONS, {
    variables: {
      orgId,
      ...filters,
    },
    skip: !orgId,
  });

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useQuery(GET_ORG_TRANSACTION_STATS, {
    variables: {
      orgId,
      period: statsPeriod,
    },
    skip: !orgId,
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      offset: 0, // Reset pagination when filters change
    }));
  };

  const handlePageChange = (newOffset: number) => {
    setFilters((prev) => ({
      ...prev,
      offset: newOffset,
    }));
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount / 100); // Razorpay amounts are in paise
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'captured':
      case 'success':
        return 'bg-success text-white';
      case 'failed':
      case 'cancelled':
        return 'bg-danger text-white';
      case 'pending':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary text-white';
    }
  };

  if (transactionsLoading || statsLoading) {
    return <Loader />;
  }

  if (transactionsError || statsError) {
    return (
      <Alert variant="danger">
        Failed to load transaction data:{' '}
        {transactionsError?.message || statsError?.message}
      </Alert>
    );
  }

  const transactions =
    transactionsData?.getOrganizationTransactions?.transactions || [];
  const summary = transactionsData?.getOrganizationTransactions?.summary;
  const pagination = transactionsData?.getOrganizationTransactions?.pagination;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Payment Transactions
        </h1>
        <p className="text-gray-600 mt-2">
          View and manage payment transactions for your organization
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <Row className="mb-4">
          <Col md={3}>
            <Card>
              <Card.Body className="p-4">
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(summary.totalAmount, summary.currency)}
                </div>
                <p className="text-muted small">Total Amount</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card>
              <Card.Body className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {summary.totalTransactions}
                </div>
                <p className="text-muted small">Total Transactions</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card>
              <Card.Body className="p-4">
                <div className="text-2xl font-bold text-success">
                  {summary.successfulTransactions}
                </div>
                <p className="text-muted small">Successful</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card>
              <Card.Body className="p-4">
                <div className="text-2xl font-bold text-warning">
                  {summary.pendingTransactions}
                </div>
                <p className="text-muted small">Pending</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <Card.Title>Filters</Card.Title>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="captured">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    handleFilterChange('dateFrom', e.target.value)
                  }
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Per Page</Form.Label>
                <Form.Select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', e.target.value)}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Transactions Table */}
      <Card>
        <Card.Header>
          <Card.Title>Transaction History</Card.Title>
        </Card.Header>
        <Card.Body>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted">
              No transactions found for the selected filters.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Donor</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction: Transaction) => (
                    <tr key={transaction.id}>
                      <td className="font-monospace small">
                        {transaction.paymentId}
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">
                            {transaction.donorName}
                          </div>
                          <div className="small text-muted">
                            {transaction.donorEmail}
                          </div>
                        </div>
                      </td>
                      <td className="fw-medium">
                        {transaction.amount
                          ? formatCurrency(
                              transaction.amount,
                              transaction.currency,
                            )
                          : 'N/A'}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusColor(transaction.status)}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="small">
                        {transaction.donorName || 'Anonymous'}
                      </td>
                      <td className="small text-muted">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="small text-muted">
                Showing {filters.offset + 1} to{' '}
                {Math.min(
                  filters.offset + filters.limit,
                  pagination.totalCount,
                )}{' '}
                of {pagination.totalCount} transactions
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  disabled={filters.offset === 0}
                  onClick={() =>
                    handlePageChange(
                      Math.max(0, filters.offset - filters.limit),
                    )
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline-secondary"
                  disabled={!pagination.hasMore}
                  onClick={() =>
                    handlePageChange(filters.offset + filters.limit)
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Export Options */}
      <div className="mt-4 d-flex justify-content-end">
        <Button variant="outline-secondary" className="me-2">
          Export CSV
        </Button>
        <Button variant="outline-secondary">Export PDF</Button>
      </div>
    </div>
  );
};

export default OrganizationTransactions;
