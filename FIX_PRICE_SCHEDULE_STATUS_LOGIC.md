# FIX: Price Schedule Status Logic

## 🐛 Problem Report
**Issue**: Trạng thái lịch giá hiển thị không đúng logic
- Test: 03/11/2025, ngày áp dụng: 04/11/2025
- Expected: "Chờ áp dụng"
- Actual: "Đang áp dụng" (sai)

**Old Logic**: Chỉ check `isActive` flag
```jsx
{isActive ? 'Đang áp dụng' : 'Tạm ngưng'}
```

## ✅ Solution Implemented

### **New 4-Case Status Logic:**

#### **Case 1: Chờ áp dụng** 🔵
- **Condition**: `Ngày hiện tại < Ngày áp dụng (startDate)` AND `Toggle = ON`
- **Display**: `<Tag color="blue">Chờ áp dụng</Tag>`
- **Example**: Hôm nay 03/11, lịch giá bắt đầu 04/11 → "Chờ áp dụng"

#### **Case 2: Đang áp dụng** 🟢
- **Condition**: `startDate ≤ Ngày hiện tại ≤ endDate` AND `Toggle = ON`
- **Display**: `<Tag color="green">Đang áp dụng</Tag>`
- **Example**: Hôm nay 10/11, lịch giá từ 04/11 đến 20/11 → "Đang áp dụng"

#### **Case 3: Đã áp dụng** 🟠
- **Condition**: `Ngày hiện tại > Ngày kết thúc (endDate)` AND `Toggle = ON`
- **Display**: `<Tag color="orange">Đã áp dụng</Tag>`
- **Example**: Hôm nay 25/11, lịch giá kết thúc 20/11 → "Đã áp dụng"
- **⚠️ Important**: Disable toggle, edit, delete buttons (không cho thao tác với quá khứ)

#### **Case 4: Đã tắt** ⚪
- **Condition**: `Toggle = OFF` (bất kể ngày nào)
- **Display**: `<Tag color="default">Đã tắt</Tag>`
- **Note**: Chỉ cho phép tắt nếu `ngày hiện tại ≤ endDate`

---

## 📝 Code Changes

### 1. Frontend - EditService.jsx

#### **Status Display Logic** (Line 988-1020)
```jsx
{
  title: 'Trạng thái',
  dataIndex: 'isActive',
  key: 'isActive',
  render: (isActive, record) => {
    const now = dayjs();
    const startDate = dayjs(record.startDate);
    const endDate = dayjs(record.endDate);
    
    // Case 4: Toggle OFF → Đã tắt
    if (!isActive) {
      return <Tag color="default">Đã tắt</Tag>;
    }
    
    // Case 1: Ngày hiện tại < Ngày áp dụng && Toggle ON → Chờ áp dụng
    if (now.isBefore(startDate, 'day')) {
      return <Tag color="blue">Chờ áp dụng</Tag>;
    }
    
    // Case 2: Ngày hiện tại thuộc [startDate, endDate] && Toggle ON → Đang áp dụng
    if (now.isSameOrAfter(startDate, 'day') && now.isSameOrBefore(endDate, 'day')) {
      return <Tag color="green">Đang áp dụng</Tag>;
    }
    
    // Case 3: Ngày hiện tại > Ngày kết thúc && Toggle ON → Đã áp dụng
    if (now.isAfter(endDate, 'day')) {
      return <Tag color="orange">Đã áp dụng</Tag>;
    }
    
    return <Tag color="default">-</Tag>;
  }
}
```

#### **Disable Actions for Past Schedules** (Line 1030-1064)
```jsx
{
  title: 'Thao tác',
  key: 'actions',
  width: 150,
  render: (_, record) => {
    const now = dayjs();
    const endDate = dayjs(record.endDate);
    
    // ✅ Disable toggle nếu lịch giá đã kết thúc (quá khứ)
    const isPastSchedule = now.isAfter(endDate, 'day');
    
    return (
      <Space>
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEditPriceSchedule(record)}
          size="small"
          disabled={isPastSchedule}
          title={isPastSchedule ? 'Không thể chỉnh sửa lịch giá đã kết thúc' : 'Chỉnh sửa'}
        />
        <Switch
          size="small"
          checked={record.isActive}
          onChange={() => handleTogglePriceSchedule(record)}
          disabled={isPastSchedule}
          title={isPastSchedule ? 'Không thể thay đổi trạng thái lịch giá đã kết thúc' : ''}
        />
        <Popconfirm
          disabled={isPastSchedule}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            disabled={isPastSchedule}
            title={isPastSchedule ? 'Không thể xóa lịch giá đã kết thúc' : 'Xóa'}
          />
        </Popconfirm>
      </Space>
    );
  }
}
```

