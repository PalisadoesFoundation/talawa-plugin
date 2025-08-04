/**
 * Extension Points Global Component for Plugin Map
 *
 * This component displays all available extension points in the Talawa Admin Panel
 * from a global user perspective, helping developers understand the full ecosystem.
 */

import React from 'react';
import { Card, Typography, Row, Col, Button, message, Space } from 'antd';
import { useMutation } from '@apollo/client';
import { gql } from 'graphql-tag';
import useLocalStorage from 'utils/useLocalstorage';

const { Title, Paragraph } = Typography;

// GraphQL mutation for logging requests
const LOG_PLUGIN_MAP_REQUEST = gql`
  mutation LogPluginMapRequest($input: PluginMapRequestInput!) {
    plugin_map_logPluginMapRequest(input: $input) {
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
  const [logRequest] = useMutation(LOG_PLUGIN_MAP_REQUEST);
  const { getItem } = useLocalStorage();
  const userId = getItem('id') as string | null;

  const handlePollClick = async () => {
    try {
      const result = await logRequest({
        variables: {
          input: {
            userId: userId || 'unknown-user', // Use actual user ID from localStorage
            userRole: 'user',
            organizationId: null, // Global routes have no organization
            extensionPoint: 'RU2',
          },
        },
      });

      if (result.data?.plugin_map_logPluginMapRequest) {
        message.success(
          `Request ${result.data.plugin_map_logPluginMapRequest.pollNumber} logged successfully from RU2`,
        );
      }
    } catch (error) {
      console.error('Error logging request:', error);
      message.error('Failed to log request');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>RU2 - User Global Extension Point</Title>
      <Paragraph>
        This page represents the RU2 extension point - User Global Route. This
        is a global user route that provides user functionality across all
        organizations.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Test Request System" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                Click the button below to test the request system for RU2
                extension point.
              </Paragraph>

              <Button type="primary" onClick={handlePollClick}>
                Request RU2 (User Global)
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="RU2 Extension Point Details" style={{ height: '400px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                <strong>Extension Point ID:</strong> RU2
              </Paragraph>
              <Paragraph>
                <strong>Name:</strong> User Global Route
              </Paragraph>
              <Paragraph>
                <strong>Description:</strong> User's global view and
                cross-organization features
              </Paragraph>
              <Paragraph>
                <strong>Context:</strong> Global (no organization)
              </Paragraph>
              <Paragraph>
                <strong>User Role:</strong> User
              </Paragraph>
              <Paragraph>
                <strong>Features:</strong>
              </Paragraph>
              <ul>
                <li>Global profile</li>
                <li>Cross-org settings</li>
                <li>Global preferences</li>
                <li>Global user dashboard</li>
                <li>Cross-organization features</li>
              </ul>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Extension Point Information">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Paragraph>
                  <strong>Type:</strong> Global Route
                </Paragraph>
              </Col>
              <Col span={8}>
                <Paragraph>
                  <strong>Access Level:</strong> User Only
                </Paragraph>
              </Col>
              <Col span={8}>
                <Paragraph>
                  <strong>Organization:</strong> None (Global)
                </Paragraph>
              </Col>
            </Row>
            <Paragraph>
              <strong>Note:</strong> This extension point is accessible from any
              global user context.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExtensionPointsGlobal;
