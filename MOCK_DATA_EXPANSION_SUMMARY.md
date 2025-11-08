# Mock Data Expansion Summary - Statistics APIs

## 📊 Tổng quan
Đã mở rộng và tăng cường dữ liệu mock cho các giao diện thống kê từ dữ liệu cơ bản lên dữ liệu phong phú và chi tiết hơn.

---

## 🔄 Những thay đổi chính

### 1. **MOCK_DENTISTS** - Nha sỹ (8 → 15 dentists)
**Trước:**
- 8 nha sỹ cơ bản
- Chỉ có: id, name, employeeCode, specialization

**Sau:**
- **15 nha sỹ** với đầy đủ thông tin
- Thêm fields:
  - `experience`: Số năm kinh nghiệm (5-15 năm)
  - `rating`: Đánh giá (4.5-4.9 sao)
- Chuyên môn đa dạng: Phục hình, Nha chu, Chỉnh nha, Implant, Nội nha, Răng sứ, Tổng quát, Thẩm mỹ, Phẫu thuật, Nha khoa trẻ em

**Ví dụ:**
```javascript
{ 
  id: 'D001', 
  name: 'BS. Nguyễn Văn An', 
  employeeCode: 'NV00000001', 
  specialization: 'Phục hình', 
  experience: 12, 
  rating: 4.9 
}
```

---

### 2. **MOCK_SERVICES** - Dịch vụ (15 → 30 services)
**Trước:**
- 15 dịch vụ cơ bản
- Chỉ có: id, name, type, basePrice

**Sau:**
- **30 dịch vụ** chi tiết hơn
- Thêm fields:
  - `category`: Phân loại chi tiết (cosmetic, implant, orthodontics, periodontics, endodontics, restorative, surgery, pediatric, general)
  - `duration`: Thời gian điều trị (phút)
- Phân nhóm rõ ràng:
  - **Exam services (5)**: Khám tổng quát, nha chu, chỉnh nha, implant, răng trẻ em
  - **High-value treatments (9)**: Răng sứ Emax/Titan, Implant Nobel/Osstem, Invisalign, Niềng răng, Cấy ghép xương
  - **Medium-value treatments (6)**: Tẩy trắng, Veneer, Bọc răng sứ, Điều trị tủy
  - **Low-value treatments (10)**: Nhổ răng, Trám răng, Lấy cao răng, Cạo vôi, Phủ Flour

**Ví dụ:**
```javascript
{ 
  id: 'SV010', 
  name: 'Niềng răng Invisalign', 
  type: 'treatment', 
  category: 'orthodontics', 
  basePrice: 85000000, 
  duration: 90 
}
```

---

### 3. **Loyal Patients** - Bệnh nhân trung thành (5 → 50 patients)
**Trước:**
- 5 bệnh nhân
- Thông tin cơ bản

**Sau:**
- **50 bệnh nhân** với dữ liệu chi tiết
- Phân bố:
  - VIP (10+ visits): 15 patients - Avg spent: 58M-145M VNĐ
  - Loyal (5-9 visits): 20 patients - Avg spent: 28M-92M VNĐ
  - Regular (2-4 visits): 15 patients - Avg spent: 12M-27M VNĐ
- Dữ liệu thực tế:
  - `totalVisits`: 2-28 lượt khám
  - `totalSpent`: 12M-145M VNĐ
  - `frequency`: 0.2-2.8 lượt/tháng
  - `firstVisit`, `lastVisit`: Từ 2022 đến 2024

**Ví dụ top patient:**
```javascript
{ 
  patientId: 'P001', 
  name: 'Nguyễn Văn Anh', 
  phone: '0901234567', 
  totalVisits: 28, 
  totalSpent: 145000000, 
  firstVisit: '2022-11-15', 
  lastVisit: '2024-11-05', 
  frequency: 2.8 
}
```

---

### 4. **Cohort Analysis** - Phân tích nhóm (6 → 12 months)
**Trước:**
- 6 tháng (01/2024 - 06/2024)

**Sau:**
- **12 tháng** (12/2023 - 11/2024)
- Retention rate tăng dần: 65.8% → 87.5%
- Dữ liệu thực tế cho từng tháng:
  - `newPatients`: 38-62 BN mới/tháng
  - `withSecondVisit`: BN quay lại
  - `retentionRate`: Tỷ lệ giữ chân

---

### 5. **Top Staff** - Nhân viên đặt lịch (5 → 20 staff)
**Trước:**
- 5 nhân viên
- Chỉ có: id, name, role, count

**Sau:**
- **20 nhân viên** với hiệu suất chi tiết
- Thêm field:
  - `efficiency`: Hiệu suất hoàn thành (81.2%-96.8%)
- Phân bố theo role:
  - Receptionist: 13 người (68%)
  - Admin: 5 người (21%)
  - Manager: 2 người (11%)

---

## 🆕 API mới được thêm

### API 4: **getAppointmentStatistics**
Thống kê lịch hẹn chi tiết:
- Tổng quan: Total, Completed, Cancelled, No-show
- Tỷ lệ: Completion rate, Cancellation rate, No-show rate
- Phân bố theo:
  - Time slot (8:00-18:00, 9 khung giờ)
  - Day of week (Thứ 2-CN)
