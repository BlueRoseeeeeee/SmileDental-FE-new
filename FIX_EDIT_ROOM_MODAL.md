# 🔧 Sửa Lỗi Edit Room - Không Lấy Đúng Dữ Liệu

## ❌ Vấn Đề Trước Đây

Khi click nút **Edit** ở trang Room List:
- ❌ Modal không fetch dữ liệu mới từ API
- ❌ Chỉ hiển thị dữ liệu cũ từ list (có thể thiếu hoặc lỗi thời)
- ❌ Đối với phòng có subrooms: không hiển thị danh sách buồng đầy đủ
- ❌ Đối với phòng không có subrooms: không hiển thị maxDoctors/maxNurses

## ✅ Đã Sửa

### 1. **Fetch Dữ Liệu Đầy Đủ Khi Mở Modal Edit**

**File:** `RoomFormModal.jsx`

**Thêm state:**
```jsx
const [fullRoomData, setFullRoomData] = useState(null);
const [fetchingRoomData, setFetchingRoomData] = useState(false);
```

**Thêm useEffect để fetch data:**
```jsx
useEffect(() => {
  const fetchRoomData = async () => {
    if (isOpen && room && room._id) {
      setFetchingRoomData(true);
      try {
        // 🆕 Gọi API getRoomById để lấy dữ liệu đầy đủ
        const response = await roomService.getRoomById(room._id);
        const roomData = response.room || response;
        setFullRoomData(roomData);
        
        // Set form values với dữ liệu đầy đủ
        form.setFieldsValue({
          name: roomData.name,
          hasSubRooms: roomData.hasSubRooms,
          subRoomCount: roomData.subRooms?.length || 1,
          maxDoctors: roomData.maxDoctors || 1,
          maxNurses: roomData.maxNurses || 1,
          isActive: roomData.isActive
        });
        setHasSubRooms(roomData.hasSubRooms);
      } catch (error) {
        toast.error('Lỗi khi tải thông tin phòng: ' + error.message);
      } finally {
        setFetchingRoomData(false);
      }
    }
  };

  fetchRoomData();
}, [isOpen, room, form]);
```

**Thay đổi:**
- ✅ Trigger: Dùng `isOpen` thay vì `visible` (vì prop truyền vào là `open`)
- ✅ Fetch API: Gọi `getRoomById` khi modal mở
- ✅ Lưu data: Lưu vào `fullRoomData` state
- ✅ Fallback: Nếu fetch lỗi, vẫn dùng dữ liệu từ prop `room`

---

### 2. **Hiển Thị Dữ Liệu Chính Xác Theo Loại Phòng**

#### **Phòng CÓ SubRooms (hasSubRooms = true):**

```jsx
{hasSubRooms ? (
  room ? (
    // Khi edit phòng có subrooms - Hiển thị danh sách buồng với toggle
    <div>
      <Text strong>
        Danh sách buồng ({fullRoomData?.subRooms?.length || 0} buồng)
      </Text>
      {fetchingRoomData ? (
        <div>Đang tải dữ liệu...</div>
      ) : (
        <List
          dataSource={fullRoomData?.subRooms || room.subRooms || []}
          renderItem={(subRoom) => (
            <List.Item>
              <Text>{subRoom.name}</Text>
              <Tag color={subRoom.isActive ? 'green' : 'red'}>
                {subRoom.isActive ? 'Hoạt động' : 'Tắt'}
              </Tag>
              <Switch
                checked={subRoom.isActive}
                onChange={() => handleSubRoomToggleConfirmation(subRoom)}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  ) : (
    // Tạo mới - Nhập số lượng buồng
    <Form.Item name="subRoomCount" label="Số lượng buồng">
      <InputNumber min={1} max={20} />
    </Form.Item>
  )
)
```

**Hiển thị:**
- ✅ Danh sách đầy đủ các buồng từ `fullRoomData.subRooms`
- ✅ Tên buồng (Buồng 1, Buồng 2, ...)
- ✅ Trạng thái (Hoạt động / Tắt)
- ✅ Switch để toggle trạng thái
- ✅ Tag "Đã sử dụng" nếu buồng đã được dùng

#### **Phòng KHÔNG CÓ SubRooms (hasSubRooms = false):**

```jsx
: (
  // Phòng không có subrooms - Hiển thị maxDoctors/maxNurses
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item name="maxDoctors" label="Số nha sĩ tối đa">
        <InputNumber min={1} max={10} />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item name="maxNurses" label="Số y tá tối đa">
        <InputNumber min={1} max={10} />
      </Form.Item>
    </Col>
  </Row>
)}
```

**Hiển thị:**
- ✅ Input số nha sĩ tối đa (maxDoctors)
- ✅ Input số y tá tối đa (maxNurses)
- ✅ Có thể chỉnh sửa trực tiếp

---

