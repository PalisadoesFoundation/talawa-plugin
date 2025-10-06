import React, { useState, useEffect } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import { toast } from "react-toastify";
import { Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import Loader from "../../../../components/Loader/Loader";

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

const TEST_RAZORPAY_CONNECTION = gql`
  mutation TestRazorpayConnection {
    razorpay_testRazorpayConnection {
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
    currency: "INR",
    description: "Donation to organization",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  // GraphQL operations
  const { data, loading, error, refetch } = useQuery(GET_RAZORPAY_CONFIG);
  const [updateConfig] = useMutation(UPDATE_RAZORPAY_CONFIG);
  const [testConnection] = useMutation(TEST_RAZORPAY_CONNECTION);

  useEffect(() => {
    if (data?.razorpay_getRazorpayConfig) {
      const configData = data.razorpay_getRazorpayConfig;
      setConfig(configData);

      // Check if this is first time setup (no keyId or keySecret)
      if (!configData.keyId || !configData.keySecret) {
        setIsFirstTimeSetup(true);
        setCurrentStep(1);
      } else {
        setIsFirstTimeSetup(false);
        setCurrentStep(4); // Go to final step if already configured
      }
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
      // Clean the config object to remove any Apollo Client added fields
      const cleanConfig = {
        keyId: config.keyId,
        keySecret: config.keySecret,
        webhookSecret: config.webhookSecret,
        isEnabled: config.isEnabled,
        testMode: config.testMode,
        currency: config.currency,
        description: config.description,
      };

      const { data: result } = await updateConfig({
        variables: {
          input: cleanConfig,
        },
      });

      if (result?.razorpay_updateRazorpayConfig) {
        toast.success("Razorpay configuration updated successfully");
        await refetch();
        if (isFirstTimeSetup) {
          setCurrentStep(4);
          setIsFirstTimeSetup(false);
        }
      } else {
        toast.error("Failed to update configuration");
      }
    } catch (error) {
      console.error("Error updating Razorpay config:", error);
      toast.error("Failed to update configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save API keys first
      const cleanConfig = {
        keyId: config.keyId,
        keySecret: config.keySecret,
        webhookSecret: config.webhookSecret || "",
        isEnabled: config.isEnabled,
        testMode: config.testMode,
        currency: config.currency,
        description: config.description,
      };

      const { data: result } = await updateConfig({
        variables: {
          input: cleanConfig,
        },
      });

      if (result?.razorpay_updateRazorpayConfig) {
        toast.success("API keys saved successfully");
        await refetch();
        nextStep(); // Move to test connection step
      } else {
        toast.error("Failed to save API keys");
      }
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast.error("Failed to save API keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save additional settings
      const cleanConfig = {
        keyId: config.keyId,
        keySecret: config.keySecret,
        webhookSecret: config.webhookSecret || "",
        isEnabled: config.isEnabled,
        testMode: config.testMode,
        currency: config.currency,
        description: config.description,
      };

      const { data: result } = await updateConfig({
        variables: {
          input: cleanConfig,
        },
      });

      if (result?.razorpay_updateRazorpayConfig) {
        toast.success("Settings saved successfully");
        await refetch();
        nextStep(); // Move to final step
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.keyId || !config.keySecret) {
      toast.error(
        "Please enter both Key ID and Key Secret before testing connection",
      );
      return;
    }

    // Validate key format
    if (!config.keyId.startsWith("rzp_")) {
      toast.error(
        'Invalid Key ID format. Razorpay Key ID should start with "rzp_"',
      );
      return;
    }

    setIsLoading(true);
    try {
      toast.info("Testing Razorpay connection...");
      const { data: result } = await testConnection();

      if (result?.razorpay_testRazorpayConnection?.success) {
        toast.success(
          "Connection test successful! Razorpay credentials are valid.",
        );
        if (isFirstTimeSetup) {
          setCurrentStep(3);
        }
      } else {
        const errorMessage =
          result?.razorpay_testRazorpayConnection?.message ||
          "Connection test failed";
        toast.error(errorMessage);

        // Log the error for debugging
        console.error("Razorpay connection test failed:", {
          error: errorMessage,
          keyId: config.keyId?.substring(0, 8) + "...",
          testMode: config.testMode,
        });
      }
    } catch (error) {
      console.error("Connection test error:", error);
      toast.error("Connection test failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getSetupProgress = () => {
    if (!isFirstTimeSetup) return 100;
    return (currentStep / 4) * 100;
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return "completed";
    if (step === currentStep) return "current";
    return "pending";
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
              {isFirstTimeSetup
                ? "Set up Razorpay payment gateway for your organization"
                : "Manage your Razorpay payment gateway settings"}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span
              className={`badge ${config.isEnabled ? "bg-success" : "bg-secondary"}`}
            >
              {config.isEnabled ? "Enabled" : "Disabled"}
            </span>
            <span
              className={`badge ${config.testMode ? "bg-warning" : "bg-info"}`}
            >
              {config.testMode ? "Test Mode" : "Live Mode"}
            </span>
          </div>
        </div>

        {isFirstTimeSetup && (
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-sm text-muted">Setup Progress</span>
              <span className="text-sm text-muted">
                {Math.round(getSetupProgress())}%
              </span>
            </div>
            <div className="progress mb-3">
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${getSetupProgress()}%` }}
                aria-valuenow={getSetupProgress()}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <div className="d-flex justify-content-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="text-center">
                  <div
                    className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                      getStepStatus(step) === "completed"
                        ? "bg-success text-white"
                        : getStepStatus(step) === "current"
                          ? "bg-primary text-white"
                          : "bg-light text-muted"
                    }`}
                    style={{ width: "30px", height: "30px" }}
                  >
                    {getStepStatus(step) === "completed" ? "✓" : step}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {step === 1
                      ? "API Keys"
                      : step === 2
                        ? "Test Connection"
                        : step === 3
                          ? "Settings"
                          : "Complete"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 1: API Keys Setup */}
      {currentStep === 1 && (
        <Card>
          <Card.Header>
            <Card.Title className="d-flex align-items-center">
              <span className="me-2">🔑</span>
              Step 1: API Keys Configuration
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <Alert variant="info" className="mb-4">
              <Alert.Heading>Get Your Razorpay API Keys</Alert.Heading>
              <p className="mb-2">
                To get started, you need to obtain your Razorpay API keys:
              </p>
              <ol className="mb-3">
                <li>
                  Visit{" "}
                  <a
                    href="https://dashboard.razorpay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Razorpay Dashboard
                  </a>
                </li>
                <li>
                  Go to <strong>Settings → API Keys</strong>
                </li>
                <li>
                  Generate your <strong>Key ID</strong> and{" "}
                  <strong>Key Secret</strong>
                </li>
                <li>Copy and paste them below</li>
              </ol>
              <div className="alert alert-warning mb-0">
                <strong>Important:</strong>
                <ul className="mb-0 mt-2">
                  <li>
                    Use <strong>Test Keys</strong> for development (start with{" "}
                    <code>rzp_test_</code>)
                  </li>
                  <li>
                    Use <strong>Live Keys</strong> for production (start with{" "}
                    <code>rzp_live_</code>)
                  </li>
                  <li>Make sure your Razorpay account is activated</li>
                  <li>
                    Keep your Key Secret secure and never share it publicly
                  </li>
                </ul>
              </div>
            </Alert>

            <Form onSubmit={handleStep1Submit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Key ID <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type={showSecrets ? "text" : "password"}
                      value={config.keyId || ""}
                      onChange={(e) =>
                        handleInputChange("keyId", e.target.value)
                      }
                      placeholder="rzp_test_..."
                      required
                    />
                    <Form.Text className="text-muted">
                      Your Razorpay Key ID (starts with rzp_test_ or rzp_live_)
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Key Secret <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type={showSecrets ? "text" : "password"}
                      value={config.keySecret || ""}
                      onChange={(e) =>
                        handleInputChange("keySecret", e.target.value)
                      }
                      placeholder="Enter your secret key"
                      required
                    />
                    <Form.Text className="text-muted">
                      Your Razorpay Key Secret (keep this secure)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="showSecrets"
                  checked={showSecrets}
                  onChange={(e) => setShowSecrets(e.target.checked)}
                  label="Show API keys (for verification)"
                />
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!config.keyId || !config.keySecret || isLoading}
                >
                  {isLoading ? "Saving..." : "Next: Test Connection"}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Step 2: Test Connection */}
      {currentStep === 2 && (
        <Card>
          <Card.Header>
            <Card.Title className="d-flex align-items-center">
              <span className="me-2">🔍</span>
              Step 2: Test Connection
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>Verify Your Credentials</Alert.Heading>
              <p className="mb-0">
                Let's test your Razorpay API keys to make sure they're working
                correctly.
              </p>
            </Alert>

            <div className="text-center py-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleTestConnection}
                disabled={isLoading}
                className="me-3"
              >
                {isLoading ? "Testing..." : "Test Connection"}
              </Button>

              <Button
                variant="outline-secondary"
                onClick={prevStep}
                disabled={isLoading}
              >
                Back to API Keys
              </Button>
            </div>

            {config.keyId && config.keySecret && (
              <div className="mt-4">
                <h6>Current Configuration:</h6>
                <div className="bg-light p-3 rounded">
                  <div>
                    <strong>Key ID:</strong> {config.keyId.substring(0, 8)}...
                  </div>
                  <div>
                    <strong>Mode:</strong>{" "}
                    {config.testMode ? "Test Mode" : "Live Mode"}
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Step 3: Additional Settings */}
      {currentStep === 3 && (
        <Card>
          <Card.Header>
            <Card.Title className="d-flex align-items-center">
              <span className="me-2">⚙️</span>
              Step 3: Additional Settings
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleStep3Submit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Currency</Form.Label>
                    <Form.Select
                      value={config.currency}
                      onChange={(e) =>
                        handleInputChange("currency", e.target.value)
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
                        handleInputChange("description", e.target.value)
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
                        handleInputChange("isEnabled", e.target.checked)
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
                        handleInputChange("testMode", e.target.checked)
                      }
                      label="Test Mode (Recommended for initial setup)"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-between">
                <Button
                  variant="outline-secondary"
                  onClick={prevStep}
                  disabled={isLoading}
                >
                  Back to Test Connection
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Next: Complete Setup"}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Step 4: Complete Setup / Main Configuration */}
      {currentStep === 4 && (
        <>
          <Card>
            <Card.Header>
              <Card.Title className="d-flex align-items-center">
                <span className="me-2">✅</span>
                {isFirstTimeSetup
                  ? "Setup Complete!"
                  : "Configuration Management"}
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {isFirstTimeSetup && (
                <Alert variant="success" className="mb-4">
                  <Alert.Heading>Congratulations!</Alert.Heading>
                  <p className="mb-0">
                    Your Razorpay payment gateway has been configured
                    successfully. You can now accept payments through your
                    organization.
                  </p>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* API Keys Section */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-3">
                    API Configuration
                  </h3>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Key ID</Form.Label>
                        <Form.Control
                          type={showSecrets ? "text" : "password"}
                          value={config.keyId || ""}
                          onChange={(e) =>
                            handleInputChange("keyId", e.target.value)
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
                          type={showSecrets ? "text" : "password"}
                          value={config.keySecret || ""}
                          onChange={(e) =>
                            handleInputChange("keySecret", e.target.value)
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
                      type={showSecrets ? "text" : "password"}
                      value={config.webhookSecret || ""}
                      onChange={(e) =>
                        handleInputChange("webhookSecret", e.target.value)
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
                            handleInputChange("currency", e.target.value)
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
                            handleInputChange("description", e.target.value)
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
                            handleInputChange("isEnabled", e.target.checked)
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
                            handleInputChange("testMode", e.target.checked)
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
                    {isLoading ? "Saving..." : "Save Configuration"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={handleTestConnection}
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
                  <p className="small text-muted">
                    Configure this URL in your Razorpay dashboard under Settings
                    → Webhooks
                  </p>
                </div>

                <div className="mb-3">
                  <h5 className="fw-semibold">Test Mode</h5>
                  <p className="small text-muted">
                    When enabled, all transactions will be processed in test
                    mode using Razorpay's test environment. Perfect for
                    development and testing.
                  </p>
                </div>

                <div className="mb-3">
                  <h5 className="fw-semibold">Security Note</h5>
                  <p className="small text-muted">
                    API keys are encrypted and stored securely. Never share your
                    secret keys publicly. Always use test keys during
                    development.
                  </p>
                </div>

                <div className="mb-3">
                  <h5 className="fw-semibold">Need Help?</h5>
                  <p className="small text-muted">
                    <a
                      href="https://razorpay.com/docs/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Razorpay Documentation
                    </a>{" "}
                    •
                    <a
                      href="https://dashboard.razorpay.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Razorpay Dashboard
                    </a>
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default RazorpayConfiguration;
