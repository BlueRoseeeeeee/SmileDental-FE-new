# ✅ Cập Nhật Modal Edit Room - Thêm/Xóa/Toggle SubRoom

## 🎯 Tính Năng Mới

Bây giờ modal edit room có thể:
- ✅ **Hiển thị danh sách buồng đầy đủ**
- ✅ **Bật/Tắt trạng thái buồng** ngay trong modal
- ✅ **Thêm buồng mới** (1-10 buồng cùng lúc)
- ✅ **Xóa buồng** (nếu chưa được sử dụng)
- ✅ **Tự động cập nhật UI** sau mỗi thao tác

---

## 📋 Giao Diện Mới

### **1. Danh Sách Buồng**

```
┌──────────────────────────────────────────────┐
│ 🏠 Danh sách buồng (5 buồng)                 │
├──────────────────────────────────────────────┤
│ Buồng 1  [Hoạt động]  [Switch: ON]  [🗑️]    │
│ Buồng 2  [Hoạt động]  [Switch: ON]  [🗑️]    │
│ Buồng 3  [Tắt]        [Switch: OFF] [🗑️]    │
│ Buồng 4  [Hoạt động]  [Switch: ON]  [🗑️]    │
│ Buồng 5  [Đã sử dụng] [Switch: ON]  [🗑️🚫] │
└──────────────────────────────────────────────┘
```

**Mỗi hàng hiển thị:**
- 📌 Tên buồng (Buồng 1, Buồng 2...)
- 🟢/🔴 Tag trạng thái (Hoạt động / Tắt)
- 🟠 Tag "Đã sử dụng" (nếu có)
- 🔘 Switch bật/tắt
- 🗑️ Nút xóa (disabled nếu đã sử dụng)

---

### **2. Phần Thêm Buồng Mới**

```
┌──────────────────────────────────────────────┐
│ ➕ Thêm buồng mới                            │
├──────────────────────────────────────────────┤
│ [Số lượng: 2] [➕ Thêm 2 buồng]             │
│                                              │
│ ℹ️ Buồng mới sẽ được đánh số tự động tiếp    │
│    theo buồng cuối cùng                      │
└──────────────────────────────────────────────┘
```

**Chức năng:**
- Chọn số lượng buồng muốn thêm (1-10)
- Click "Thêm X buồng" để tạo
- Tên buồng tự động: Buồng 6, Buồng 7, ...

---

### **3. Modal Xác Nhận Toggle**

```
┌──────────────────────────────────────────────┐
│ Xác nhận thay đổi trạng thái buồng           │
├──────────────────────────────────────────────┤
│ Bạn có chắc chắn muốn KÍCH HOẠT buồng        │
│ Buồng 3?                                     │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ ✓ Buồng sẽ được kích hoạt và sẵn sàng   │ │
│ │   cho việc tạo lịch và phục vụ bệnh nhân│ │
│ └──────────────────────────────────────────┘ │
│                                              │
│              [Hủy]  [Xác nhận]               │
└──────────────────────────────────────────────┘
```

---

### **4. Modal Xác Nhận Xóa**

```
┌──────────────────────────────────────────────┐
│ Xác nhận xóa buồng                           │
├──────────────────────────────────────────────┤
│ Bạn có chắc chắn muốn xóa buồng Buồng 2?     │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ ⚠️ Cảnh báo: Hành động này không thể     │ │
│ │ hoàn tác. Buồng sẽ bị xóa vĩnh viễn      │ │
│ │ khỏi hệ thống.                           │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│              [Hủy]  [Xóa buồng]              │
└──────────────────────────────────────────────┘
```

---

## 🔧 Chức Năng Chi Tiết

### **1. Toggle Trạng Thái Buồng**

**Flow:**
1. Click switch ở buồng muốn thay đổi
2. Modal xác nhận hiện lên
3. Click "Xác nhận"
4. API call: `toggleSubRoomStatus(roomId, subRoomId)`
5. Fetch lại dữ liệu phòng
6. UI cập nhật ngay lập tức

**Code:**
```jsx
const handleConfirmSubRoomToggle = async () => {
  await roomService.toggleSubRoomStatus(room._id, subRoomId);
  
  // Fetch lại data
  const response = await roomService.getRoomById(room._id);
  setFullRoomData(response.room);
  
  onSuccess(); // Refresh parent list
};
```

---

### **2. Thêm Buồng Mới**

**Flow:**
1. Chọn số lượng buồng (1-10)
2. Click "Thêm X buồng"
3. API call: `addSubRooms(roomId, count)`
4. Fetch lại dữ liệu phòng
5. Danh sách buồng cập nhật với buồng mới

**Quy tắc đánh số:**
- Tìm số buồng lớn nhất hiện tại (VD: Buồng 5)
- Buồng mới bắt đầu từ số tiếp theo (Buồng 6, 7, 8...)

**Code:**
```jsx
const handleAddSubRooms = async () => {
  await roomService.addSubRooms(room._id, addSubRoomCount);
  
  // Fetch lại data
  const response = await roomService.getRoomById(room._id);
  setFullRoomData(response.room);
  
  setAddSubRoomCount(1); // Reset về 1
  onSuccess();
};
```

---

### **3. Xóa Buồng**

**Flow:**
1. Click nút xóa (🗑️) ở buồng muốn xóa
2. Modal xác nhận hiện lên
3. Click "Xóa buồng"
4. API call: `deleteSubRoom(roomId, subRoomId)`
5. Fetch lại dữ liệu phòng
6. Buồng biến mất khỏi danh sách

**Điều kiện xóa:**
- ❌ **KHÔNG thể xóa** nếu `subRoom.hasBeenUsed = true`
- ✅ **Có thể xóa** nếu buồng chưa được sử dụng