### 3. **Cập Nhật Lại Dữ Liệu Sau Khi Toggle SubRoom**

**Trước:**
```jsx
const handleConfirmSubRoomToggle = async () => {
  await roomService.toggleSubRoomStatus(room._id, subRoomId);
  onSuccess(); // Chỉ refresh parent
};
```

**Sau:**
```jsx
const handleConfirmSubRoomToggle = async () => {
  await roomService.toggleSubRoomStatus(room._id, subRoomId);
  
  // 🆕 Fetch lại dữ liệu phòng để cập nhật subRooms
  const response = await roomService.getRoomById(room._id);
  const roomData = response.room || response;
  setFullRoomData(roomData);
  
  onSuccess(); // Refresh parent
};
```

**Thay đổi:**
- ✅ Fetch lại data sau khi toggle
- ✅ Cập nhật `fullRoomData` để UI hiển thị đúng ngay lập tức
- ✅ Vẫn gọi `onSuccess()` để refresh danh sách phòng ở parent

---

## 🎯 Kết Quả

### **Khi Edit Phòng CÓ SubRooms:**

```
┌─────────────────────────────────────┐
│ ✏️ Chỉnh sửa phòng khám              │
├─────────────────────────────────────┤
│ Tên phòng: Phòng Phẫu Thuật         │
│ Loại phòng: ☑️ Có buồng con         │
│ Trạng thái: ☑️ Hoạt động            │
├─────────────────────────────────────┤
│ 📋 Danh sách buồng (5 buồng)        │
│                                     │
│ • Buồng 1  [Hoạt động] [Switch: ON] │
│ • Buồng 2  [Hoạt động] [Switch: ON] │
│ • Buồng 3  [Tắt]       [Switch: OFF]│
│ • Buồng 4  [Hoạt động] [Switch: ON] │
│ • Buồng 5  [Hoạt động] [Switch: ON] │
│                                     │
│ ℹ️ Để thêm/xóa buồng, vui lòng sử   │
│   dụng trang quản lý chi tiết.      │
└─────────────────────────────────────┘
```

### **Khi Edit Phòng KHÔNG CÓ SubRooms:**

```
┌─────────────────────────────────────┐
│ ✏️ Chỉnh sửa phòng khám              │
├─────────────────────────────────────┤
│ Tên phòng: Phòng Khám Tổng Quát     │
│ Loại phòng: ☐ Phòng đơn             │
│ Trạng thái: ☑️ Hoạt động            │
├─────────────────────────────────────┤
│ 👨‍⚕️ Số nha sĩ tối đa:  [   2   ]  │
│ 👩‍⚕️ Số y tá tối đa:    [   3   ]  │
└─────────────────────────────────────┘
```

---

## 📊 So Sánh Trước/Sau

| Tính năng | Trước ❌ | Sau ✅ |
|-----------|---------|--------|
| **Fetch data khi edit** | Không, dùng data cũ từ list | Có, gọi API getRoomById |
| **Hiển thị subRooms** | Thiếu hoặc sai | Đầy đủ, chính xác |
| **Hiển thị maxDoctors/maxNurses** | Không hiển thị | Hiển thị đầy đủ |
| **Toggle subRoom status** | Không cập nhật UI ngay | Cập nhật ngay lập tức |
| **Loading state** | Không có | Có "Đang tải dữ liệu..." |
| **Phân biệt loại phòng** | Không rõ ràng | Rõ ràng (có/không subrooms) |

---

## ✅ Testing Checklist

- [ ] Click Edit phòng có subrooms → Hiển thị danh sách buồng đầy đủ
- [ ] Click Edit phòng không có subrooms → Hiển thị maxDoctors/maxNurses
- [ ] Toggle trạng thái buồng → UI cập nhật ngay
- [ ] Kiểm tra loading state khi fetch data
- [ ] Kiểm tra fallback nếu API lỗi
- [ ] Edit phòng rồi save → Dữ liệu cập nhật đúng

---

## 🚀 Cách Test

1. Vào trang **Room List** (`/rooms`)
2. Click nút **Edit** ở một phòng
3. **Kiểm tra:**
   - Nếu phòng có buồng con: Xem danh sách buồng có đầy đủ không
   - Nếu phòng đơn: Xem maxDoctors/maxNurses có hiển thị không
   - Toggle trạng thái buồng → Xem UI có cập nhật ngay không

---

## 📝 Files Đã Sửa

- ✅ `src/components/Room/RoomFormModal.jsx`
  - Thêm state `fullRoomData` và `fetchingRoomData`
  - Thêm useEffect fetch data khi modal mở
  - Cập nhật render logic để dùng `fullRoomData`
  - Cập nhật toggle logic để fetch lại data

---

**Hoàn tất!** 🎉 Bây giờ modal edit room sẽ hiển thị đúng dữ liệu cho cả 2 loại phòng.
