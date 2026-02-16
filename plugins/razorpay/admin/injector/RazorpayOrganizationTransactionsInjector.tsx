import React from 'react';
import { useTranslation } from 'react-i18next';
// @ts-expect-error - Apollo Client v4 types issue
import { useQuery } from '@apollo/client';
import {
  GET_ORG_TRANSACTIONS,
  GET_ORG_TRANSACTION_STATS,
} from '../graphql/queries';
import {
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Row,
  Col,
  Alert,
} from 'react-bootstrap';
import {
  CreditCard,
  RemoveRedEye,
  Download,
  AttachMoney,
  Person,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

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

const RazorpayOrganizationTransactionsInjector: React.FC = () => {
  const { t } = useTranslation('razorpay');
  const { orgId } = useParams();

  // GraphQL queries
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
  } = useQuery(GET_ORG_TRANSACTIONS, {
    variables: {
      orgId: orgId || '',
      limit: 10,
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

  const transactions =
    transactionsData?.razorpay_getOrganizationTransactions || [];
  const stats = statsData?.razorpay_getOrganizationTransactionStats;

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
    toast.info(
      t('transactions.messages.viewingDetails', { id: transaction.id }),
    );
  };

  const handleDownloadReceipt = (
    transaction: RazorpayOrganizationTransaction,
  ) => {
    toast.info(
      t('transactions.messages.downloadingReceipt', { id: transaction.id }),
    );
  };

  if (transactionsLoading || statsLoading) {
    return (
      <Card className="my-4">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status" />
          <div className="mt-3">
            <span>{t('transactions.loadingOrg')}</span>
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
            {t('transactions.error.loadOrgFailed')}:{' '}
            {transactionsError?.message || statsError?.message}
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="my-4">
      <Card.Body>
        <Row className="align-items-center mb-2">
          <Col xs="auto">
            <CreditCard color="primary" />
          </Col>
          <Col>
            <h4 className="mb-0">{t('transactions.orgTitle')}</h4>
            <div className="text-muted">{t('transactions.orgSubtitle')}</div>
          </Col>
        </Row>

        {/* Statistics Row */}
        {stats && (
          <Row className="mb-4">
            <Col md={3} xs={6} className="mb-2">
              <Card bg="light" className="h-100">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <AttachMoney color="success" className="me-2" />
                    <div>
                      <div className="fw-bold">
                        {t('transactions.stats.totalAmount')}
                      </div>
                      <div>
                        {stats.totalAmount
                          ? (stats.totalAmount / 100).toFixed(2)
                          : '0.00'}{' '}
                        {stats.currency || 'INR'}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} xs={6} className="mb-2">
              <Card bg="light" className="h-100">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <Person color="primary" className="me-2" />
                    <div>
                      <div className="fw-bold">
                        {t('transactions.stats.totalTransactions')}
                      </div>
                      <div>{stats.totalTransactions || 0}</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} xs={6} className="mb-2">
              <Card bg="light" className="h-100">
                <Card.Body>
                  <div className="fw-bold">
                    {t('transactions.stats.successRate')}
                  </div>
                  <div style={{ color: '#3f8600' }}>
                    {stats.totalTransactions
                      ? (
                          ((stats.successCount || 0) /
                            stats.totalTransactions) *
                          100
                        ).toFixed(1)
                      : '0.0'}
                    %
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} xs={6} className="mb-2">
              <Card bg="light" className="h-100">
                <Card.Body>
                  <div className="fw-bold">
                    {t('transactions.stats.failedTransactions')}
                  </div>
                  <div style={{ color: '#cf1322' }}>
                    {stats.failedCount || 0}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <Table responsive bordered hover>
          <thead>
            <tr>
              <th>{t('transactions.table.id')}</th>
              <th>{t('transactions.table.amount')}</th>
              <th>{t('transactions.table.status')}</th>
              <th>{t('transactions.table.donor')}</th>
              <th>{t('transactions.table.method')}</th>
              <th>{t('transactions.table.fees')}</th>
              <th>{t('transactions.table.date')}</th>
              <th>{t('transactions.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx: RazorpayOrganizationTransaction) => (
              <tr key={tx.id}>
                <td>
                  <code style={{ fontSize: '12px' }}>
                    {tx.paymentId || t('common.notAvailable')}
                  </code>
                </td>
                <td>
                  <strong>
                    {tx.amount != null
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
                    {tx.donorEmail || t('common.notAvailable')}
                  </div>
                </td>
                <td>{tx.method || t('common.notAvailable')}</td>
                <td>
                  <span className="text-secondary">
                    {tx.fee != null
                      ? formatAmount(tx.fee, tx.currency)
                      : t('common.notAvailable')}
                  </span>
                </td>
                <td>{formatDate(tx.createdAt)}</td>
                <td>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleViewDetails(tx)}
                    title="View"
                  >
                    <RemoveRedEye fontSize="small" />
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleDownloadReceipt(tx)}
                    title="Receipt"
                  >
                    <Download fontSize="small" />
                  </Button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted">
                  {t('transactions.table.noData') || 'No transactions found.'}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default RazorpayOrganizationTransactionsInjector;
