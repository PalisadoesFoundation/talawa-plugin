/**
 * Extension Points Dashboard Component for Plugin Map
 *
 * This component displays all available extension points in the Talawa Admin Panel
 * for developers to understand where they can inject their own components.
 */

import React, { useState } from 'react';
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

const ExtensionPointsDashboard: React.FC = () => {
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

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Extension Points Dashboard</Title>
      <Paragraph>
        Overview of all extension points and their current status. Test the
        polling system below.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Test Poll System" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                Click the buttons below to test the polling system. Each button
                will log a poll with a specific extension point ID.
              </Paragraph>

              <Row gutter={[8, 8]}>
                <Col>
                  <Button
                    type="primary"
                    onClick={() => handlePollClick('RA1', 'admin')}
                  >
                    Admin Global Poll (RA1)
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    onClick={() => handlePollClick('RA2', 'admin', 'org-123')}
                  >
                    Admin Org Poll (RA2)
                  </Button>
                </Col>
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
          <Card title="Admin Extension Points" style={{ height: '300px' }}>
            <Paragraph>
              <strong>RA1:</strong> Admin Global Route - Global admin dashboard
              and system management
            </Paragraph>
            <Paragraph>
              <strong>RA2:</strong> Admin Organization Route -
              Organization-specific admin functions
            </Paragraph>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="User Extension Points" style={{ height: '300px' }}>
            <Paragraph>
              <strong>RU1:</strong> User Organization Route - User's
              organization-specific features
            </Paragraph>
            <Paragraph>
              <strong>RU2:</strong> User Global Route - User's global view and
              settings
            </Paragraph>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="System Information">
            <Paragraph>
              <strong>Total Extension Points:</strong> 4 (2 Admin + 2 User)
            </Paragraph>
            <Paragraph>
              <strong>Active Polls:</strong> Check the backend logs to see poll
              activity
            </Paragraph>
            <Paragraph>
              <strong>Last Updated:</strong> {new Date().toLocaleString()}
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExtensionPointsDashboard;
