/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Switch,
  Button,
  Space,
  Row,
  Col,
  InputNumber,
  Typography,
  Divider
} from 'antd';
import { toast } from '../../services/toastService';
import {
  EnvironmentOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import roomService from '../../services/roomService';

const {Text } = Typography;

const RoomFormModal = ({ visible, onClose, onSuccess, room }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasSubRooms, setHasSubRooms] = useState(false);

  useEffect(() => {
    if (visible) {
      if (room) {
        // Chế độ chỉnh sửa
        form.setFieldsValue({
          name: room.name,
          hasSubRooms: room.hasSubRooms,
          subRoomCount: room.subRooms?.length || 1,
          maxDoctors: room.maxDoctors || 1,
          maxNurses: room.maxNurses || 1,
          isActive: room.isActive
        });
        setHasSubRooms(room.hasSubRooms);
      } else {
        // Chế độ tạo mới
        form.resetFields();
        setHasSubRooms(false);
      }
    }
  }, [visible, room, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (room) {
        const updateData = {
          name: values.name,
          isActive: values.isActive
        };

        if (!room.hasSubRooms) {
          updateData.maxDoctors = values.maxDoctors;
          updateData.maxNurses = values.maxNurses;
        }

        await roomService.updateRoom(room._id, updateData);
        toast.success('Cập nhật phòng khám thành công');
      } else {
        const roomData = {
          name: values.name,
          hasSubRooms: values.hasSubRooms,
          isActive: values.isActive
        };

        if (values.hasSubRooms) {
          roomData.subRoomCount = values.subRoomCount;
        } else {
          roomData.maxDoctors = values.maxDoctors;
          roomData.maxNurses = values.maxNurses;
        }

        await roomService.createRoom(roomData);
        toast.success('Tạo phòng khám thành công');
      }

      onSuccess();
    } catch (error) {
      toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <EnvironmentOutlined />
          {room ? 'Chỉnh sửa phòng khám' : 'Tạo phòng khám mới'}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          hasSubRooms: false,
          subRoomCount: 1,
          maxDoctors: 1,
          maxNurses: 1,
          isActive: true
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label="Tên phòng khám"
              rules={[
                { required: true, message: 'Vui lòng nhập tên phòng khám' },
                { min: 2, message: 'Tên phòng khám phải có ít nhất 2 ký tự' }
              ]}
            >
              <Input
                placeholder="Nhập tên phòng khám"
                prefix={<EnvironmentOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="hasSubRooms"
              label="Loại phòng"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Có buồng con"
                unCheckedChildren="Phòng đơn"
                onChange={setHasSubRooms}
                disabled={!!room} // Không thể thay đổi loại phòng khi edit
              />
            </Form.Item>
            {room && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Không thể thay đổi loại phòng sau khi tạo
              </Text>
            )}
          </Col>
          <Col span={12}>
            <Form.Item
              name="isActive"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Hoạt động"
                unCheckedChildren="Không hoạt động"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {hasSubRooms ? (
          room ? (
            // Khi edit phòng có subrooms - chỉ hiển thị thông tin
            <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
              <Text type="secondary">
                <HomeOutlined style={{ marginRight: 8 }} />
                Phòng này hiện có <strong>{room.subRooms?.length || 0}</strong> buồng con.
                Để thêm/xóa buồng, vui lòng sử dụng trang quản lý chi tiết.
              </Text>
            </div>
          ) : (
            // Khi tạo mới phòng có subrooms
            <Form.Item
              name="subRoomCount"
              label="Số lượng buồng ban đầu"
              rules={[
                { required: true, message: 'Vui lòng nhập số lượng buồng' },
                { type: 'number', min: 1, message: 'Số lượng buồng phải lớn hơn 0' }
              ]}
            >
              <InputNumber
                min={1}
                max={20}
                style={{ width: '100%' }}
                placeholder="Nhập số lượng buồng"
              />
            </Form.Item>
          )
        ) : (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maxDoctors"
                label="Số bác sĩ tối đa"
                rules={[
                  { required: true, message: 'Vui lòng nhập số bác sĩ tối đa' },
                  { type: 'number', min: 1, message: 'Số bác sĩ phải lớn hơn 0' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={10}
                  style={{ width: '100%' }}
                  placeholder="Nhập số bác sĩ"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxNurses"
                label="Số y tá tối đa"
                rules={[
                  { required: true, message: 'Vui lòng nhập số y tá tối đa' },
                  { type: 'number', min: 1, message: 'Số y tá phải lớn hơn 0' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={10}
                  style={{ width: '100%' }}
                  placeholder="Nhập số y tá"
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Divider />

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {room ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoomFormModal;
