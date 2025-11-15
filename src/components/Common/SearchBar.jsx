/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { Input, Select, Row, Col, Card } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

const SearchBar = ({
  onSearch,
  onFilterChange,
  placeholder = "Tìm kiếm...",
  filters = [],
  searchValue = '',
  filterValues = {},
  loading = false,
  style = {},
  cardStyle = {},
  size = 'large'
}) => {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const [localFilterValues, setLocalFilterValues] = useState(filterValues);

  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  useEffect(() => {
    setLocalFilterValues(filterValues);
  }, [filterValues]);

  const handleSearch = (value) => {
    setLocalSearchValue(value);
    onSearch?.(value);
  };

  const handleFilterChange = (key, value) => {
    const newFilterValues = { ...localFilterValues, [key]: value };
    setLocalFilterValues(newFilterValues);
    onFilterChange?.(newFilterValues);
  };

  const handleClear = () => {
    setLocalSearchValue('');
    setLocalFilterValues({});
    onSearch?.('');
    onFilterChange?.({});
  };

  return (
    <Card 
      style={{ 
        marginBottom: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        ...cardStyle
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Row gutter={[20, 16]} align="middle">
        {/* Search Input */}
        <Col xs={24} sm={12} lg={12}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: '4px',
              fontWeight: '500',
              height: '16px',
              display: 'flex',
              alignItems: 'center'
            }}>
              Tìm kiếm
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <Input
                placeholder={placeholder}
                prefix={<SearchOutlined />}
                value={localSearchValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalSearchValue(value);
                  if (value === '') {
                    handleSearch('');
                  }
                }}
                onPressEnter={(e) => handleSearch(e.target.value)}
                onClear={handleClear}
                allowClear
                style={{ 
                  width: '100%',
                  ...style
                }}
              />
            </div>
          </div>
        </Col>
        
        {/* Dynamic Filters */}
        {filters.map((filter, index) => (
          <Col xs={12} sm={6} lg={6} key={filter.key || index}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '4px',
                fontWeight: '500',
                height: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {filter.label}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Select
                  mode={filter.multiple ? "multiple" : undefined}
                  style={{ width: '100%' }}
                  value={localFilterValues[filter.key]}
                  onChange={(value) => handleFilterChange(filter.key, value)}
                  allowClear
                  placeholder={filter.placeholder}
                  maxTagCount={filter.multiple ? 'responsive' : undefined}
                  onClear={() => {
                    const newFilterValues = { ...localFilterValues };
                    delete newFilterValues[filter.key];
                    setLocalFilterValues(newFilterValues);
                    onFilterChange?.(newFilterValues);
                  }}
                >
                  {filter.options?.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          </Col>
        ))}
        
      </Row>
    </Card>
  );
};

export default SearchBar;
