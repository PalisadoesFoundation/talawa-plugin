import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import Loader from '../../../../components/Loader/Loader';

// GraphQL operations
const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      id
      firstName
      lastName
      email
    }
  }
`;

const GET_ORGANIZATION_INFO = gql`
  query GetOrganizationInfo($orgId: String!) {
    organization(input: { id: $orgId }) {
      id
      name
      description
      avatarURL
    }
  }
`;

const GET_RAZORPAY_CONFIG = gql`
  query GetRazorpayConfig {
    razorpay_getRazorpayConfig {
      keyId
      isEnabled
      testMode
      currency
      description
    }
  }
`;

const CREATE_PAYMENT_ORDER = gql`
  mutation CreatePaymentOrder($input: RazorpayOrderInput!) {
    razorpay_createPaymentOrder(input: $input) {
      id
      razorpayOrderId
      organizationId
      userId
      amount
      currency
      status
      donorName
      donorEmail
      donorPhone
      description
      createdAt
      updatedAt
    }
  }
`;

const VERIFY_PAYMENT = gql`
  mutation VerifyPayment($input: RazorpayVerificationInput!) {
    razorpay_verifyPayment(input: $input) {
      success
      message
      transaction {
        paymentId
        status
        amount
        currency
      }
    }
  }
`;

interface OrganizationInfo {
  id: string;
  name: string;
  description: string;
  avatarURL: string;
}

interface PaymentOrder {
  id: string;
  razorpayOrderId?: string;
  organizationId?: string;
  userId?: string;
  amount?: number;
  currency: string;
  status: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RazorpayConfig {
  keyId: string;
  isEnabled: boolean;
  testMode: boolean;
  currency: string;
  description: string;
}

interface PaymentResult {
  success: boolean;
  message: string;
  transaction?: {
    paymentId?: string;
    status: string;
    amount?: number;
    currency: string;
  };
}

const DonationForm: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  // Load Razorpay script on component mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'INR',
    description: '',
    donorName: '',
    donorEmail: '',
    donorPhone: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    'form' | 'payment' | 'success'
  >('form');

  // GraphQL operations
  const {
    data: currentUserData,
    loading: userLoading,
    error: userError,
  } = useQuery(GET_CURRENT_USER);

  const {
    data: orgData,
    loading: orgLoading,
    error: orgError,
  } = useQuery(GET_ORGANIZATION_INFO, {
    variables: { orgId },
    skip: !orgId,
  });

  const {
    data: razorpayConfig,
    loading: configLoading,
    error: configError,
  } = useQuery(GET_RAZORPAY_CONFIG);

  const [createOrder] = useMutation(CREATE_PAYMENT_ORDER);
  const [verifyPayment] = useMutation(VERIFY_PAYMENT);

  useEffect(() => {
    // Load user data from GraphQL query
    if (currentUserData?.me) {
      const user = currentUserData.me;
      const nameParts = [user.firstName, user.lastName].filter(Boolean);
      const donorName = nameParts.join(' ').trim();

      setFormData((prev) => ({
        ...prev,
        ...(donorName && { donorName }),
        ...(user.email && { donorEmail: user.email }),
      }));
    }
  }, [currentUserData]);

  useEffect(() => {
    if (userError) {
      console.error('Error loading user data:', userError);
    }
  }, [userError]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    if (!formData.donorName.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!formData.donorEmail.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check if Razorpay is configured
    if (
      !razorpayConfig?.razorpay_getRazorpayConfig?.keyId ||
      !razorpayConfig?.razorpay_getRazorpayConfig?.isEnabled
    ) {
      toast.error(
        'Razorpay is not configured or enabled. Please contact the administrator.',
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create payment order
      const orderVariables = {
        input: {
          organizationId: orgId,
          userId: currentUserData?.me?.id || null,
          amount: parseFloat(formData.amount) * 100, // Convert to paise
          currency: formData.currency,
          description:
            formData.description ||
            `Donation to ${orgData?.organization?.name}`,
          donorName: formData.donorName,
          donorEmail: formData.donorEmail,
          donorPhone: formData.donorPhone,
        },
      };

      const { data: orderData } = await createOrder({
        variables: orderVariables,
      });

      if (!orderData?.razorpay_createPaymentOrder) {
        throw new Error('Failed to create payment order');
      }

      const order = orderData.razorpay_createPaymentOrder;

      // Validate order data
      if (!order.razorpayOrderId) {
        throw new Error('Invalid order: missing Razorpay order ID');
      }
      if (!order.amount || order.amount <= 0) {
        throw new Error('Invalid order: missing or invalid amount');
      }

      // Step 2: Open Razorpay payment modal - simplified as per official docs
      const options = {
        key: razorpayConfig.razorpay_getRazorpayConfig.keyId,
        amount: order.amount,
        currency: order.currency,
        name: orgData?.organization?.name || 'Organization',
        description:
          order.description || `Donation to ${orgData?.organization?.name}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: formData.donorName,
          email: formData.donorEmail,
          contact: formData.donorPhone,
        },
        theme: {
          color: '#3399cc',
        },
        handler: function (response: any) {
          // Payment successful - verify payment
          verifyPayment({
            variables: {
              input: {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                paymentData: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              },
            },
          })
            .then(({ data: verificationData }) => {
              if (verificationData?.razorpay_verifyPayment?.success) {
                setCurrentStep('success');
                toast.success(
                  'Payment successful! Thank you for your donation.',
                );
                setIsProcessing(false);
              } else {
                toast.error(
                  verificationData?.razorpay_verifyPayment?.message ||
                  'Payment verification failed',
                );
                setIsProcessing(false);
              }
            })
            .catch((error) => {
              console.error('Payment verification error:', error);
              toast.error(
                'Payment verification failed. Please contact support.',
              );
              setIsProcessing(false);
            });
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      // Simple Razorpay integration as per official docs
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return symbols[currency] || currency;
  };

  if (orgLoading || configLoading || userLoading) {
    return <Loader />;
  }

  if (orgError) {
    return (
      <Alert variant="danger">
        Failed to load organization information: {orgError.message}
      </Alert>
    );
  }

  if (configError) {
    return (
      <Alert variant="danger">
        Failed to load Razorpay configuration: {configError.message}
      </Alert>
    );
  }

  // Check if Razorpay is configured
  if (
    !razorpayConfig?.razorpay_getRazorpayConfig?.keyId ||
    !razorpayConfig?.razorpay_getRazorpayConfig?.isEnabled
  ) {
    return (
      <Alert variant="warning">
        <h4>Payment System Not Available</h4>
        <p>
          Razorpay payment gateway is not configured or enabled. Please contact
          the administrator to set up payments.
        </p>
      </Alert>
    );
  }

  const organization = orgData?.organization;

  if (currentStep === 'success') {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <Card.Body className="text-center py-8">
            <div className="text-success text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-dark mb-2">Thank You!</h2>
            <p className="text-muted mb-6">
              Your donation has been processed successfully. You will receive a
              confirmation email shortly.
            </p>
            <div className="d-grid gap-2">
              <Button
                onClick={() => {
                  setCurrentStep('form');
                  setFormData({
                    amount: '',
                    currency: 'INR',
                    description: '',
                    donorName: formData.donorName, // Keep donor info for convenience
                    donorEmail: formData.donorEmail,
                    donorPhone: formData.donorPhone,
                  });
                }}
                className="w-100"
              >
                Make Another Donation
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/user/razorpay/my-transactions')}
                className="w-100"
              >
                View My Transactions
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Make a Donation</h1>
          <p className="text-gray-600 mt-2">
            Support {organization?.name} with your generous donation
          </p>
        </div>

        {/* Organization Info */}
        {organization && (
          <Card className="mb-6">
            <Card.Body className="p-6">
              <div className="d-flex align-items-center">
                {organization.avatarURL && (
                  <img
                    src={organization.avatarURL}
                    alt={organization.name}
                    className="w-16 h-16 rounded-circle me-3"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold">{organization.name}</h2>
                  {organization.description && (
                    <p className="text-muted">{organization.description}</p>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Donation Form */}
        <Card>
          <Card.Header>
            <Card.Title>Donation Details</Card.Title>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              {/* Amount Section */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3">Donation Amount</h3>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Amount</Form.Label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted">
                          {getCurrencySymbol(formData.currency)}
                        </span>
                        <Form.Control
                          type="number"
                          value={formData.amount}
                          onChange={(e) =>
                            handleInputChange('amount', e.target.value)
                          }
                          placeholder="0.00"
                          min="1"
                          step="0.01"
                          className="ps-4"
                          required
                        />
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Currency</Form.Label>
                      <Form.Select
                        value={formData.currency}
                        onChange={(e) =>
                          handleInputChange('currency', e.target.value)
                        }
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Quick Amount Buttons */}
                <Form.Group className="mb-3">
                  <Form.Label>Quick Amounts</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {[100, 500, 1000, 2000, 5000].map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          handleInputChange('amount', amount.toString())
                        }
                      >
                        {formatCurrency(amount, formData.currency)}
                      </Button>
                    ))}
                  </div>
                </Form.Group>
              </div>

              {/* Donor Information */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3">Your Information</h3>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.donorName}
                        onChange={(e) =>
                          handleInputChange('donorName', e.target.value)
                        }
                        placeholder="Enter your full name"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address *</Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.donorEmail}
                        onChange={(e) =>
                          handleInputChange('donorEmail', e.target.value)
                        }
                        placeholder="Enter your email"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number (Optional)</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.donorPhone}
                    onChange={(e) =>
                      handleInputChange('donorPhone', e.target.value)
                    }
                    placeholder="Enter your phone number"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Message (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder="Add a personal message with your donation"
                  />
                </Form.Group>
              </div>

              {/* Payment Summary */}
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <div className="bg-light p-4 rounded mb-4">
                  <h3 className="font-semibold mb-2">Payment Summary</h3>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Donation Amount:</span>
                    <span className="fw-medium">
                      {formatCurrency(
                        parseFloat(formData.amount),
                        formData.currency,
                      )}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Processing Fee:</span>
                    <span className="fw-medium">₹0.00</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between fw-semibold">
                    <span>Total Amount:</span>
                    <span className="text-success">
                      {formatCurrency(
                        parseFloat(formData.amount),
                        formData.currency,
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={
                  isProcessing ||
                  !formData.amount ||
                  parseFloat(formData.amount) <= 0
                }
                className="w-100 btn-success"
                size="lg"
              >
                {isProcessing ? (
                  <div className="d-flex align-items-center justify-content-center">
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Donate ${formData.amount ? formatCurrency(parseFloat(formData.amount), formData.currency) : ''}`
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {/* Security Notice */}
        <Card className="mt-6">
          <Card.Body className="p-4">
            <div className="d-flex align-items-start">
              <div className="text-primary fs-4 me-3">🔒</div>
              <div>
                <h4 className="fw-semibold">Secure Payment</h4>
                <p className="text-muted small">
                  Your payment information is encrypted and secure. We use
                  Razorpay, a trusted payment gateway, to process all
                  transactions safely.
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default DonationForm;
