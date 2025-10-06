/**
 * User Transactions Page for Razorpay Plugin
 *
 * This component provides a global view of all user transactions across all organizations
 * processed through Razorpay. It allows users to see their complete transaction history
 * in one place, regardless of which organization the transactions were made to.
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
  Input,
  Select,
  DatePicker,
  Row,
  Col,
} from "antd";
import {
  CreditCardOutlined,
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

interface RazorpayTransaction {
  id: string;
  amount: number;
  currency: string;
  status: "captured" | "authorized" | "failed" | "refunded";
  description: string;
  createdAt: string;
  organizationName: string;
  organizationId: string;
  paymentMethod: string;
  category: "donation" | "event" | "membership" | "other";
}

const UserTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<RazorpayTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    RazorpayTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );

  useEffect(() => {
    // Simulate loading all user transactions across organizations
    const mockTransactions: RazorpayTransaction[] = [
      {
        id: "txn_123456789",
        amount: 1000,
        currency: "INR",
        status: "captured",
        description: "Donation to Organization A",
        createdAt: "2024-01-15T10:30:00Z",
        organizationName: "Organization A",
        organizationId: "org_a",
        paymentMethod: "Card",
        category: "donation",
      },
      {
        id: "txn_987654321",
        amount: 500,
        currency: "INR",
        status: "captured",
        description: "Event Registration Fee",
        createdAt: "2024-01-14T15:45:00Z",
        organizationName: "Organization B",
        organizationId: "org_b",
        paymentMethod: "UPI",
        category: "event",
      },
      {
        id: "txn_456789123",
        amount: 2000,
        currency: "INR",
        status: "refunded",
        description: "Donation to Organization C",
        createdAt: "2024-01-13T09:20:00Z",
        organizationName: "Organization C",
        organizationId: "org_c",
        paymentMethod: "Net Banking",
        category: "donation",
      },
      {
        id: "txn_789123456",
        amount: 750,
        currency: "INR",
        status: "captured",
        description: "Membership Fee",
        createdAt: "2024-01-12T14:15:00Z",
        organizationName: "Organization A",
        organizationId: "org_a",
        paymentMethod: "Card",
        category: "membership",
      },
      {
        id: "txn_321654987",
        amount: 1500,
        currency: "INR",
        status: "captured",
        description: "Workshop Registration",
        createdAt: "2024-01-11T11:20:00Z",
        organizationName: "Organization D",
        organizationId: "org_d",
        paymentMethod: "UPI",
        category: "event",
      },
      {
        id: "txn_654987321",
        amount: 300,
        currency: "INR",
        status: "failed",
        description: "Donation to Organization E",
        createdAt: "2024-01-10T16:30:00Z",
        organizationName: "Organization E",
        organizationId: "org_e",
        paymentMethod: "Card",
        category: "donation",
      },
    ];

    setTimeout(() => {
      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = transactions;

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          transaction.organizationName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          transaction.id.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === statusFilter,
      );
    }

    // Organization filter
    if (organizationFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.organizationId === organizationFilter,
      );
    }

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((transaction) => {
        const transactionDate = dayjs(transaction.createdAt);
        return (
          transactionDate.isAfter(dateRange[0]) &&
          transactionDate.isBefore(dateRange[1])
        );
      });
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchText, statusFilter, organizationFilter, dateRange]);

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "donation":
        return "blue";
      case "event":
        return "green";
      case "membership":
        return "purple";
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

  const handleViewDetails = (transaction: RazorpayTransaction) => {
    message.info(`Viewing details for transaction: ${transaction.id}`);
  };

  const handleDownloadReceipt = (transaction: RazorpayTransaction) => {
    message.success(`Downloading receipt for transaction: ${transaction.id}`);
  };

  const getUniqueOrganizations = () => {
    const orgs = transactions.map((t) => ({
      id: t.organizationId,
      name: t.organizationName,
    }));
    return orgs.filter(
      (org, index, self) => index === self.findIndex((o) => o.id === org.id),
    );
  };

  const columns: ColumnsType<RazorpayTransaction> = [
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
      render: (amount: number, record: RazorpayTransaction) => (
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
      render: (name: string, record: RazorpayTransaction) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <Tag color={getCategoryColor(record.category)}>{record.category}</Tag>
        </div>
      ),
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
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: RazorpayTransaction) => (
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
            <Text>Loading your transaction history...</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: "16px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Space align="center">
            <CreditCardOutlined
              style={{ fontSize: "24px", color: "#1890ff" }}
            />
            <Title level={3} style={{ margin: 0 }}>
              My Razorpay Transactions
            </Title>
          </Space>
          <Text type="secondary" style={{ display: "block", marginTop: "4px" }}>
            View all your payment transactions across all organizations
          </Text>
        </div>

        {/* Filters */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="Search transactions..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
              allowClear
            >
              <Select.Option value="all">All Statuses</Select.Option>
              <Select.Option value="captured">Captured</Select.Option>
              <Select.Option value="authorized">Authorized</Select.Option>
              <Select.Option value="failed">Failed</Select.Option>
              <Select.Option value="refunded">Refunded</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by organization"
              value={organizationFilter}
              onChange={setOrganizationFilter}
              style={{ width: "100%" }}
              allowClear
            >
              <Select.Option value="all">All Organizations</Select.Option>
              {getUniqueOrganizations().map((org) => (
                <Select.Option key={org.id} value={org.id}>
                  {org.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              value={dateRange}
              onChange={(dates) =>
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
              style={{ width: "100%" }}
              placeholder={["Start Date", "End Date"]}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredTransactions}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} transactions`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default UserTransactions;
