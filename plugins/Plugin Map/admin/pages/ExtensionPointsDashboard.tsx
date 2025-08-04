/**
 * Extension Points Dashboard Component for Plugin Map
 *
 * This component displays all available extension points in the Talawa Admin Panel
 * for developers to understand where they can inject their own components.
 */

import React, { useState } from 'react';
import { Card, Typography, Row, Col, Space, Button, message } from 'antd';
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

const ExtensionPointsDashboard: React.FC = () => {
  const [logRequest] = useMutation(LOG_PLUGIN_MAP_REQUEST);
  const { getItem } = useLocalStorage();
  const userId = getItem('id') as string | null;

  const handlePollClick = async () => {
    try {
      const result = await logRequest({
        variables: {
          input: {
            userId: userId || 'unknown-user', // Use actual user ID from localStorage
            userRole: 'admin',
            organizationId: null, // Global routes have no organization
            extensionPoint: 'RA1',
          },
        },
      });

      if (result.data?.plugin_map_logPluginMapRequest) {
        message.success(
          `Request ${result.data.plugin_map_logPluginMapRequest.pollNumber} logged successfully from RA1`,
        );
      }
    } catch (error) {
      console.error('Error logging request:', error);
      message.error('Failed to log request');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>RA1 - Admin Global Extension Point</Title>
      <Paragraph>
        This page represents the RA1 extension point - Admin Global Route. This
        is a global admin route that provides system-wide admin functionality.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Test Request System" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                Click the button below to test the request system for RA1
                extension point.
              </Paragraph>

              <Button type="primary" onClick={handlePollClick}>
                Request RA1 (Admin Global)
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="RA1 Extension Point Details" style={{ height: '400px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                <strong>Extension Point ID:</strong> RA1
              </Paragraph>
              <Paragraph>
                <strong>Name:</strong> Admin Global Route
              </Paragraph>
              <Paragraph>
                <strong>Description:</strong> Global admin dashboard and system
                management
              </Paragraph>
              <Paragraph>
                <strong>Context:</strong> Global (no organization)
              </Paragraph>
              <Paragraph>
                <strong>User Role:</strong> Admin
              </Paragraph>
              <Paragraph>
                <strong>Features:</strong>
              </Paragraph>
              <ul>
                <li>System-wide admin dashboard</li>
                <li>Global user management</li>
                <li>System configuration</li>
                <li>Cross-organization admin features</li>
                <li>Global analytics and reports</li>
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
                  <strong>Access Level:</strong> Admin Only
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
              global admin context.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExtensionPointsDashboard;
