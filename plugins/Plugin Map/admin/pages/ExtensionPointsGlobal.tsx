/**
 * Extension Points Global Component for Plugin Map
 *
 * This component displays all available extension points in the Talawa Admin Panel
 * from a global user perspective, helping developers understand the full ecosystem.
 */

import React from 'react';
import { Card, Typography, Row, Col, Button, message, Space, Tabs } from 'antd';
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

const ExtensionPointsGlobal: React.FC = () => {
  const [logPoll] = useMutation(LOG_PLUGIN_MAP_POLL);

  const handlePollClick = async (extensionPoint: string, userRole: string) => {
    try {
      const result = await logPoll({
        variables: {
          input: {
            userId: 'current-user', // This should come from auth context
            userRole,
            organizationId: null, // Global routes have no organization
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

  const adminGlobalExtensions = [
    {
      id: 'RA1',
      name: 'Admin Global Route',
      description: 'Global admin dashboard and system management',
      features: ['System monitoring', 'Global analytics', 'User management'],
    },
  ];

  const userGlobalExtensions = [
    {
      id: 'RU2',
      name: 'User Global Route',
      description: "User's global view and cross-organization features",
      features: ['Global profile', 'Cross-org settings', 'Global preferences'],
    },
  ];

  const items = [
    {
      key: 'admin',
      label: 'Admin Global Extensions',
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title="Test Admin Global Polls"
              style={{ marginBottom: '16px' }}
            >
              <Space wrap>
                {adminGlobalExtensions.map((ext) => (
                  <Button
                    key={ext.id}
                    type="primary"
                    onClick={() => handlePollClick(ext.id, 'admin')}
                  >
                    {ext.name} ({ext.id})
                  </Button>
                ))}
              </Space>
            </Card>
          </Col>
          {adminGlobalExtensions.map((ext) => (
            <Col span={24} key={ext.id}>
              <Card title={ext.name} style={{ height: '200px' }}>
                <Paragraph>
                  <strong>ID:</strong> {ext.id}
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
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: 'user',
      label: 'User Global Extensions',
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title="Test User Global Polls"
              style={{ marginBottom: '16px' }}
            >
              <Space wrap>
                {userGlobalExtensions.map((ext) => (
                  <Button
                    key={ext.id}
                    type="primary"
                    onClick={() => handlePollClick(ext.id, 'user')}
                  >
                    {ext.name} ({ext.id})
                  </Button>
                ))}
              </Space>
            </Card>
          </Col>
          {userGlobalExtensions.map((ext) => (
            <Col span={24} key={ext.id}>
              <Card title={ext.name} style={{ height: '200px' }}>
                <Paragraph>
                  <strong>ID:</strong> {ext.id}
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
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Global Extension Points</Title>
      <Paragraph>
        Global extension points that work across all organizations. These are
        accessible from any context.
      </Paragraph>

      <Tabs items={items} />
    </div>
  );
};

export default ExtensionPointsGlobal;