---

### 2. Backend Validation

#### **service.service.js - togglePriceScheduleStatus** (Line 464-482)
```javascript
// ✅ Validate: Không cho phép toggle lịch giá đã kết thúc (quá khứ)
const now = new Date();
const endDate = new Date(schedule.endDate);
endDate.setHours(23, 59, 59, 999); // Set to end of day

if (now > endDate) {
  throw new Error('Không thể thay đổi trạng thái lịch giá đã kết thúc');
}
```

#### **service.service.js - updatePriceSchedule** (Line 389-397)
```javascript
// ✅ Validate: Không cho phép update lịch giá đã kết thúc (quá khứ)
const now = new Date();
const currentEndDate = new Date(schedule.endDate);
currentEndDate.setHours(23, 59, 59, 999);

if (now > currentEndDate) {
  throw new Error('Không thể chỉnh sửa lịch giá đã kết thúc');
}
```

#### **service.service.js - deletePriceSchedule** (Line 446-454)
```javascript
// ✅ Validate: Không cho phép xóa lịch giá đã kết thúc (quá khứ)
const now = new Date();
const endDate = new Date(schedule.endDate);
endDate.setHours(23, 59, 59, 999);

if (now > endDate) {
  throw new Error('Không thể xóa lịch giá đã kết thúc');
}
```

---

## 🎯 Test Scenarios

### Scenario 1: Chờ áp dụng
```
Today: 03/11/2025
Schedule: 04/11/2025 - 20/11/2025
Toggle: ON
Expected: "Chờ áp dụng" (blue)
Actions: Edit ✅, Toggle ✅, Delete ✅
```

### Scenario 2: Đang áp dụng
```
Today: 10/11/2025
Schedule: 04/11/2025 - 20/11/2025
Toggle: ON
Expected: "Đang áp dụng" (green)
Actions: Edit ✅, Toggle ✅, Delete ✅
```

### Scenario 3: Đã áp dụng (Past)
```
Today: 25/11/2025
Schedule: 04/11/2025 - 20/11/2025
Toggle: ON
Expected: "Đã áp dụng" (orange)
Actions: Edit ❌, Toggle ❌, Delete ❌ (all disabled)
```

### Scenario 4: Đã tắt
```
Today: Any date
Schedule: 04/11/2025 - 20/11/2025
Toggle: OFF
Expected: "Đã tắt" (default/gray)
Actions: Depends on date
```

---

## 🔗 Related Files

### Frontend:
- `SmileDental-FE-new/src/pages/EditService.jsx:988-1064` - Status logic and action buttons

### Backend:
- `services/service-service/src/services/service.service.js:389-397` - updatePriceSchedule validation
- `services/service-service/src/services/service.service.js:446-454` - deletePriceSchedule validation
- `services/service-service/src/services/service.service.js:464-482` - togglePriceScheduleStatus validation

---

## 📊 Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| Chờ áp dụng | 🔵 Blue | Future schedule, waiting to start |
| Đang áp dụng | 🟢 Green | Active schedule, currently applied |
| Đã áp dụng | 🟠 Orange | Past schedule, already finished |
| Đã tắt | ⚪ Gray | Toggle OFF, not applied |

---

## ✅ Testing Checklist

- [ ] Test Case 1: Create schedule for tomorrow → Shows "Chờ áp dụng"
- [ ] Test Case 2: Active schedule today → Shows "Đang áp dụng"
- [ ] Test Case 3: Past schedule → Shows "Đã áp dụng" + disabled actions
- [ ] Test Case 4: Toggle OFF any schedule → Shows "Đã tắt"
- [ ] Test Case 5: Try to edit past schedule → Backend rejects with error
- [ ] Test Case 6: Try to toggle past schedule → Backend rejects with error
- [ ] Test Case 7: Try to delete past schedule → Backend rejects with error
