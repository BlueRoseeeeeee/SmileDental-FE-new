# Hướng dẫn sửa BookingSelectTime.jsx

## Vấn đề
API `getDentistSlotsFuture` (`/api/slot/dentist/:id/details/future`) đang không lọc đúng roomType của service, dẫn đến hiển thị sai slot groups.

## Giải pháp
Thay đổi frontend để sử dụng API `getDentistWorkingDates` (`/api/slot/dentist/:id/working-dates`) vì API này:
- ✅ Đã lọc đúng slots theo `allowedRoomTypes` của service
- ✅ Đã group slots theo date và shift
- ✅ Đã kiểm tra consecutive slots đủ duration

## Cách sửa

### Bước 1: Mở file
```
src/pages/Patient/BookingSelectTime.jsx
```

### Bước 2: Tìm hàm `fetchAvailableSlots` (bắt đầu từ dòng 128)

### Bước 3: Thay thế toàn bộ hàm `fetchAvailableSlots` 

Xóa từ dòng 128 đến dòng 266 (hàm cũ) và thay bằng code trong file:
```
PATCH_BookingSelectTime_fetchAvailableSlots.js
```

## Thay đổi chính

### 1. Thay đổi API call:
**Cũ:**
```javascript
const response = await slotService.getDentistSlotsFuture(dentistId, {
  date: date,
  shiftName: '',
  serviceId: serviceData?._id
});
```

**Mới:**
```javascript
const response = await slotService.getDentistWorkingDates(
  dentistId,
  serviceDuration,
  serviceData?._id
);
```

### 2. Xử lý response từ working-dates API:
- Extract slots cho ngày đã chọn từ `workingDates` array
- Transform format từ API sang format frontend
- Không cần filter lại vì API đã filter đúng

### 3. Transform shift slots:
```javascript
const transformShiftSlots = (shiftData) => {
  // Group consecutive slots thành slot groups
  // API trả về slots đã được filter theo roomType
}
```

## Kiểm tra sau khi sửa

1. Restart frontend dev server
2. Truy cập: `http://localhost:5173/patient/booking/select-time`
3. Chọn một service có `allowedRoomTypes` cụ thể
4. Kiểm tra console logs:
   - "🏥 Service ID:" - Should show correct service ID
   - "📅 Available working dates:" - Should show dates
   - "✅ Found date data:" - Should show shift data
   - "✨ Transformed slot groups:" - Should show correct groups

5. Verify:
   - Chỉ hiển thị time slots trong rooms có đúng roomType
   - Slots được group đúng theo serviceDuration
   - Không có slots từ rooms không phù hợp

## Test case

### Service: "Khám tổng quát"
- `allowedRoomTypes`: ["examination"]
- `durationMinutes`: 30

**Expected:**
- Chỉ hiển thị slots từ rooms có `roomType === "examination"`
- Mỗi slot group có ít nhất 2 slots liên tục (30 phút)

### Service: "Phẫu thuật nhỏ"
- `allowedRoomTypes`: ["surgery"]
- `durationMinutes`: 60

**Expected:**
- Chỉ hiển thị slots từ rooms có `roomType === "surgery"`
- Mỗi slot group có ít nhất 4 slots liên tục (60 phút)

## Rollback (nếu cần)
```bash
cd c:\Users\ADMINS\Downloads\KLTN\SmileDental-FE-new
git checkout HEAD -- src/pages/Patient/BookingSelectTime.jsx
```

## Notes
- API `working-dates` đã handle toàn bộ logic filter và grouping ở backend
- Frontend chỉ cần extract data cho ngày đã chọn và transform format
- Không cần import thêm function `groupConsecutiveSlots` vì đã tự implement transform logic
