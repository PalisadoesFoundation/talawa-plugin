/**
 * Extension Points Global Component for Plugin Map
 *
 * This component displays all available extension points in the Talawa Admin Panel
 * from a global user perspective, helping developers understand the full ecosystem.
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

const ExtensionPointsGlobal: React.FC = () => {
  const [logRequest] = useMutation(LOG_PLUGIN_MAP_REQUEST);
  const { getItem } = useLocalStorage();
  const userId = getItem('id') as string | null;
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Query to fetch requests for this extension point
  const {
    data: requestsData,
    loading: loadingRequests,
    refetch,
  } = useQuery(GET_PLUGIN_MAP_REQUESTS, {
    variables: {
      input: {
        extensionPoint: 'RU2',
        userRole: 'user',
        organizationId: null, // Global routes have no organization
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
          <Card
            title="Request History (RU2 - User Global)"
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
