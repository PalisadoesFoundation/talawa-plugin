/**
 * Extension Points User Component for Plugin Map
 * 
 * This component displays user-specific extension points in the user panel
 */

import React from 'react';
import { Card, Row, Col, Badge, Typography, Space, Divider, Alert } from 'antd';
import { 
  UserOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const ExtensionPointsUser: React.FC = () => {
  const userExtensionPoints = [
    {
      id: 'RU1',
      name: 'User Route Extension 1',
      description: 'Organization-specific user route extension point',
      type: 'route',
      context: 'user',
      icon: <UserOutlined />,
      examples: ['User dashboard', 'Profile management', 'Organization activities']
    },
    {
      id: 'DU1',
      name: 'User Drawer Extension 1',
      description: 'Organization-specific user drawer menu extension point',
      type: 'drawer',
      context: 'user',
      icon: <FolderOutlined />,
      examples: ['User navigation', 'Organization features', 'User tools']
    }
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
          <UserOutlined style={{ marginRight: '12px' }} />
          User Extension Points
        </Title>
        <Paragraph>
          This page shows user-specific extension points available in the user panel.
          These extension points are contextual to the current user and organization.
        </Paragraph>
        
        <Alert
          message="User Context"
          description="These extension points are specifically designed for user-level functionality and will have access to the current user's context within the organization."
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginTop: '16px' }}
        />
      </div>

      <Row gutter={[16, 16]}>
        {userExtensionPoints.map((point) => (
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
                  <Badge color="purple" text={point.context} />
                </Space>
              }
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{point.name}</Text>
                <Paragraph style={{ fontSize: '14px', marginBottom: '12px' }}>
                  {point.description}
                </Paragraph>
                
                {point.examples && point.examples.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text strong style={{ fontSize: '12px' }}>Examples:</Text>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      {point.examples.map((example, index) => (
                        <li key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
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

export default ExtensionPointsUser; 