**UI:**
```jsx
<Button
  icon={<DeleteOutlined />}
  onClick={() => handleDeleteSubRoomConfirmation(subRoom)}
  disabled={subRoom.hasBeenUsed} // Disable nếu đã dùng
/>
```

---

## 📊 State Management

### **States Mới:**

```jsx
// Add/Delete SubRoom
const [addSubRoomCount, setAddSubRoomCount] = useState(1);
const [isAddingSubRooms, setIsAddingSubRooms] = useState(false);
const [showDeleteSubRoomModal, setShowDeleteSubRoomModal] = useState(false);
const [selectedSubRoomForDelete, setSelectedSubRoomForDelete] = useState(null);
const [deleteSubRoomLoading, setDeleteSubRoomLoading] = useState(false);

// Room data
const [fullRoomData, setFullRoomData] = useState(null);
const [fetchingRoomData, setFetchingRoomData] = useState(false);
```

---

## 🎨 UI Components Mới

### **1. List Item với Actions**

```jsx
<List.Item
  actions={[
    // Toggle switch
    <Switch
      checked={subRoom.isActive}
      onChange={() => handleSubRoomToggleConfirmation(subRoom)}
    />,
    // Delete button
    <Button
      icon={<DeleteOutlined />}
      onClick={() => handleDeleteSubRoomConfirmation(subRoom)}
      disabled={subRoom.hasBeenUsed}
    />
  ]}
>
  <Space>
    <Text>{subRoom.name}</Text>
    <Tag color={subRoom.isActive ? 'green' : 'red'}>
      {subRoom.isActive ? 'Hoạt động' : 'Tắt'}
    </Tag>
    {subRoom.hasBeenUsed && (
      <Tag color="orange">Đã sử dụng</Tag>
    )}
  </Space>
</List.Item>
```

---

### **2. Add SubRooms Section**

```jsx
<div style={{ padding: 12, background: '#f5f5f5' }}>
  <Text strong>
    <PlusOutlined /> Thêm buồng mới
  </Text>
  <Space>
    <InputNumber
      min={1}
      max={10}
      value={addSubRoomCount}
      onChange={setAddSubRoomCount}
    />
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={handleAddSubRooms}
      loading={isAddingSubRooms}
    >
      Thêm {addSubRoomCount} buồng
    </Button>
  </Space>
</div>
```

---

## 🔄 Auto Refresh Flow

**Sau mọi thao tác (Toggle/Add/Delete):**

```
1. API Call
   ↓
2. Fetch lại room data
   setFullRoomData(response.room)
   ↓
3. UI tự động cập nhật
   (React re-render)
   ↓
4. Refresh parent list
   onSuccess()
```

**Lợi ích:**
- ✅ UI luôn đồng bộ với DB
- ✅ Không cần reload trang
- ✅ UX mượt mà

---

## 🚀 Testing Checklist

### **Toggle SubRoom:**
- [ ] Click switch → Modal hiện lên
- [ ] Xác nhận → Trạng thái thay đổi
- [ ] UI cập nhật ngay (không cần refresh)
- [ ] Tag color thay đổi (green ↔️ red)
- [ ] Parent list cũng cập nhật

### **Add SubRoom:**
- [ ] Chọn số lượng 1-10
- [ ] Click "Thêm X buồng"
- [ ] Buồng mới xuất hiện với số đúng
- [ ] Tên tự động: Buồng 6, 7, 8...
- [ ] Loading state hoạt động

### **Delete SubRoom:**
- [ ] Buồng chưa dùng: Nút xóa enable
- [ ] Buồng đã dùng: Nút xóa disable
- [ ] Click xóa → Modal xác nhận
- [ ] Xác nhận → Buồng biến mất
- [ ] Error handling nếu API lỗi

### **Edge Cases:**
- [ ] Xóa hết buồng → Phòng vẫn có hasSubRooms=true?
- [ ] Thêm 10 buồng cùng lúc → Số tăng đúng?
- [ ] Toggle nhiều buồng liên tục → Không bị conflict?
- [ ] Modal đóng mở nhiều lần → State reset đúng?

---

## 📝 Files Đã Sửa

### **RoomFormModal.jsx**

**Thêm:**
- ✅ Icons: `PlusOutlined`, `DeleteOutlined`
- ✅ States cho add/delete subroom
- ✅ Hàm `handleAddSubRooms()`
- ✅ Hàm `handleDeleteSubRoomConfirmation()`
- ✅ Hàm `handleConfirmDeleteSubRoom()`
- ✅ UI section "Thêm buồng mới"
- ✅ Delete button cho mỗi subroom
- ✅ Modal xác nhận xóa buồng

**Cập nhật:**
- ✅ List.Item actions: thêm delete button
- ✅ Fetch lại data sau toggle/add/delete
- ✅ Disable delete button nếu hasBeenUsed

---

## 🎯 Kết Quả

### **Trước:**
```
❌ Không thể thêm/xóa buồng trong modal
❌ Phải vào trang quản lý chi tiết
❌ Nhiều bước, không tiện
```

### **Sau:**
```
✅ Thêm/xóa/toggle buồng ngay trong modal
✅ Thao tác nhanh, UI cập nhật ngay
✅ Một modal xử lý tất cả
✅ UX tốt hơn, ít click hơn
```

---

## 💡 Tips Sử Dụng

1. **Thêm buồng nhanh:** Chọn số lượng rồi click "Thêm"
2. **Toggle trạng thái:** Click switch, xác nhận là xong
3. **Xóa buồng:** Chỉ xóa được buồng chưa dùng
4. **Kiểm tra số buồng:** Hiển thị ở tiêu đề "Danh sách buồng (X buồng)"

---

**Hoàn tất!** 🎉 Bây giờ modal edit room có đầy đủ chức năng quản lý subroom!