- Trend theo ngày

**Use case:** Quản lý lịch hẹn, tối ưu hóa khung giờ

---

### API 5: **getServiceUsageStatistics**
Thống kê sử dụng dịch vụ:
- Phân loại theo category (9 categories)
- Top trending services (Top 5 tăng trưởng cao nhất)
- Top services by revenue (Top 15)
- Metrics:
  - Count, Revenue, Avg price per service
  - Growth rate (so với kỳ trước)

**Use case:** Phân tích xu hướng dịch vụ, marketing

---

### API 6: **getDentistPerformanceStatistics**
Thống kê hiệu suất nha sỹ:
- Performance metrics cho từng nha sỹ:
  - Total appointments, Completed, Cancelled, No-show
  - Completion rate
  - Total revenue, Avg revenue per appointment
  - Patient satisfaction (85-98%)
  - Repeat patient rate (70-90%)
- Top performers (Top 5)
- Average benchmarks

**Use case:** Đánh giá hiệu suất, KPI, thưởng phạt

---

## 📈 Dữ liệu thêm vào Patient Retention API

### **Segment Analysis** (Mới)
Phân tích phân khúc khách hàng:
```javascript
[
  { 
    segment: 'VIP (10+ visits)', 
    count: 250, 
    percentage: 12.5%, 
    avgSpent: 58M, 
    totalRevenue: 14.5B,
    retention: 95.2%
  },
  { segment: 'Loyal (5-9 visits)', ... },
  { segment: 'Regular (2-4 visits)', ... },
  { segment: 'One-time', ... }
]
```

### **Churn Risk Analysis** (Mới)
Phân tích nguy cơ rời bỏ:
```javascript
[
  { 
    riskLevel: 'High Risk', 
    count: 180, 
    lastVisit: '> 6 months ago',
    avgDaysSinceVisit: 210,
    potentialRevenueLoss: 450M
  },
  { riskLevel: 'Medium Risk', ... },
  { riskLevel: 'Low Risk', ... }
]
```

---

## 📊 Tổng kết số liệu

| Loại dữ liệu | Trước | Sau | Tăng |
|--------------|-------|-----|------|
| Dentists | 8 | 15 | +87.5% |
| Services | 15 | 30 | +100% |
| Loyal Patients | 5 | 50 | +900% |
| Cohort Months | 6 | 12 | +100% |
| Top Staff | 5 | 20 | +300% |
| APIs | 3 | 6 | +100% |

---

## 🎯 Lợi ích

### 1. **Dữ liệu phong phú hơn**
- Đủ data để test các trường hợp edge case
- Chart/Graph hiển thị đầy đủ, không bị trống

### 2. **Thực tế hơn**
- Số liệu hợp lý theo business logic
- Tỷ lệ % phản ánh thực tế (VIP 12.5%, Loyal 21%, Regular 34%, One-time 32.5%)

### 3. **Dễ demo**
- Có đủ data để showcase tất cả features
- Top lists có nhiều items để scroll/pagination

### 4. **Insights tốt hơn**
- Segment analysis giúp hiểu customer behavior
- Churn risk analysis giúp retention strategy
- Service trending giúp marketing focus

### 5. **Performance metrics đầy đủ**
- Dentist KPIs chi tiết
- Staff efficiency tracking
- Service category analysis

---

## 🔧 Cách sử dụng

### Import APIs:
```javascript
import { 
  getRevenueStatistics,
  getBookingChannelStatistics,
  getPatientRetentionStatistics,
  getAppointmentStatistics,
  getServiceUsageStatistics,
  getDentistPerformanceStatistics,
  MOCK_DENTISTS,
  MOCK_SERVICES
} from '../../services/statisticsAPI';
```

### Example usage:
```javascript
// Revenue stats
const revenue = await getRevenueStatistics({
  startDate: '2024-01-01',
  endDate: '2024-11-08',
  groupBy: 'month',
  dentistId: 'D001'
});

// Appointment stats
const appointments = await getAppointmentStatistics({
  startDate: '2024-11-01',
  endDate: '2024-11-08',
  groupBy: 'day'
});

// Service usage
const services = await getServiceUsageStatistics({
  startDate: '2024-10-01',
  endDate: '2024-11-08',
  category: 'cosmetic'
});

// Dentist performance
const dentists = await getDentistPerformanceStatistics({
  startDate: '2024-01-01',
  endDate: '2024-11-08'
});
```

---

## ✅ Testing checklist

- [x] Revenue statistics có đủ 15 dentists
- [x] Revenue statistics có 30 services
- [x] Top 10 lists hiển thị đầy đủ
- [x] Charts có đủ data points
- [x] Patient retention có 50 loyal patients
- [x] Cohort analysis 12 months
- [x] Staff performance 20 staff members
- [x] Appointment stats by time slot
- [x] Service category breakdown
- [x] Segment analysis 4 segments
- [x] Churn risk 3 levels
- [x] Trending services với growth rate

---

**Created:** November 8, 2025  
**File:** `src/services/statisticsAPI.js`  
**Total Lines:** ~800+ lines of mock data
