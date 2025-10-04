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

const TEST_RAZORPAY_SETUP = gql`
  mutation TestRazorpaySetup {
    razorpay_testRazorpaySetup {
      success
      message
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
  const [testSetup] = useMutation(TEST_RAZORPAY_SETUP);

  useEffect(() => {
    if (data?.razorpay_getRazorpayConfig) {
      const configData = data.razorpay_getRazorpayConfig;
      setConfig(configData);
    }
  }, [data]);

  const handleInputChange = (
    field: keyof RazorpayConfig,
    value: string | boolean,
  ) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateConfig({
        variables: {
          input: {
            keyId: config.keyId || null,
            keySecret: config.keySecret || null,
            webhookSecret: config.webhookSecret || null,
            isEnabled: config.isEnabled,
            testMode: config.testMode,
            currency: config.currency,
            description: config.description,
          },
        },
      });
      toast.success('Razorpay configuration saved successfully!');
      refetch();
    } catch (error) {
      console.error('Error saving Razorpay configuration:', error);
      toast.error('Failed to save Razorpay configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSetup = async () => {
    if (!config.keyId || !config.keySecret || !config.webhookSecret) {
      toast.error('Please enter Key ID, Key Secret, and Webhook Secret before testing setup');
      return;
    }

    // Validate key format
    if (!config.keyId.startsWith('rzp_')) {
      toast.error('Invalid Key ID format. Razorpay Key ID should start with "rzp_"');
      return;
    }

    setIsLoading(true);
    try {
      toast.info('Testing Razorpay setup with dummy payment...');
      const { data: result } = await testSetup();
      
      if (result?.razorpay_testRazorpaySetup?.success) {
        toast.success('Setup test successful! Razorpay configuration is working correctly.');
      } else {
        const errorMessage = result?.razorpay_testRazorpaySetup?.message || 'Setup test failed';
        toast.error(errorMessage);
        
        // Log the error for debugging
        console.error('Razorpay setup test failed:', {
          error: errorMessage,
          config: {
            keyId: config.keyId?.substring(0, 8) + '...',
            hasKeySecret: !!config.keySecret,
            hasWebhookSecret: !!config.webhookSecret,
            testMode: config.testMode,
          },
        });
      }
    } catch (error) {
      console.error('Error testing Razorpay setup:', error);
      toast.error('Setup test failed. Please check your configuration and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigComplete = () => {
    return !!(config.keyId && config.keySecret && config.webhookSecret);
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
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Razorpay Configuration
            </h1>
            <p className="text-gray-600 mt-2">
              Configure your Razorpay payment gateway settings
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className={`badge ${config.isEnabled ? 'bg-success' : 'bg-secondary'}`}>
              {config.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <span className={`badge ${config.testMode ? 'bg-warning' : 'bg-info'}`}>
              {config.testMode ? 'Test Mode' : 'Live Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Razorpay Configuration Form */}
      <Card>
        <Card.Header>
          <Card.Title className="d-flex align-items-center">
            <span className="me-2">⚙️</span>
            Razorpay Configuration
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSaveConfig}>
            <Row>
              {/* API Keys Section */}
              <Col md={6}>
                <h5 className="mb-3">🔑 API Credentials</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Key ID *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="rzp_test_..."
                    value={config.keyId || ''}
                    onChange={(e) => handleInputChange('keyId', e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    Your Razorpay Key ID (starts with rzp_test_ or rzp_live_)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Key Secret *</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type={showSecrets ? 'text' : 'password'}
                      placeholder="Enter your key secret"
                      value={config.keySecret || ''}
                      onChange={(e) => handleInputChange('keySecret', e.target.value)}
                      required
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? '👁️' : '👁️‍🗨️'}
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Your Razorpay Key Secret (keep this secure)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Webhook Secret *</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type={showSecrets ? 'text' : 'password'}
                      placeholder="Enter your webhook secret"
                      value={config.webhookSecret || ''}
                      onChange={(e) => handleInputChange('webhookSecret', e.target.value)}
                      required
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? '👁️' : '👁️‍🗨️'}
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Webhook secret for signature verification
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Settings Section */}
              <Col md={6}>
                <h5 className="mb-3">⚙️ Settings</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Currency</Form.Label>
                  <Form.Select
                    value={config.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                  >
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Payment description"
                    value={config.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="testMode"
                    label="Test Mode"
                    checked={config.testMode}
                    onChange={(e) => handleInputChange('testMode', e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Enable test mode for development and testing
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="isEnabled"
                    label="Enable Razorpay"
                    checked={config.isEnabled}
                    onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Enable Razorpay payment processing
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Action Buttons */}
            <div className="d-flex justify-content-between mt-4">
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleTestSetup}
                disabled={isLoading || !isConfigComplete()}
              >
                {isLoading ? 'Testing...' : 'Test with Dummy Payment'}
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>

            {!isConfigComplete() && (
              <Alert variant="info" className="mt-3">
                <strong>Complete the required fields</strong> to enable testing and save your configuration.
              </Alert>
            )}
          </Form>
        </Card.Body>
      </Card>

      {/* Help Section */}
      <Card className="mt-4">
        <Card.Header>
          <Card.Title>📚 Help & Resources</Card.Title>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Getting Started</h6>
              <ul className="list-unstyled">
                <li>• Get your API keys from Razorpay Dashboard</li>
                <li>• Configure webhook URL: <code>/api/plugins/razorpay/webhook/</code></li>
                <li>• Copy webhook secret from Razorpay Dashboard</li>
                <li>• Test your setup with dummy payment</li>
              </ul>
            </Col>
            <Col md={6}>
              <h6>Useful Links</h6>
              <p>
                <a href="https://razorpay.com/docs" target="_blank" rel="noopener noreferrer">
                  Razorpay Documentation
                </a> • 
                <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer">
                  Razorpay Dashboard
                </a>
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RazorpayConfiguration;