/**
 * Extension Points Dashboard Component for Plugin Map
 *
 * This component displays all available extension points in the Talawa Admin Panel
 * from a global admin perspective, helping developers understand the full ecosystem.
 */

import React, { useEffect, useState } from "react";
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
} from "antd";
import { useMutation, useQuery } from "@apollo/client";
import { gql } from "graphql-tag";
import useLocalStorage from "utils/useLocalstorage";

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

const ExtensionPointsDashboard: React.FC = () => {
  const [logRequest] = useMutation(LOG_PLUGIN_MAP_REQUEST);
  const { getItem } = useLocalStorage();
  const userId = getItem("id") as string | null;
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Query to fetch requests for this extension point
  const {
    data: requestsData,
    loading: loadingRequests,
    refetch,
  } = useQuery(GET_PLUGIN_MAP_REQUESTS, {
    variables: {
      input: {
        extensionPoint: "RA2",
        userRole: "admin",
        organizationId: null, // Global routes have no organization
        userId: userId || "unknown-user", // Filter by current user ID
      },
    },
    fetchPolicy: "network-only",
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
            userId: userId || "unknown-user", // Use actual user ID from localStorage
            userRole: "admin",
            organizationId: null, // Global routes have no organization
            extensionPoint: "RA2",
          },
        },
      });

      if (result.data?.plugin_map_logPluginMapRequest) {
        message.success(
          `Request ${result.data.plugin_map_logPluginMapRequest.pollNumber} logged successfully from RA2`,
        );
        // Trigger refetch to update the history
        setRefetchTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error logging request:", error);
      message.error("Failed to log request");
    }
  };

  // Table columns for request history
  const columns = [
    {
      title: "Request #",
      dataIndex: "pollNumber",
      key: "pollNumber",
      width: 100,
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      width: 150,
      ellipsis: true,
    },
    {
      title: "User Role",
      dataIndex: "userRole",
      key: "userRole",
      width: 100,
      render: (userRole: string) => (
        <Tag color={userRole === "admin" ? "red" : "blue"}>{userRole}</Tag>
      ),
    },
    {
      title: "Extension Point",
      dataIndex: "extensionPoint",
      key: "extensionPoint",
      width: 120,
      render: (extensionPoint: string) => (
        <Tag color="green">{extensionPoint}</Tag>
      ),
    },
    {
      title: "Organization",
      dataIndex: "organizationId",
      key: "organizationId",
      width: 150,
      render: (orgId: string | null) => <span>{orgId || "Global"}</span>,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt: string) => (
        <span>{new Date(createdAt).toLocaleString()}</span>
      ),
    },
  ];

  const requests =
    requestsData?.plugin_map_getPluginMapRequests?.requests || [];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>RA2 - Admin Global Extension Point</Title>
      <Paragraph>
        This page represents the RA2 extension point - Admin Global Route. This
        is a global admin route that provides admin functionality across all
        organizations.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Test Request System" style={{ marginBottom: "16px" }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Paragraph>
                Click the button below to test the request system for RA2
                extension point.
              </Paragraph>

              <Button type="primary" onClick={handlePollClick}>
                Request RA2 (Admin Global)
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="Request History (RA2 - Admin Global)"
            style={{ marginBottom: "16px" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Paragraph>
                Recent requests logged for this extension point. Total requests:{" "}
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
          <Card title="Extension Point Information">
            <Row gutter={[24, 16]}>
              <Col span={6}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px",
                    background: "#f8f9fa",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    Extension ID
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                    RA2
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px",
                    background: "#f8f9fa",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    Type
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                    Global Route
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px",
                    background: "#f8f9fa",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    Access Level
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                    Admin Only
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px",
                    background: "#f8f9fa",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    Organization
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                    None (Global)
                  </div>
                </div>
              </Col>
            </Row>
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                background: "#f0f8ff",
                borderRadius: "6px",
                border: "1px solid #d6e4ff",
              }}
            >
              <strong>Note:</strong> This extension point provides system-wide
              administrative capabilities. Plugins can access global data and
              manage cross-organization features. No organization context is
              required.
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExtensionPointsDashboard;
