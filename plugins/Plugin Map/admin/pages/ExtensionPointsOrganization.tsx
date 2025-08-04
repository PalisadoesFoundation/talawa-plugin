/**
 * Extension Points Organization Component for Plugin Map
 *
 * This component displays all available extension points in the Talawa Admin Panel
 * from an admin organization perspective, helping developers understand the admin
 * organization ecosystem.
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  message,
  Space,
  Table,
  Tag,
} from 'antd';
import { useMutation, useQuery } from '@apollo/client';
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

// GraphQL query for fetching requests
const GET_PLUGIN_MAP_REQUESTS = gql`
  query GetPluginMapRequests($input: GetPluginMapRequestsInput) {
    plugin_map_getPluginMapRequests(input: $input) {
      requests {
        id
        pollNumber
        userId
        userRole
        organizationId
        extensionPoint
        createdAt
      }
      totalCount
      hasMore
    }
  }
`;

const ExtensionPointsOrganization: React.FC = () => {
  const [logRequest] = useMutation(LOG_PLUGIN_MAP_REQUEST);
  const { orgId } = useParams();
  const { getItem } = useLocalStorage();
  const userId = getItem('id') as string | null;
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Redirect if no orgId is available
  if (!orgId) {
    return <Navigate to="/" replace />;
  }

  // Query to fetch requests for this extension point
  const { data: requestsData, loading: loadingRequests, refetch } = useQuery(GET_PLUGIN_MAP_REQUESTS, {
    variables: {
      input: {
        extensionPoint: 'RA1',
        userRole: 'admin',
        organizationId: orgId,
        userId: userId || 'unknown-user', // Filter by current user ID
      },
    },
    fetchPolicy: 'network-only',
  });

  // Refetch when a new request is logged
  useEffect(() => {
    if (refetchTrigger > 0) {
      refetch();
    }
  }, [refetchTrigger, refetch]);

  const handlePollClick = async () => {
    try {
      const result = await logRequest({
        variables: {
          input: {
            userId: userId || 'unknown-user', // Use actual user ID from localStorage
            userRole: 'admin',
            organizationId: orgId, // Use actual orgId from route params
            extensionPoint: 'RA1',
          },
        },
      });

      if (result.data?.plugin_map_logPluginMapRequest) {
        message.success(
          `Request ${result.data.plugin_map_logPluginMapRequest.pollNumber} logged successfully from RA1`,
        );
        // Trigger refetch to update the history
        setRefetchTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error logging request:', error);
      message.error('Failed to log request');
    }
  };

  // Table columns for request history
  const columns = [
    {
      title: 'Request #',
      dataIndex: 'pollNumber',
      key: 'pollNumber',
      width: 100,
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'User Role',
      dataIndex: 'userRole',
      key: 'userRole',
      width: 100,
      render: (userRole: string) => (
        <Tag color={userRole === 'admin' ? 'red' : 'blue'}>{userRole}</Tag>
      ),
    },
    {
      title: 'Extension Point',
      dataIndex: 'extensionPoint',
      key: 'extensionPoint',
      width: 120,
      render: (extensionPoint: string) => (
        <Tag color="green">{extensionPoint}</Tag>
      ),
    },
    {
      title: 'Organization',
      dataIndex: 'organizationId',
      key: 'organizationId',
      width: 150,
      render: (orgId: string | null) => <span>{orgId || 'Global'}</span>,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => (
        <span>{new Date(createdAt).toLocaleString()}</span>
      ),
    },
  ];

  const requests =
    requestsData?.plugin_map_getPluginMapRequests?.requests || [];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>RA1 - Admin Organization Extension Point</Title>
      <Paragraph>
        This page represents the RA1 extension point - Admin Organization Route.
        This is an admin organization route that provides admin functionality
        within a specific organization.
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
                Request RA1 (Admin Organization)
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="Request History (RA1 - Admin Organization)"
            style={{ marginBottom: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                Recent requests logged for this extension point. Total requests:{' '}
                {requestsData?.plugin_map_getPluginMapRequests?.totalCount || 0}
              </Paragraph>

              <Table
                columns={columns}
                dataSource={requests}
                loading={loadingRequests}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} requests`,
                }}
                scroll={{ x: 800 }}
                size="small"
              />
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
                <strong>Name:</strong> Admin Organization Route
              </Paragraph>
              <Paragraph>
                <strong>Description:</strong> Admin's organization-specific view
                and management features
              </Paragraph>
              <Paragraph>
                <strong>Context:</strong> Organization ({orgId})
              </Paragraph>
              <Paragraph>
                <strong>User Role:</strong> Admin
              </Paragraph>
              <Paragraph>
                <strong>Features:</strong>
              </Paragraph>
              <ul>
                <li>Organization admin dashboard</li>
                <li>Organization management</li>
                <li>Organization settings</li>
                <li>Organization admin preferences</li>
                <li>Organization-specific features</li>
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
                  <strong>Organization:</strong> {orgId}
                </Paragraph>
              </Col>
            </Row>
            <Paragraph>
              <strong>Note:</strong> This extension point is accessible from any
              admin organization context.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExtensionPointsOrganization;
