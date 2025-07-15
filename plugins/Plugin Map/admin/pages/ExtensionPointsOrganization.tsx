/**
 * Extension Points Organization Component for Plugin Map
 *
 * This component displays organization-specific extension points in the admin panel
 */

import React from 'react';
import { Card, Row, Col, Badge, Typography, Space, Divider, Alert } from 'antd';
import {
  TeamOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const ExtensionPointsOrganization: React.FC = () => {
  const organizationExtensionPoints = [
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
      id: 'DA2',
      name: 'Admin Drawer Extension 2',
      description: 'Organization-specific admin drawer menu extension point',
      type: 'drawer',
      context: 'admin',
      icon: <FolderOutlined />,
      examples: ['Organization tools', 'Member management', 'Event tools'],
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'route':
        return 'blue';
      case 'drawer':
        return 'green';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={1}>
          <TeamOutlined style={{ marginRight: '12px' }} />
          Organization Extension Points
        </Title>
        <Paragraph>
          This page shows organization-specific extension points available in
          the admin panel. These extension points are contextual to the current
          organization.
        </Paragraph>

        <Alert
          message="Organization Context"
          description="These extension points are specifically designed for organization-level functionality and will have access to the current organization's context."
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginTop: '16px' }}
        />
      </div>

      <Row gutter={[16, 16]}>
        {organizationExtensionPoints.map((point) => (
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
                  <Badge color="red" text={point.context} />
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
    </div>
  );
};

export default ExtensionPointsOrganization;
