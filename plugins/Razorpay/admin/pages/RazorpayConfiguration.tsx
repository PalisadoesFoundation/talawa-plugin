import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { toast } from 'react-toastify';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import Loader from '../../../../components/Loader/Loader';

// GraphQL operations
const GET_RAZORPAY_CONFIG = gql`
  query GetRazorpayConfig {
    razorpay_getRazorpayConfig {
      keyId
      keySecret
      webhookSecret
      isEnabled
      testMode
      currency
      description
    }
  }
`;

const UPDATE_RAZORPAY_CONFIG = gql`
  mutation UpdateRazorpayConfig($input: RazorpayConfigInput!) {
    razorpay_updateRazorpayConfig(input: $input) {
      keyId
      keySecret
      webhookSecret
      isEnabled
      testMode
      currency
      description
    }
  }
`;

interface RazorpayConfig {
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
  isEnabled: boolean;
  testMode: boolean;
  currency: string;
  description: string;
}

const RazorpayConfiguration: React.FC = () => {
  const [config, setConfig] = useState<RazorpayConfig>({
    keyId: undefined,
    keySecret: undefined,
    webhookSecret: undefined,
    isEnabled: false,
    testMode: true,
    currency: 'INR',
    description: 'Donation to organization',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  // GraphQL operations
  const { data, loading, error, refetch } = useQuery(GET_RAZORPAY_CONFIG);
  const [updateConfig] = useMutation(UPDATE_RAZORPAY_CONFIG);

  useEffect(() => {
    if (data?.getRazorpayConfig) {
      setConfig(data.getRazorpayConfig);
    }
  }, [data]);

  const handleInputChange = (
    field: keyof RazorpayConfig,
    value: string | boolean,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: result } = await updateConfig({
        variables: {
          input: config,
        },
      });

      if (result?.razorpay_updateRazorpayConfig) {
        toast.success('Razorpay configuration updated successfully');
        await refetch();
      } else {
        toast.error('Failed to update configuration');
      }
    } catch (error) {
      console.error('Error updating Razorpay config:', error);
      toast.error('Failed to update configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // This would call a test endpoint to verify Razorpay credentials
      toast.info('Testing Razorpay connection...');
      // Implementation would call a test mutation
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Alert variant="danger">
        Failed to load Razorpay configuration: {error.message}
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Razorpay Configuration
        </h1>
        <p className="text-gray-600 mt-2">
          Configure Razorpay payment gateway settings for the platform
        </p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Payment Gateway Settings</Card.Title>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* API Keys Section */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">API Configuration</h3>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Key ID</Form.Label>
                    <Form.Control
                      type={showSecrets ? 'text' : 'password'}
                      value={config.keyId}
                      onChange={(e) =>
                        handleInputChange('keyId', e.target.value)
                      }
                      placeholder="rzp_test_..."
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Key Secret</Form.Label>
                    <Form.Control
                      type={showSecrets ? 'text' : 'password'}
                      value={config.keySecret}
                      onChange={(e) =>
                        handleInputChange('keySecret', e.target.value)
                      }
                      placeholder="Enter your secret key"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="showSecrets"
                  checked={showSecrets}
                  onChange={(e) => setShowSecrets(e.target.checked)}
                  label="Show API keys"
                />
              </Form.Group>
            </div>

            {/* Webhook Configuration */}
            <div className="mb-4">
              <h3 className="h5 mb-3">Webhook Configuration</h3>

              <Form.Group className="mb-3">
                <Form.Label>Webhook Secret</Form.Label>
                <Form.Control
                  type={showSecrets ? 'text' : 'password'}
                  value={config.webhookSecret}
                  onChange={(e) =>
                    handleInputChange('webhookSecret', e.target.value)
                  }
                  placeholder="Enter webhook secret"
                />
                <Form.Text className="text-muted">
                  Secret key for verifying webhook signatures from Razorpay
                </Form.Text>
              </Form.Group>
            </div>

            {/* General Settings */}
            <div className="mb-4">
              <h3 className="h5 mb-3">General Settings</h3>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Currency</Form.Label>
                    <Form.Select
                      value={config.currency}
                      onChange={(e) =>
                        handleInputChange('currency', e.target.value)
                      }
                    >
                      <option value="INR">INR (Indian Rupee)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Default Description</Form.Label>
                    <Form.Control
                      type="text"
                      value={config.description}
                      onChange={(e) =>
                        handleInputChange('description', e.target.value)
                      }
                      placeholder="Default payment description"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="isEnabled"
                      checked={config.isEnabled}
                      onChange={(e) =>
                        handleInputChange('isEnabled', e.target.checked)
                      }
                      label="Enable Razorpay Payments"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="testMode"
                      checked={config.testMode}
                      onChange={(e) =>
                        handleInputChange('testMode', e.target.checked)
                      }
                      label="Test Mode"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-3 pt-3">
              <Button type="submit" disabled={isLoading} variant="primary">
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>

              <Button
                type="button"
                variant="outline-secondary"
                onClick={testConnection}
                disabled={isLoading}
              >
                Test Connection
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Information Card */}
      <Card className="mt-4">
        <Card.Header>
          <Card.Title>Configuration Information</Card.Title>
        </Card.Header>
        <Card.Body>
          <div>
            <div className="mb-3">
              <h5 className="fw-semibold">Webhook URL</h5>
              <p className="small text-muted font-monospace bg-light p-2 rounded">
                {window.location.origin}/api/plugins/razorpay/webhook
              </p>
            </div>

            <div className="mb-3">
              <h5 className="fw-semibold">Test Mode</h5>
              <p className="small text-muted">
                When enabled, all transactions will be processed in test mode
                using Razorpay's test environment.
              </p>
            </div>

            <div className="mb-3">
              <h5 className="fw-semibold">Security Note</h5>
              <p className="small text-muted">
                API keys are encrypted and stored securely. Never share your
                secret keys publicly.
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RazorpayConfiguration;
