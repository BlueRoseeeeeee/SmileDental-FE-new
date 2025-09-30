/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Tag, Avatar, Row, Col, Statistic } from 'antd';
import { UserOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import SearchBar from './SearchBar.jsx';
import { 
  searchAndFilter, 
  createRoleFilter, 
  createStatusFilter,
  createGenderFilter,
  createDateFilter 
} from '../../utils/searchUtils.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SearchDemo = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  // Mock data
  const mockData = [
    {
      id: 1,
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@example.com',
      phone: '0123456789',
      role: 'admin',
      isActive: true,
      gender: 'male',
      createdAt: '2024-01-15',
      department: 'IT'
    },
    {
      id: 2,
      fullName: 'Trần Thị Bình',
      email: 'binh.tran@example.com',
      phone: '0987654321',
      role: 'dentist',
      isActive: true,
      gender: 'female',
      createdAt: '2024-02-20',
      department: 'Medical'
    },
    {
      id: 3,
      fullName: 'Lê Văn Cường',
      email: 'cuong.le@example.com',
      phone: '0369852147',
      role: 'nurse',
      isActive: false,
      gender: 'male',
      createdAt: '2024-03-10',
      department: 'Medical'
    },
    {
      id: 4,
      fullName: 'Phạm Thị Dung',
      email: 'dung.pham@example.com',
      phone: '0741258963',
      role: 'receptionist',
      isActive: true,
      gender: 'female',
      createdAt: '2024-01-25',
      department: 'Reception'
    },
    {
      id: 5,
      fullName: 'Hoàng Văn Em',
      email: 'em.hoang@example.com',
      phone: '0852147369',
      role: 'manager',
      isActive: true,
      gender: 'male',
      createdAt: '2024-02-05',
      department: 'Management'
    }
  ];

  useEffect(() => {
    setData(mockData);
    setFilteredData(mockData);
  }, []);

  useEffect(() => {
    const searchFields = ['fullName', 'email', 'phone', 'department'];
    const filtered = searchAndFilter(data, searchTerm, searchFields, filters);
    setFilteredData(filtered);
  }, [searchTerm, filters, data]);

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const getRoleTag = (role) => {
    const roleConfig = {
      admin: { color: 'red', text: 'Quản trị viên' },
      manager: { color: 'orange', text: 'Quản lý' },
      dentist: { color: 'blue', text: 'Nha sĩ' },
      nurse: { color: 'green', text: 'Y tá' },
      receptionist: { color: 'purple', text: 'Lễ tân' },
      patient: { color: 'default', text: 'Bệnh nhân' }
    };
    
    const config = roleConfig[role] || { color: 'default', text: role };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (isActive) => {
    return isActive ? (
      <Tag color="green">Hoạt động</Tag>
    ) : (
      <Tag color="red">Không hoạt động</Tag>
    );
  };

  const getGenderTag = (gender) => {
    const genderConfig = {
      male: { color: 'blue', text: 'Nam' },
      female: { color: 'pink', text: 'Nữ' },
      other: { color: 'default', text: 'Khác' }
    };
    
    const config = genderConfig[gender] || { color: 'default', text: gender };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 60,
      render: () => (
        <Avatar 
          icon={<UserOutlined />}
          size="small"
        />
      )
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <Text copyable={{ text }}>{text}</Text>
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => <Text copyable={{ text }}>{text}</Text>
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role)
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender) => getGenderTag(gender)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => getStatusTag(isActive)
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      render: (text) => <Text>{text}</Text>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Demo Search Component
        </Title>
        <Text type="secondary">
          Ví dụ về cách sử dụng SearchBar component với các filter khác nhau
        </Text>
      </div>

      {/* Search and Filter */}
      <SearchBar
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        placeholder="Tìm kiếm theo tên, email, số điện thoại, phòng ban..."
        filters={[
          createRoleFilter(),
          createStatusFilter(),
          createGenderFilter(),
          createDateFilter()
        ]}
        searchValue={searchTerm}
        filterValues={filters}
        loading={loading}
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng số bản ghi"
              value={data.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Kết quả tìm kiếm"
              value={filteredData.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tỷ lệ lọc"
              value={data.length > 0 ? Math.round((filteredData.length / data.length) * 100) : 0}
              suffix="%"
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Results Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} bản ghi`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Usage Examples */}
      <Card title="Cách sử dụng SearchBar" style={{ marginTop: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>1. Import component và utilities:</Title>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
{`import SearchBar from '../Common/SearchBar.jsx';
import { 
  searchAndFilter, 
  createRoleFilter, 
  createStatusFilter 
} from '../../utils/searchUtils.js';`}
            </pre>
          </div>

          <div>
            <Title level={4}>2. Sử dụng trong component:</Title>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
{`const [searchTerm, setSearchTerm] = useState('');
const [filters, setFilters] = useState({});
const [filteredData, setFilteredData] = useState([]);

const handleSearch = (value) => {
  setSearchTerm(value);
};

const handleFilterChange = (newFilters) => {
  setFilters(newFilters);
};

// Apply search and filter
useEffect(() => {
  const searchFields = ['fullName', 'email', 'phone'];
  const filtered = searchAndFilter(data, searchTerm, searchFields, filters);
  setFilteredData(filtered);
}, [searchTerm, filters, data]);`}
            </pre>
          </div>

          <div>
            <Title level={4}>3. Render SearchBar:</Title>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
{`<SearchBar
  onSearch={handleSearch}
  onFilterChange={handleFilterChange}
  placeholder="Tìm kiếm theo tên, email..."
  filters={[
    createRoleFilter(),
    createStatusFilter()
  ]}
  searchValue={searchTerm}
  filterValues={filters}
  loading={loading}
/>`}
            </pre>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default SearchDemo;
