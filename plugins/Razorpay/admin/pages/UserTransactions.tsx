import React, { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import Loader from '../../../../components/Loader/Loader';

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

const UserTransactions: React.FC = () => {
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
  } = useQuery(GET_USER_TRANSACTIONS, {
    variables: {
      ...filters,
    },
  });

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useQuery(GET_USER_TRANSACTION_STATS, {
    variables: {
      period: statsPeriod,
    },
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    transactionsData?.getUserTransactions?.transactions || [];
  const summary = transactionsData?.getUserTransactions?.summary;
  const pagination = transactionsData?.getUserTransactions?.pagination;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Transactions</h1>
        <p className="text-gray-600 mt-2">
          View your donation history across all organizations
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
                <p className="text-muted small">Total Donated</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card>
              <Card.Body className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {summary.totalTransactions}
                </div>
                <p className="text-muted small">Total Donations</p>
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
                <div className="text-2xl font-bold text-info">
                  {formatCurrency(summary.averageAmount, summary.currency)}
                </div>
                <p className="text-muted small">Average Donation</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Organization Stats */}
      {statsData?.getUserTransactionStats?.organizationStats && (
        <Card className="mb-4">
          <Card.Header>
            <Card.Title>Donations by Organization</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {statsData.getUserTransactionStats.organizationStats.map(
                (org: any, index: number) => (
                  <div
                    key={index}
                    className="d-flex justify-content-between align-items-center p-3 bg-light rounded"
                  >
                    <div>
                      <div className="fw-medium">{org.organizationName}</div>
                      <div className="text-muted small">
                        {org.transactionCount} donations
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold text-success">
                        {formatCurrency(
                          org.totalAmount,
                          summary?.currency || 'INR',
                        )}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card.Body>
        </Card>
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
              <div className="fs-1 mb-4">📝</div>
              <h3 className="h5 mb-2">No transactions found</h3>
              <p className="text-muted">
                You haven't made any donations yet. Start supporting
                organizations today!
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Organization</th>
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
                        <div className="fw-medium">
                          {transaction.donorName || 'Anonymous'}
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
                        {transaction.donorEmail || 'N/A'}
                      </td>
                      <td className="small text-muted">
                        {formatDate(transaction.createdAt)}
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

      {/* Recent Activity */}
      {statsData?.getUserTransactionStats?.recentActivity && (
        <Card className="mt-4">
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
          </Card.Header>
          <Card.Body>
            <div>
              {statsData.getUserTransactionStats.recentActivity.map(
                (activity: any, index: number) => (
                  <div
                    key={index}
                    className="d-flex justify-content-between align-items-center p-3 border-bottom"
                  >
                    <div>
                      <div className="fw-medium">
                        {activity.organizationName}
                      </div>
                      <div className="small text-muted">{activity.date}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold text-success">
                        {formatCurrency(
                          activity.amount,
                          summary?.currency || 'INR',
                        )}
                      </div>
                      <span
                        className={`badge ${getStatusColor(activity.status)}`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Export Options */}
      <div className="mt-6 flex justify-end">
        <Button variant="outline" className="mr-2">
          Export CSV
        </Button>
        <Button variant="outline">Export PDF</Button>
      </div>
    </div>
  );
};

export default UserTransactions;
