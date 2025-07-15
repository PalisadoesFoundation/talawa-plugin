/**
 * Extension Points Global Component for Plugin Map
 *
 * This component displays all available extension points in the Talawa Admin Panel
 * from a global user perspective, helping developers understand the full ecosystem.
 */

import React from 'react';
import {
  Card,
  Row,
  Col,
  Badge,
  Typography,
  Space,
  Divider,
  Tabs,
  Alert,
} from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  CodeOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  FolderOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface ExtensionPoint {
  id: string;
  name: string;
  description: string;
  type: 'route' | 'drawer' | 'injector';
  context: 'admin' | 'user' | 'global';
  icon: React.ReactNode;
  examples?: string[];
  usage?: string;
}

const ExtensionPointsGlobal: React.FC = () => {
  const adminExtensionPoints: ExtensionPoint[] = [
    {
      id: 'RA1',
      name: 'Admin Route Extension 1',
      description:
        'Global admin route extension point for dashboard-level functionality',
      type: 'route',
      context: 'admin',
      icon: <DashboardOutlined />,
      examples: ['Dashboard widgets', 'Global analytics', 'System monitoring'],
      usage: 'Used for adding global admin-level pages and dashboards',
    },
    {
      id: 'RA2',
      name: 'Admin Route Extension 2',
      description: 'Organization-specific admin route extension point',
      type: 'route',
      context: 'admin',
      icon: <TeamOutlined />,
      examples: [
        'Organization settings',
        'Member management',
        'Event management',
      ],
      usage: 'Used for adding organization-specific admin pages',
    },
    {
      id: 'DA1',
      name: 'Admin Drawer Extension 1',
      description: 'Global admin drawer menu extension point',
      type: 'drawer',
      context: 'admin',
      icon: <FolderOutlined />,
      examples: [
        'Navigation menu items',
        'Global admin tools',
        'System utilities',
      ],
      usage: 'Used for adding global admin menu items',
    },
    {
      id: 'DA2',
      name: 'Admin Drawer Extension 2',
      description: 'Organization-specific admin drawer menu extension point',
      type: 'drawer',
      context: 'admin',
      icon: <FolderOutlined />,
      examples: ['Organization tools', 'Member management', 'Event tools'],
      usage: 'Used for adding organization-specific admin menu items',
    },
  ];

  const userExtensionPoints: ExtensionPoint[] = [
    {
      id: 'RU1',
      name: 'User Route Extension 1',
      description: 'Organization-specific user route extension point',
      type: 'route',
      context: 'user',
      icon: <UserOutlined />,
      examples: [
        'User dashboard',
        'Profile management',
        'Organization activities',
      ],
      usage: 'Used for adding organization-specific user pages',
    },
    {
      id: 'RU2',
      name: 'User Route Extension 2',
      description: 'Global user route extension point',
      type: 'route',
      context: 'user',
      icon: <GlobalOutlined />,
      examples: [
        'Global user settings',
        'Cross-organization features',
        'User preferences',
      ],
      usage: 'Used for adding global user-level pages',
    },
    {
      id: 'DU1',
      name: 'User Drawer Extension 1',
      description: 'Organization-specific user drawer menu extension point',
      type: 'drawer',
      context: 'user',
      icon: <FolderOutlined />,
      examples: ['User navigation', 'Organization features', 'User tools'],
      usage: 'Used for adding organization-specific user menu items',
    },
    {
      id: 'DU2',
      name: 'User Drawer Extension 2',
      description: 'Global user drawer menu extension point',
      type: 'drawer',
      context: 'user',
      icon: <FolderOutlined />,
      examples: [
        'Global user navigation',
        'Cross-organization tools',
        'User preferences',
      ],
      usage: 'Used for adding global user menu items',
    },
  ];

  const injectorExtensionPoints: ExtensionPoint[] = [
    {
      id: 'G1',
      name: 'General Injector Extension 1',
      description: 'Component injection point for general UI elements',
      type: 'injector',
      context: 'global',
      icon: <CodeOutlined />,
      examples: ['Button injections', 'Card enhancements', 'Form extensions'],
      usage: 'Used for injecting components into general UI locations',
    },
    {
      id: 'G2',
      name: 'General Injector Extension 2',
      description: 'Component injection point for secondary UI elements',
      type: 'injector',
      context: 'global',
      icon: <CodeOutlined />,
      examples: ['Widget injections', 'Modal enhancements', 'List extensions'],
      usage: 'Used for injecting components into secondary UI locations',
    },
    {
      id: 'G3',
      name: 'General Injector Extension 3',
      description: 'Component injection point for tertiary UI elements',
      type: 'injector',
      context: 'global',
      icon: <CodeOutlined />,
      examples: [
        'Toolbar injections',
        'Sidebar enhancements',
        'Footer extensions',
      ],
      usage: 'Used for injecting components into tertiary UI locations',
    },
    {
      id: 'G4',
      name: 'General Injector Extension 4',
      description: 'Component injection point for quaternary UI elements',
      type: 'injector',
      context: 'global',
      icon: <CodeOutlined />,
      examples: ['Header injections', 'Menu enhancements', 'Status extensions'],
      usage: 'Used for injecting components into quaternary UI locations',
    },
    {
      id: 'G5',
      name: 'General Injector Extension 5',
      description: 'Component injection point for quinary UI elements',
      type: 'injector',
      context: 'global',
      icon: <CodeOutlined />,
      examples: [
        'Notification injections',
        'Badge enhancements',
        'Icon extensions',
      ],
      usage: 'Used for injecting components into quinary UI locations',
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'route':
        return 'blue';
      case 'drawer':
        return 'green';
      case 'injector':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getContextColor = (context: string) => {
    switch (context) {
      case 'admin':
        return 'red';
      case 'user':
        return 'purple';
      case 'global':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const renderExtensionPointCard = (point: ExtensionPoint) => (
    <Col xs={24} sm={12} lg={8} key={point.id}>
      <Card
        hoverable
        style={{ height: '100%' }}
        title={
          <Space>
            {point.icon}
            <Text strong>{point.id}</Text>
          </Space>
        }
        extra={
          <Space>
            <Badge color={getTypeColor(point.type)} text={point.type} />
            <Badge
              color={getContextColor(point.context)}
              text={point.context}
            />
          </Space>
        }
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text strong>{point.name}</Text>
          <Paragraph style={{ fontSize: '14px', marginBottom: '12px' }}>
            {point.description}
          </Paragraph>

          {point.usage && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Text strong style={{ fontSize: '12px' }}>
                Usage:
              </Text>
              <Paragraph style={{ fontSize: '12px', marginBottom: '8px' }}>
                {point.usage}
              </Paragraph>
            </>
          )}

          {point.examples && point.examples.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Text strong style={{ fontSize: '12px' }}>
                Examples:
              </Text>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {point.examples.map((example, index) => (
                  <li
                    key={index}
                    style={{ fontSize: '12px', marginBottom: '2px' }}
                  >
                    {example}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Space>
      </Card>
    </Col>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={1}>
          <GlobalOutlined style={{ marginRight: '12px' }} />
          Global Extension Points Overview
        </Title>
        <Paragraph>
          This page provides a comprehensive view of all extension points
          available in the Talawa ecosystem. Use this as a reference to
          understand the full plugin architecture and extension capabilities.
        </Paragraph>

        <Alert
          message="Extension Points Overview"
          description="This view shows all available extension points across admin and user contexts. Use this to understand the complete plugin ecosystem and plan your extensions accordingly."
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginTop: '16px' }}
        />
      </div>

      <Tabs defaultActiveKey="admin" size="large">
        <TabPane tab="Admin Extension Points" key="admin">
          <Row gutter={[16, 16]}>
            {adminExtensionPoints.map(renderExtensionPointCard)}
          </Row>
        </TabPane>

        <TabPane tab="User Extension Points" key="user">
          <Row gutter={[16, 16]}>
            {userExtensionPoints.map(renderExtensionPointCard)}
          </Row>
        </TabPane>

        <TabPane tab="Injector Extension Points" key="injector">
          <Row gutter={[16, 16]}>
            {injectorExtensionPoints.map(renderExtensionPointCard)}
          </Row>
        </TabPane>

        <TabPane tab="All Extension Points" key="all">
          <Row gutter={[16, 16]}>
            {[
              ...adminExtensionPoints,
              ...userExtensionPoints,
              ...injectorExtensionPoints,
            ].map(renderExtensionPointCard)}
          </Row>
        </TabPane>
      </Tabs>

      <Divider />

      <Card style={{ marginTop: '24px' }}>
        <Title level={3}>Extension Point Categories</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small">
              <Title level={4}>
                <DashboardOutlined style={{ marginRight: '8px' }} />
                Route Extensions
              </Title>
              <Paragraph>
                Route extensions (R*) allow you to add completely new pages to
                the application. These can be admin-specific (RA*) or
                user-specific (RU*).
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Title level={4}>
                <FolderOutlined style={{ marginRight: '8px' }} />
                Drawer Extensions
              </Title>
              <Paragraph>
                Drawer extensions (D*) let you add menu items to the navigation
                sidebar. These can be admin-specific (DA*) or user-specific
                (DU*).
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Title level={4}>
                <CodeOutlined style={{ marginRight: '8px' }} />
                Injector Extensions
              </Title>
              <Paragraph>
                Injector extensions (G*) allow you to inject components into
                existing UI elements. These are context-agnostic and can be used
                throughout the application.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ExtensionPointsGlobal;
