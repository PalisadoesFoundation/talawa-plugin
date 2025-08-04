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
import { useParams, Navigate } from 'react-router-dom';
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

const ExtensionPointsOrganization: React.FC = () => {
  const [logRequest] = useMutation(LOG_PLUGIN_MAP_REQUEST);
  const { orgId } = useParams();
  const { getItem } = useLocalStorage();
  const userId = getItem('id') as string | null;

  // Redirect if no organization ID is found
  if (!orgId) {
    return <Navigate to={'/'} replace />;
  }

  const handlePollClick = async () => {
    try {
      const result = await logRequest({
        variables: {
          input: {
            userId: userId || 'unknown-user', // Use actual user ID from localStorage
            userRole: 'admin',
            organizationId: orgId, // Use actual organization ID from URL
            extensionPoint: 'RA2',
          },
        },
      });

      if (result.data?.plugin_map_logPluginMapRequest) {
        message.success(
          `Request ${result.data.plugin_map_logPluginMapRequest.pollNumber} logged successfully from RA2`,
        );
      }
    } catch (error) {
      console.error('Error logging request:', error);
      message.error('Failed to log request');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>RA2 - Admin Organization Extension Point</Title>
      <Paragraph>
        This page represents the RA2 extension point - Admin Organization Route.
        This is an organization-specific admin route that provides admin
        functionality within a specific organization. Current Organization ID:{' '}
        <strong>{orgId}</strong>
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Test Request System" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                Click the button below to test the request system for RA2
                extension point.
              </Paragraph>

              <Button type="primary" onClick={handlePollClick}>
                Request RA2 (Admin Organization)
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="RA2 Extension Point Details" style={{ height: '400px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                <strong>Extension Point ID:</strong> RA2
              </Paragraph>
              <Paragraph>
                <strong>Name:</strong> Admin Organization Route
              </Paragraph>
              <Paragraph>
                <strong>Description:</strong> Organization-specific admin
                functions and settings
              </Paragraph>
              <Paragraph>
                <strong>Context:</strong> Organization-specific
              </Paragraph>
              <Paragraph>
                <strong>User Role:</strong> Admin
              </Paragraph>
              <Paragraph>
                <strong>Organization ID:</strong> {orgId}
              </Paragraph>
              <Paragraph>
                <strong>Features:</strong>
              </Paragraph>
              <ul>
                <li>Organization management</li>
                <li>Member administration</li>
                <li>Event management</li>
                <li>Organization settings</li>
                <li>Admin analytics</li>
              </ul>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Extension Point Information">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Paragraph>
                  <strong>Type:</strong> Organization Route
                </Paragraph>
              </Col>
              <Col span={8}>
                <Paragraph>
                  <strong>Access Level:</strong> Admin Only
                </Paragraph>
              </Col>
              <Col span={8}>
                <Paragraph>
                  <strong>Organization:</strong> Specific
                </Paragraph>
              </Col>
            </Row>
            <Paragraph>
              <strong>Note:</strong> This extension point is accessible from
              organization-specific admin contexts.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExtensionPointsOrganization;
