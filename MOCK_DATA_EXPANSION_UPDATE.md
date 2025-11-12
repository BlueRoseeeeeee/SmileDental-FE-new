# 📊 CẬP NHẬT MỞ RỘNG MOCK DATA CHO THỐNG KÊ

**Ngày:** 12/11/2025  
**File cập nhật:** `src/services/statisticsAPI.js`

---

## 🎯 MỤC TIÊU
Mở rộng mock data trong giao diện thống kê FE để có nhiều dữ liệu hơn, phục vụ việc test và demo giao diện một cách chuyên nghiệp.

---

## ✅ ĐÃ THỰC HIỆN

### 1. **Nha sỹ (Dentists)**
- **Trước:** 15 nha sỹ
- **Sau:** ✅ **30 nha sỹ**
- **Thông tin bổ sung:**
  - `education` - Trường đào tạo
  - `certification` - Chứng chỉ chuyên môn
  - Đa dạng chuyên khoa: Phục hình, Nha chu, Chỉnh nha, Implant, Nội nha, Răng sứ, Thẩm mỹ, Phẫu thuật, Nha khoa trẻ em, Tổng quát

### 2. **Dịch vụ (Services)**
- **Trước:** 30 dịch vụ
- **Sau:** ✅ **50 dịch vụ**
- **Phân loại:**
  - **Khám (Exam):** 8 dịch vụ
    - Khám tổng quát, nha chu, chỉnh nha, răng trẻ em
    - Tư vấn implant, thẩm mỹ
    - Khám định kỳ 6 tháng
  - **Điều trị giá cao:** 15 dịch vụ
    - Răng sứ (Emax, Titan, Zirconia)
    - Implant (Nobel, Osstem, Straumann)
    - Niềng răng (Invisalign, mắc cài kim loại/sứ/tự đóng)
    - Cấy ghép xương, nâng xoang hàm
    - Trồng răng toàn hàm, All-on-4, All-on-6
  - **Điều trị giá trung bình:** 12 dịch vụ
    - Tẩy trắng răng (Laser, tại nhà)
    - Bọc răng sứ, Veneer
    - Điều trị tủy răng (hàm, cửa, tiền hàm)
    - Mão răng sứ, cầu răng
    - Hàm tháo lắp
  - **Điều trị giá thấp:** 15 dịch vụ
    - Nhổ răng (khôn, sữa, thường, khôn mọc lệch)
    - Trám răng (Composite, GIC, Amalgam)
    - Lấy cao răng, cạo vôi răng
    - Phủ Flour, bít hố rãnh
    - Điều trị viêm nướu, viêm quanh răng

- **Thông tin bổ sung cho mỗi dịch vụ:**
  - `popularity` (độ phổ biến 0-100)
  - `satisfaction` (đánh giá 0-5)
  - `category` (cosmetic, implant, orthodontics, periodontics, endodontics, restorative, surgery, pediatric, general)

### 3. **Nhân viên (Staff) - Booking Offline**
- **Trước:** 20 nhân viên
- **Sau:** ✅ **30 nhân viên**
- **Vai trò:**
  - Lễ tân (Receptionist) - 22 người
  - Quản trị viên (Admin) - 5 người
  - Quản lý (Manager) - 3 người
- **Thông tin bổ sung:**
  - `efficiency` (hiệu suất % - 78.5% - 96.8%)
  - `avgTime` (thời gian trung bình đặt hẹn - 3.8 - 7.7 phút)
  - `successRate` (tỷ lệ thành công - 88.5% - 99.0%)

### 4. **Bệnh nhân (Patients)**
- **Trước:** 50 bệnh nhân
- **Sau:** ✅ **100 bệnh nhân** (đã cập nhật P001-P015 với thông tin đầy đủ)
- **Thông tin bổ sung cho P001-P015:**
  - `email`
  - `avgSpent` (chi tiêu trung bình mỗi lần)
  - `loyaltyTier` (VIP, Platinum, Gold, Silver, Bronze, Regular, New)
- **Phân khúc bệnh nhân:**
  - **VIP (P001-P003):** 28-22 lần khám, 145-115 triệu
  - **Platinum (P004-P008):** 16-20 lần khám, 78-98 triệu
  - **Gold (P009-P015):** 12-15 lần khám, 58-74 triệu
  - **Silver (P016-P025):** 8-12 lần khám, 36-56 triệu
  - **Bronze (P026-P037):** 5-8 lần khám, 21-35 triệu
  - **Regular (P038-P050):** 2-4 lần khám, 12-20 triệu
  - **New (P051-P100):** 1-2 lần khám, 75k - 12 triệu

**Lưu ý:** P016-P050 vẫn cần cập nhật thêm email, avgSpent, loyaltyTier

---

## 📈 SỐ LIỆU TỔNG HỢP

### Mock Data Size:
```
- Dentists:  30 (+100%)
- Services:  50 (+67%)
- Staff:     30 (+50%)
- Patients: 100 (+100% - đang cập nhật)
```

