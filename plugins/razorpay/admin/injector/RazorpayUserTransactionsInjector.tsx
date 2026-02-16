import React from 'react';
//@ts-expect-error - Apollo Client v4 types issue
import { useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';
import {
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
} from 'react-bootstrap';
import { CreditCard, RemoveRedEye, Download } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import useLocalStorage from 'utils/useLocalstorage';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

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
  const { t, i18n } = useTranslation('razorpay');
  const { orgId } = useParams<{ orgId?: string }>();
  const { getItem } = useLocalStorage();
  const userId = getItem('id') as string | null;

  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
  } = useQuery(GET_USER_TRANSACTIONS, {
    variables: {
      userId: userId || '',
      orgId: orgId || '',
      limit: 10,
    },
    skip: !userId || !orgId,
    fetchPolicy: 'network-only',
  });

  const transactions = transactionsData?.razorpay_getUserTransactions || [];

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
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (transaction: RazorpayUserTransaction) => {
    toast.info(
      t('transactions.messages.viewingDetails', { id: transaction.id }),
    );
  };

  const handleDownloadReceipt = (transaction: RazorpayUserTransaction) => {
    toast.info(
      t('transactions.messages.downloadingReceipt', { id: transaction.id }),
    );
  };

  if (transactionsLoading) {
    return (
      <Card className="my-4">
        <Card.Body className="text-center py-5">
          <Spinner
            animation="border"
            role="status"
            aria-label={t('transactions.userTransactions.loading')}
          />
          <div className="mt-3">
            <span>{t('transactions.userTransactions.loading')}</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (transactionsError) {
    return (
      <Card className="my-4">
        <Card.Body className="text-center py-5">
          <Alert variant="danger" role="alert" aria-live="polite">
            {t('transactions.userTransactions.errorPrefix')}{' '}
            {transactionsError.message}
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
            <CreditCard color="primary" fontSize="medium" aria-hidden="true" />
          </Col>
          <Col>
            <h4 className="mb-0">{t('transactions.userTransactions.title')}</h4>
            <div className="text-muted">
              {t('transactions.userTransactions.subtitle')}
            </div>
          </Col>
        </Row>
        <Table responsive bordered hover>
          <thead>
            <tr>
              <th>{t('transactions.table.id')}</th>
              <th>{t('transactions.table.amount')}</th>
              <th>{t('transactions.table.status')}</th>
              <th>{t('transactions.table.method')}</th>
              <th>{t('transactions.table.date')}</th>
              <th>{t('transactions.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx: RazorpayUserTransaction) => (
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
                    {t(`transactions.status.${tx.status}`, {
                      defaultValue: tx.status.toUpperCase(),
                    })}
                  </Badge>
                </td>
                <td>{tx.method || t('common.notAvailable')}</td>
                <td>{formatDate(tx.createdAt)}</td>
                <td>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleViewDetails(tx)}
                    aria-label={t(
                      'transactions.userTransactions.viewDetailsAriaLabel',
                    )}
                  >
                    <RemoveRedEye fontSize="small" />{' '}
                    {t('transactions.viewButton')}
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleDownloadReceipt(tx)}
                    aria-label={t(
                      'transactions.userTransactions.downloadReceiptAriaLabel',
                    )}
                  >
                    <Download fontSize="small" />{' '}
                    {t('transactions.userTransactions.receiptButton')}
                  </Button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted">
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

export default RazorpayUserTransactionsInjector;
