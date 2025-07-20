/**
 * Extension Points Dashboard Component for Plugin Map
 *
 * This component displays all available extension points in the Talawa Admin Panel
 * for developers to understand where they can inject their own components.
 */

import React from 'react';
import { Card, Row, Col, Badge, Typography, Space, Divider } from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  CodeOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  FolderOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface ExtensionPoint {
  id: string;
  name: string;
  description: string;
  type: 'route' | 'drawer' | 'injector';
  context: 'admin' | 'user' | 'global';
  icon: React.ReactNode;
  examples?: string[];
}

const ExtensionPointsDashboard: React.FC = () => {
  const extensionPoints: ExtensionPoint[] = [
    {
      id: 'RA1',
      name: 'Admin Route Extension 1',
      description:
        'Global admin route extension point for dashboard-level functionality',
      type: 'route',
      context: 'admin',
      icon: <DashboardOutlined />,
      examples: ['Dashboard widgets', 'Global analytics', 'System monitoring'],
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
    },
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
    },
    {
      id: 'DA2',
      name: 'Admin Drawer Extension 2',
      description: 'Organization-specific admin drawer menu extension point',
      type: 'drawer',
      context: 'admin',
      icon: <FolderOutlined />,
      examples: ['Organization tools', 'Member management', 'Event tools'],
    },
    {
      id: 'DU1',
      name: 'User Drawer Extension 1',
      description: 'Organization-specific user drawer menu extension point',
      type: 'drawer',
      context: 'user',
      icon: <FolderOutlined />,
      examples: ['User navigation', 'Organization features', 'User tools'],
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
    },
    {
      id: 'G1',
      name: 'General Injector Extension 1',
      description: 'Component injection point for general UI elements',
      type: 'injector',
      context: 'global',
      icon: <CodeOutlined />,
      examples: ['Button injections', 'Card enhancements', 'Form extensions'],
    },
    {
      id: 'G2',
      name: 'General Injector Extension 2',
      description: 'Component injection point for secondary UI elements',
      type: 'injector',
      context: 'global',
      icon: <CodeOutlined />,
      examples: ['Widget injections', 'Modal enhancements', 'List extensions'],
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
    },
    {
      id: 'G4',
      name: 'General Injector Extension 4',
      description: 'Component injection point for quaternary UI elements',
      type: 'injector',
      context: 'global',
      icon: <CodeOutlined />,
      examples: ['Header injections', 'Menu enhancements', 'Status extensions'],
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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={1}>
          <AppstoreOutlined style={{ marginRight: '12px' }} />
          Extension Points Map
        </Title>
        <Paragraph>
          This dashboard shows all available extension points in the Talawa
          Admin Panel. Developers can use these extension points to inject their
          own components and functionality.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {extensionPoints.map((point) => (
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
              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                <Text strong>{point.name}</Text>
                <Paragraph style={{ fontSize: '14px', marginBottom: '12px' }}>
                  {point.description}
                </Paragraph>

                {point.examples && point.examples.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
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
        ))}
      </Row>

      <Divider />

      <Card style={{ marginTop: '24px' }}>
        <Title level={3}>How to Use Extension Points</Title>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <Title level={4}>Routes (R*)</Title>
            <Paragraph>
              Route extension points allow you to add entirely new pages to the
              admin or user interface. Define your component and path in the
              plugin manifest.
            </Paragraph>
          </div>
          <div>
            <Title level={4}>Drawers (D*)</Title>
            <Paragraph>
              Drawer extension points let you add menu items to the navigation
              sidebar. Perfect for adding new sections or tools to the
              interface.
            </Paragraph>
          </div>
          <div>
            <Title level={4}>Injectors (G*)</Title>
            <Paragraph>
              Injector extension points allow you to inject components into
              existing UI elements. Great for adding buttons, widgets, or
              enhancing existing features.
            </Paragraph>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExtensionPointsDashboard;
