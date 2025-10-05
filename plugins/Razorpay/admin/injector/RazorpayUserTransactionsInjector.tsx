/**
 * Razorpay User Transactions Injector (G1)
 *
 * This component is specifically designed for the G1 extension point to display
 * Razorpay payment provider transactions for users in their transaction history.
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Spin,
} from "antd";
import {
  CreditCardOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface RazorpayUserTransaction {
  id: string;
  amount: number;
  currency: string;
  status: "captured" | "authorized" | "failed" | "refunded";
  description: string;
  createdAt: string;
  organizationName: string;
  paymentMethod: string;
}

const RazorpayUserTransactionsInjector: React.FC = () => {
  const [transactions, setTransactions] = useState<RazorpayUserTransaction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading Razorpay user transactions
    // In a real implementation, this would fetch from the API
    const mockTransactions: RazorpayUserTransaction[] = [
      {
        id: "txn_123456789",
        amount: 1000,
        currency: "INR",
        status: "captured",
        description: "Donation to Organization A",
        createdAt: "2024-01-15T10:30:00Z",
        organizationName: "Organization A",
        paymentMethod: "Card",
      },
      {
        id: "txn_987654321",
        amount: 500,
        currency: "INR",
        status: "captured",
        description: "Event Registration Fee",
        createdAt: "2024-01-14T15:45:00Z",
        organizationName: "Organization B",
        paymentMethod: "UPI",
      },
      {
        id: "txn_456789123",
        amount: 2000,
        currency: "INR",
        status: "refunded",
        description: "Donation to Organization C",
        createdAt: "2024-01-13T09:20:00Z",
        organizationName: "Organization C",
        paymentMethod: "Net Banking",
      },
      {
        id: "txn_789123456",
        amount: 750,
        currency: "INR",
        status: "captured",
        description: "Membership Fee",
        createdAt: "2024-01-12T14:15:00Z",
        organizationName: "Organization A",
        paymentMethod: "Card",
      },
    ];

    setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "captured":
        return "success";
      case "authorized":
        return "processing";
      case "failed":
        return "error";
      case "refunded":
        return "warning";
      default:
        return "default";
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetails = (transaction: RazorpayUserTransaction) => {
    message.info(`Viewing details for transaction: ${transaction.id}`);
    // In a real implementation, this would open a modal or navigate to details
  };

  const handleDownloadReceipt = (transaction: RazorpayUserTransaction) => {
    message.success(`Downloading receipt for transaction: ${transaction.id}`);
    // In a real implementation, this would download the receipt
  };

  const columns: ColumnsType<RazorpayUserTransaction> = [
    {
      title: "Transaction ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <Text code style={{ fontSize: "12px" }}>
          {id}
        </Text>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record: RazorpayUserTransaction) => (
        <Text strong>{formatAmount(amount, record.currency)}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Organization",
      dataIndex: "organizationName",
      key: "organizationName",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => formatDate(date),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: RazorpayUserTransaction) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadReceipt(record)}
            size="small"
          >
            Receipt
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px" }}>
            <Text>Loading Razorpay transactions...</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ marginBottom: "16px" }}>
        <Space align="center">
          <CreditCardOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
          <Title level={4} style={{ margin: 0 }}>
            Razorpay Transactions
          </Title>
        </Space>
        <Text type="secondary" style={{ display: "block", marginTop: "4px" }}>
          Your payment transactions processed through Razorpay
        </Text>
      </div>

      <Table
        columns={columns}
        dataSource={transactions}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} transactions`,
        }}
        scroll={{ x: 800 }}
      />
    </Card>
  );
};

export default RazorpayUserTransactionsInjector;