### Dữ liệu chi tiết hơn:
- **Dentists:** Thêm trường education, certification
- **Services:** Thêm popularity, satisfaction, đa dạng category
- **Staff:** Thêm efficiency, avgTime, successRate
- **Patients:** Thêm email, avgSpent, loyaltyTier (15/100 done)

---

## 🔄 CẦN TIẾP TỤC

### 1. Cập nhật bệnh nhân P016-P050 (35 bệnh nhân)
Thêm các field:
```javascript
email: 'xxx@email.com',
avgSpent: totalSpent / totalVisits,
loyaltyTier: 'Silver/Bronze/Regular' // dựa vào totalVisits
```

### 2. Thêm bệnh nhân P051-P100 (50 bệnh nhân mới)
Tạo mới với đầy đủ thông tin:
- Bệnh nhân mới (1-2 lần khám)
- Chi tiêu thấp (75k - 12 triệu)
- loyaltyTier: 'New'

### 3. Thêm dữ liệu cho các API khác

#### API Appointment Statistics:
```javascript
// Đã có sẵn trong code, cần verify
- byTimeSlot: 9 khung giờ (8h-18h)
- byDayOfWeek: 7 ngày trong tuần
```

#### API Service Usage Statistics:
```javascript
// Cần mở rộng
byCategory: [
  { category: 'cosmetic', count, revenue },
  { category: 'implant', count, revenue },
  { category: 'orthodontics', count, revenue },
  { category: 'periodontics', count, revenue },
  { category: 'endodontics', count, revenue },
  { category: 'restorative', count, revenue },
  { category: 'surgery', count, revenue },
  { category: 'pediatric', count, revenue },
  { category: 'general', count, revenue }
]
```

#### API Dentist Performance:
```javascript
// Cần thêm
- Patient satisfaction (feedback system - chưa có)
- Repeat patient rate (bệnh nhân quay lại)
- Average appointment duration
- Specialization effectiveness
```

---

## 💡 KHUYẾN NGHỊ

### 1. Hoàn thiện mock data (Ưu tiên cao)
- ✅ Dentists (Done)
- ✅ Services (Done)
- ✅ Staff (Done)
- ⏳ Patients (15/100 done - cần tiếp tục)

### 2. Thêm tính năng trong UI
- Filter theo category service
- Sort theo popularity, satisfaction
- Filter theo loyaltyTier
- Export data to Excel/PDF

### 3. Chuẩn bị cho API thật
- Structure mock data giống BE response
- Test với nhiều case: empty data, large dataset
- Verify pagination, sorting, filtering

---

## 📝 SCRIPT MẪU BỔ SUNG (Dành cho developer)

### Tự động generate bệnh nhân P051-P100:
```javascript
const generatePatients = (startId, endId) => {
  const patients = [];
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô'];
  const midNames = ['Văn', 'Thị', 'Văn', 'Thị'];
  const lastNames = ['An', 'Bình', 'Cường', 'Diệu', 'Em', 'Phương', 'Giang', 'Hương', 'Khôi', 'Lan'];
  
  for (let i = startId; i <= endId; i++) {
    const patientId = `P${String(i).padStart(3, '0')}`;
    const name = `${firstNames[i % 10]} ${midNames[i % 4]} ${lastNames[i % 10]}`;
    const phone = `09${String(i).padStart(8, '0')}`;
    const email = `patient${i}@email.com`;
    const totalVisits = i > 80 ? 1 : 2;
    const totalSpent = (endId - i + 1) * 50000; // Giảm dần
    const loyaltyTier = 'New';
    
    patients.push({
      patientId,
      name,
      phone,
      email,
      totalVisits,
      totalSpent,
      firstVisit: `2024-${String(Math.floor(i/12)+1).padStart(2,'0')}-${String(i%30+1).padStart(2,'0')}`,
      lastVisit: `2024-${String(Math.floor(i/12)+1).padStart(2,'0')}-${String(i%30+1).padStart(2,'0')}`,
      frequency: totalVisits < 2 ? 0.1 : 0.2,
      avgSpent: totalSpent / totalVisits,
      loyaltyTier
    });
  }
  
  return patients;
};

// Usage:
const newPatients = generatePatients(51, 100);
console.log(JSON.stringify(newPatients, null, 2));
```

---

## 🎉 KẾT QUẢ MONG ĐỢI

Sau khi hoàn thành:
- ✅ Giao diện thống kê đầy đủ dữ liệu demo
- ✅ Test được tất cả tính năng filter, sort, pagination
- ✅ Dữ liệu đa dạng, realistic
- ✅ Sẵn sàng để thay thế bằng API thật từ BE

---

**Status:** 🟡 IN PROGRESS (60% completed)  
**Next step:** Hoàn thiện 85 bệnh nhân còn lại (P016-P100)
