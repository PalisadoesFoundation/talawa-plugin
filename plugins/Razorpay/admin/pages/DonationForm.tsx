import React, { useState, useEffect } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import Loader from "../../../../components/Loader/Loader";

// GraphQL operations
const GET_ORGANIZATION_INFO = gql`
  query GetOrganizationInfo($orgId: ID!) {
    getOrganizationById(id: $orgId) {
      id
      name
      description
      image
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
      anonymous
      createdAt
      updatedAt
    }
  }
`;

const INITIATE_PAYMENT = gql`
  mutation InitiatePayment($input: RazorpayPaymentInput!) {
    razorpay_initiatePayment(input: $input) {
      success
      message
      orderId
      paymentId
      amount
      currency
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
  image: string;
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
  anonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentResult {
  success: boolean;
  message: string;
  orderId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
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

  const [formData, setFormData] = useState({
    amount: "",
    currency: "INR",
    description: "",
    donorName: "",
    donorEmail: "",
    donorPhone: "",
    anonymous: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "form" | "payment" | "success"
  >("form");

  // GraphQL operations
  const {
    data: orgData,
    loading: orgLoading,
    error: orgError,
  } = useQuery(GET_ORGANIZATION_INFO, {
    variables: { orgId },
    skip: !orgId,
  });

  const [createOrder] = useMutation(CREATE_PAYMENT_ORDER);
  const [initiatePayment] = useMutation(INITIATE_PAYMENT);

  useEffect(() => {
    // Load user data if available
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.firstName && user.lastName) {
      setFormData((prev) => ({
        ...prev,
        donorName: `${user.firstName} ${user.lastName}`,
        donorEmail: user.email || "",
      }));
    }
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }
    if (!formData.donorName.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!formData.donorEmail.trim()) {
      toast.error("Please enter your email");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      // Step 1: Create payment order
      const { data: orderData } = await createOrder({
        variables: {
          input: {
            organizationId: orgId,
            amount: parseFloat(formData.amount) * 100, // Convert to paise
            currency: formData.currency,
            description:
              formData.description ||
              `Donation to ${orgData?.getOrganizationById?.name}`,
            donorName: formData.donorName,
            donorEmail: formData.donorEmail,
            donorPhone: formData.donorPhone,
            anonymous: formData.anonymous,
          },
        },
      });

      if (!orderData?.createPaymentOrder?.success) {
        throw new Error(
          orderData?.createPaymentOrder?.message ||
            "Failed to create payment order",
        );
      }

      // Step 2: Initiate payment
      const { data: paymentData } = await initiatePayment({
        variables: {
          input: {
            orderId: orderData.createPaymentOrder.order.id,
            organizationId: orgId,
          },
        },
      });

      if (!paymentData?.initiatePayment?.success) {
        throw new Error(
          paymentData?.initiatePayment?.message || "Failed to initiate payment",
        );
      }

      // Step 3: Open Razorpay payment modal
      const paymentInfo = paymentData.initiatePayment.paymentData;

      const options = {
        key: paymentInfo.key,
        amount: paymentInfo.amount,
        currency: paymentInfo.currency,
        name: paymentInfo.name,
        description: paymentInfo.description,
        order_id: paymentInfo.orderId,
        prefill: paymentInfo.prefill,
        notes: paymentInfo.notes,
        theme: paymentInfo.theme,
        handler: function (response: any) {
          // Payment successful
          console.log("Payment successful:", response);
          setCurrentStep("success");
          toast.success("Payment successful! Thank you for your donation.");
        },
        modal: {
          ondismiss: function () {
            // Payment modal closed
            console.log("Payment modal closed");
            setIsProcessing(false);
          },
        },
      };

      // Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        document.head.appendChild(script);
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
    }).format(amount);
  };

  if (orgLoading) {
    return <Loader />;
  }

  if (orgError) {
    return (
      <Alert variant="danger">
        Failed to load organization information: {orgError.message}
      </Alert>
    );
  }

  const organization = orgData?.getOrganizationById;

  if (currentStep === "success") {
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
                onClick={() => navigate(`/user/razorpay/${orgId}/donate`)}
                className="w-100"
              >
                Make Another Donation
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/user/razorpay/my-transactions")}
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
                {organization.image && (
                  <img
                    src={organization.image}
                    alt={organization.name}
                    className="w-16 h-16 rounded-circle me-3"
                    style={{ objectFit: "cover" }}
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
                          ₹
                        </span>
                        <Form.Control
                          type="number"
                          value={formData.amount}
                          onChange={(e) =>
                            handleInputChange("amount", e.target.value)
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
                          handleInputChange("currency", e.target.value)
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
                          handleInputChange("amount", amount.toString())
                        }
                      >
                        ₹{amount}
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
                          handleInputChange("donorName", e.target.value)
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
                          handleInputChange("donorEmail", e.target.value)
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
                      handleInputChange("donorPhone", e.target.value)
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
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Add a personal message with your donation"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="anonymous"
                    checked={formData.anonymous}
                    onChange={(e) =>
                      handleInputChange("anonymous", e.target.checked)
                    }
                    label="Make this donation anonymous"
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
                  `Donate ${formData.amount ? formatCurrency(parseFloat(formData.amount), formData.currency) : ""}`
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
