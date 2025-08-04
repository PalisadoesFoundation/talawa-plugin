/**
 * Extension Points User Component for Plugin Map
 *
 * This component displays user-specific extension points in the Talawa
 * Admin Panel. These extension points are designed for user-facing
 * functionality and can be used to enhance the user experience.
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

const ExtensionPointsUser: React.FC = () => {
  const [logPoll] = useMutation(LOG_PLUGIN_MAP_POLL);

  const handlePollClick = async (
    extensionPoint: string,
    userRole: string,
    organizationId?: string,
  ) => {
    try {
      const result = await logPoll({
        variables: {
          input: {
            userId: 'current-user', // This should come from auth context
            userRole,
            organizationId: organizationId || null,
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

  const userGlobalExtensions = [
    {
      id: 'RU2',
      name: 'User Global Route',
      description: "User's global view and cross-organization features",
      features: ['Global profile', 'Cross-org settings', 'Global preferences'],
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
      <Title level={2}>User Extension Points</Title>
      <Paragraph>
        User-specific extension points that provide user-focused functionality
        across different contexts.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Test Poll System" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                Click the buttons below to test the polling system for
                user-specific extension points.
              </Paragraph>

              <Row gutter={[8, 8]}>
                <Col>
                  <Button
                    type="primary"
                    onClick={() => handlePollClick('RU1', 'user', 'org-123')}
                  >
                    User Org Poll (RU1)
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    onClick={() => handlePollClick('RU2', 'user')}
                  >
                    User Global Poll (RU2)
                  </Button>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="User Global Extensions" style={{ height: '400px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                <strong>Context:</strong> Global (no organization)
              </Paragraph>

              {userGlobalExtensions.map((ext) => (
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

        <Col span={12}>
          <Card
            title="User Organization Extensions"
            style={{ height: '400px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                <strong>Context:</strong> Organization-specific (org-123)
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
                    onClick={() => handlePollClick(ext.id, 'user', 'org-123')}
                  >
                    Test {ext.id}
                  </Button>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="User Context Information">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Paragraph>
                  <strong>Global Extensions:</strong>{' '}
                  {userGlobalExtensions.length}
                </Paragraph>
              </Col>
              <Col span={8}>
                <Paragraph>
                  <strong>Organization Extensions:</strong>{' '}
                  {userOrgExtensions.length}
                </Paragraph>
              </Col>
              <Col span={8}>
                <Paragraph>
                  <strong>Total User Extensions:</strong>{' '}
                  {userGlobalExtensions.length + userOrgExtensions.length}
                </Paragraph>
              </Col>
            </Row>
            <Paragraph>
              <strong>Note:</strong> Global polls have no organization ID, while
              organization polls include the org ID.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExtensionPointsUser;
