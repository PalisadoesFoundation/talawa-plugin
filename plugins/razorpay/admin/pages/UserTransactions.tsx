/**
 * User Transactions Page for Razorpay Plugin
 *
 * This component provides a global view of all user transactions across all organizations
 * processed through Razorpay. It allows users to see their complete transaction history
 * in one place, regardless of which organization the transactions were made to.
 */

import React, { useState } from 'react';

/**
 * TODO(2024-12-18): Apollo Client v4.x type definitions do not export useQuery/useMutation
 * hooks with correct generic signatures, causing TS2305 errors. This is a known issue:
 * @see https://github.com/apollographql/apollo-client/issues/11506
 */
// @ts-expect-error - Apollo Client v4 types issue
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Form,
  InputGroup,
  Alert,
} from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import useLocalStorage from 'utils/useLocalstorage';

// GraphQL operations
import {
  GET_USER_TRANSACTIONS,
  GET_USER_TRANSACTION_STATS,
} from '../graphql/queries';
import {
  CreditCardOff,
  Download,
  Search,
  VisibilityOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

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
  const { t } = useTranslation('razorpay');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );

  // Get user data (no orgId needed for global user transactions)
  const { getItem } = useLocalStorage();
  const userId = getItem('id') as string | null;

  // GraphQL queries - must be called unconditionally (React hooks rule)
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
  } = useQuery(GET_USER_TRANSACTIONS, {
    variables: {
      userId: userId || '',
      limit: 100, // Get more transactions for user view
    },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  const { loading: statsLoading, error: statsError } = useQuery(
    GET_USER_TRANSACTION_STATS,
    {
      variables: {
        userId: userId || '',
      },
      skip: !userId,
      fetchPolicy: 'network-only',
    },
  );

  // Redirect if no userId is available (after hooks are called)
  if (!userId) {
    return <Navigate to="/" replace />;
  }

  const transactions = transactionsData?.razorpay_getUserTransactions || [];

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
          !transactionDate.isSameOrAfter(dateRange[0], 'day') ||
          !transactionDate.isSameOrBefore(dateRange[1], 'day')
        ) {
          return false;
        }
      }

      return true;
    },
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'captured':
        return 'success';
      case 'authorized':
        return 'info';
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getMethodVariant = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
        return 'primary';
      case 'upi':
        return 'success';
      case 'netbanking':
        return 'info';
      case 'wallet':
        return 'warning';
      default:
        return 'secondary';
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
    toast.info(
      t('transactions.messages.viewDetailsComing', {
        id: transaction.paymentId || transaction.id,
      }),
    );
  };

  const handleDownloadReceipt = (transaction: RazorpayTransaction) => {
    toast.info(
      t('transactions.messages.downloadReceiptComing', {
        id: transaction.paymentId || transaction.id,
      }),
    );
  };

  if (transactionsLoading || statsLoading) {
    return (
      <Card className="my-4">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status" />
          <div className="mt-3">
            <span>{t('common.loading')}</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (transactionsError || statsError) {
    return (
      <Card className="my-4">
        <Card.Body className="text-center py-5">
          <Alert variant="danger">
            {t('transactions.error.loadFailed')}:{' '}
            {transactionsError?.message || statsError?.message}
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Container fluid>
      <Card className="my-4">
        <Card.Body>
          <Row className="align-items-center mb-2">
            <Col xs="auto">
              <CreditCardOff />
            </Col>
            <Col>
              <h3 className="mb-0">{t('transactions.title')}</h3>
              <div className="text-muted">{t('transactions.subtitle')}</div>
            </Col>
          </Row>
          <Row className="g-3">
            <Col xs={12} md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  placeholder={t('transactions.search')}
                  aria-label={t('transactions.search')}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col xs={12} md={4}>
              <Form.Select
                aria-label={t('transactions.filters.statusLabel')}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">
                  {t('transactions.filters.allStatuses')}
                </option>
                <option value="captured">
                  {t('transactions.status.captured')}
                </option>
                <option value="authorized">
                  {t('transactions.status.authorized')}
                </option>
                <option value="failed">
                  {t('transactions.status.failed')}
                </option>
                <option value="refunded">
                  {t('transactions.status.refunded')}
                </option>
              </Form.Select>
            </Col>
            <Col xs={12} md={4}>
              <Form.Control
                type="date"
                value={
                  dateRange && dateRange[0]
                    ? dateRange[0].format('YYYY-MM-DD')
                    : ''
                }
                onChange={(e) =>
                  setDateRange([
                    e.target.value ? dayjs(e.target.value) : null,
                    dateRange ? dateRange[1] : null,
                  ] as [dayjs.Dayjs, dayjs.Dayjs] | null)
                }
                placeholder={t('transactions.filters.startDate')}
                aria-label={t('transactions.filters.startDate')}
                className="mb-2"
              />
              <Form.Control
                type="date"
                value={
                  dateRange && dateRange[1]
                    ? dateRange[1].format('YYYY-MM-DD')
                    : ''
                }
                onChange={(e) =>
                  setDateRange([
                    dateRange ? dateRange[0] : null,
                    e.target.value ? dayjs(e.target.value) : null,
                  ] as [dayjs.Dayjs, dayjs.Dayjs] | null)
                }
                placeholder={t('transactions.filters.endDate')}
                aria-label={t('transactions.filters.endDate')}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          <Table responsive bordered hover>
            <thead>
              <tr>
                <th>
                  {t('transactions.table.transactionId') || 'Transaction ID'}
                </th>
                <th>{t('transactions.table.amount') || 'Amount'}</th>
                <th>{t('transactions.table.status') || 'Status'}</th>
                <th>{t('transactions.table.donor') || 'Donor'}</th>
                <th>{t('transactions.table.method') || 'Payment Method'}</th>
                <th>{t('transactions.table.date') || 'Date'}</th>
                <th>{t('transactions.table.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx: RazorpayTransaction) => (
                <tr key={tx.id}>
                  <td>
                    <code style={{ fontSize: '12px' }}>
                      {tx.paymentId || t('common.notAvailable')}
                    </code>
                  </td>
                  <td>
                    <strong>
                      {tx.amount
                        ? formatAmount(tx.amount, tx.currency)
                        : t('common.notAvailable')}
                    </strong>
                  </td>
                  <td>
                    <Badge bg={getStatusVariant(tx.status)}>
                      {tx.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {tx.donorName || t('common.anonymous')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {tx.donorEmail}
                    </div>
                  </td>
                  <td>
                    <Badge bg={getMethodVariant(tx.method || '')}>
                      {tx.method || t('common.notAvailable')}
                    </Badge>
                  </td>
                  <td>{formatDate(tx.createdAt)}</td>
                  <td>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleViewDetails(tx)}
                      title={t(
                        'transactions.userTransactions.viewDetailsAriaLabel',
                      )}
                      aria-label={t(
                        'transactions.userTransactions.viewDetailsAriaLabel',
                      )}
                    >
                      <VisibilityOutlined /> {t('transactions.viewButton')}
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleDownloadReceipt(tx)}
                      title={t(
                        'transactions.userTransactions.downloadReceiptAriaLabel',
                      )}
                      aria-label={t(
                        'transactions.userTransactions.downloadReceiptAriaLabel',
                      )}
                    >
                      <Download />{' '}
                      {t('transactions.userTransactions.receiptButton')}
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    {t('transactions.table.noData') || 'No transactions found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UserTransactions;
