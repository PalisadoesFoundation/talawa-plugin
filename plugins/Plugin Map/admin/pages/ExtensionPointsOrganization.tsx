/**
 * Extension Points Organization Component for Plugin Map
 *
 * This component displays organization-specific extension points in the Talawa Admin Panel
 * for developers to understand where they can inject their own components in org contexts.
 */

import React from 'react';
import { Card, Typography, Row, Col, Button, message, Space } from 'antd';
import { useMutation } from '@apollo/client';
import { gql } from 'graphql-tag';

const { Title, Paragraph } = Typography;

// GraphQL mutation for logging polls
const LOG_PLUGIN_MAP_POLL = gql`
  mutation LogPluginMapPoll($input: PluginMapPollInput!) {
    logPluginMapPoll(input: $input) {
      id
      pollNumber
      userId
      userRole
      organizationId
      extensionPoint
      createdAt
    }
  }
`;

const ExtensionPointsOrganization: React.FC = () => {
  const [logPoll] = useMutation(LOG_PLUGIN_MAP_POLL);

  // Mock organization ID - in real app this would come from context
  const organizationId = 'org-123';

  const handlePollClick = async (extensionPoint: string, userRole: string) => {
    try {
      const result = await logPoll({
        variables: {
          input: {
            userId: 'current-user', // This should come from auth context
            userRole,
            organizationId, // Organization-specific routes have org ID
            extensionPoint,
          },
        },
      });

      if (result.data?.logPluginMapPoll) {
        message.success(
          `Poll ${result.data.logPluginMapPoll.pollNumber} logged successfully from ${extensionPoint}`,
        );
      }
    } catch (error) {
      console.error('Error logging poll:', error);
      message.error('Failed to log poll');
    }
  };

  const adminOrgExtensions = [
    {
      id: 'RA2',
      name: 'Admin Organization Route',
      description: 'Organization-specific admin functions and settings',
      features: [
        'Member management',
        'Organization settings',
        'Event management',
      ],
    },
  ];

  const userOrgExtensions = [
    {
      id: 'RU1',
      name: 'User Organization Route',
      description: "User's organization-specific dashboard and features",
      features: ['Org dashboard', 'Member view', 'Org activities'],
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Organization Extension Points</Title>
      <Paragraph>
        Organization-specific extension points that are only accessible within a
        specific organization context. Current Organization ID:{' '}
        <strong>{organizationId}</strong>
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Test Poll System" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                Click the buttons below to test the polling system for
                organization-specific extension points.
              </Paragraph>

              <Row gutter={[8, 8]}>
                <Col>
                  <Button
                    type="primary"
                    onClick={() => handlePollClick('RA2', 'admin')}
                  >
                    Admin Org Poll (RA2)
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    onClick={() => handlePollClick('RU1', 'user')}
                  >
                    User Org Poll (RU1)
                  </Button>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="Admin Organization Extensions"
            style={{ height: '400px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                <strong>Organization ID:</strong> {organizationId}
              </Paragraph>

              {adminOrgExtensions.map((ext) => (
                <Card key={ext.id} size="small" style={{ marginBottom: '8px' }}>
                  <Paragraph>
                    <strong>{ext.id}:</strong> {ext.name}
                  </Paragraph>
                  <Paragraph>{ext.description}</Paragraph>
                  <Paragraph>
                    <strong>Features:</strong>
                  </Paragraph>
                  <ul>
                    {ext.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handlePollClick(ext.id, 'admin')}
                  >
                    Test {ext.id}
                  </Button>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="User Organization Extensions"
            style={{ height: '400px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                <strong>Organization ID:</strong> {organizationId}
              </Paragraph>

              {userOrgExtensions.map((ext) => (
                <Card key={ext.id} size="small" style={{ marginBottom: '8px' }}>
                  <Paragraph>
                    <strong>{ext.id}:</strong> {ext.name}
                  </Paragraph>
                  <Paragraph>{ext.description}</Paragraph>
                  <Paragraph>
                    <strong>Features:</strong>
                  </Paragraph>
                  <ul>
                    {ext.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handlePollClick(ext.id, 'user')}
                  >
                    Test {ext.id}
                  </Button>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Organization Context Information">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Paragraph>
                  <strong>Organization ID:</strong> {organizationId}
                </Paragraph>
              </Col>
              <Col span={8}>
                <Paragraph>
                  <strong>Admin Extensions:</strong> {adminOrgExtensions.length}
                </Paragraph>
              </Col>
              <Col span={8}>
                <Paragraph>
                  <strong>User Extensions:</strong> {userOrgExtensions.length}
                </Paragraph>
              </Col>
            </Row>
            <Paragraph>
              <strong>Note:</strong> All polls from this page will include the
              organization ID in the request.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExtensionPointsOrganization;
