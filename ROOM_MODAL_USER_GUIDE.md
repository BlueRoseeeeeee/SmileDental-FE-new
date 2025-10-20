# 🎯 Hướng Dẫn Sử Dụng - Edit Room Modal

## ✨ Tính Năng Mới

Modal Edit Room giờ có thể **quản lý buồng con** hoàn chỉnh:

```
┌─────────────────────────────────────────────────────┐
│ ✏️ Chỉnh sửa phòng khám                             │
├─────────────────────────────────────────────────────┤
│ Tên phòng: [Phòng Phẫu Thuật            ]          │
│ Loại phòng: ☑️ Có buồng con  ☐ Phòng đơn          │
│ Trạng thái: ☑️ Hoạt động                           │
├─────────────────────────────────────────────────────┤
│ 🏠 Danh sách buồng (3 buồng)                        │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Buồng 1  [🟢 Hoạt động]  [Switch: ON]  [🗑️]   │ │
│ │ Buồng 2  [🔴 Tắt]        [Switch: OFF] [🗑️]   │ │
│ │ Buồng 3  [🟢 Hoạt động]  [Switch: ON]  [🗑️🚫]│ │
│ │          [🟠 Đã sử dụng]                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ➕ Thêm buồng mới                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Số lượng: [2▾]  [➕ Thêm 2 buồng]              │ │
│ │ ℹ️ Buồng mới sẽ tự động đánh số: Buồng 4, 5...  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│                          [Hủy]  [Cập nhật]         │
└─────────────────────────────────────────────────────┘
```

---

## 📖 Cách Sử Dụng

### **1️⃣ Bật/Tắt Trạng Thái Buồng**

**Bước 1:** Click vào **Switch** ở buồng muốn thay đổi

**Bước 2:** Modal xác nhận xuất hiện:
```
┌────────────────────────────────────┐
│ Xác nhận thay đổi trạng thái buồng │
│                                    │
│ Bạn có chắc chắn muốn KÍCH HOẠT    │
│ buồng Buồng 2?                     │
│                                    │
│ [Hủy]  [Xác nhận]                  │
└────────────────────────────────────┘
```

**Bước 3:** Click **Xác nhận**

**Kết quả:**
- ✅ Trạng thái buồng thay đổi ngay
- ✅ Tag color thay đổi: 🟢 ↔️ 🔴
- ✅ Không cần reload trang

---

### **2️⃣ Thêm Buồng Mới**

**Bước 1:** Chọn **số lượng buồng** muốn thêm (1-10)

**Bước 2:** Click **"Thêm X buồng"**

**Bước 3:** Đợi loading... (vài giây)

**Kết quả:**
- ✅ Buồng mới xuất hiện ngay trong danh sách
- ✅ Tên tự động: Buồng 4, Buồng 5, Buồng 6...
- ✅ Tất cả buồng mới mặc định **Hoạt động**

**Ví dụ:**
```
Trước:  Buồng 1, Buồng 2, Buồng 3 (3 buồng)
Thêm:   2 buồng
Sau:    Buồng 1, Buồng 2, Buồng 3, Buồng 4, Buồng 5 (5 buồng)
```

---

### **3️⃣ Xóa Buồng**

**Bước 1:** Click nút **🗑️** ở buồng muốn xóa

**Bước 2:** Modal xác nhận xuất hiện:
```
┌────────────────────────────────────┐
│ ⚠️ Xác nhận xóa buồng              │
│                                    │
│ Bạn có chắc chắn muốn xóa buồng    │
│ Buồng 2?                           │
│                                    │
│ ⚠️ Hành động không thể hoàn tác!   │
│                                    │
│ [Hủy]  [Xóa buồng]                 │
└────────────────────────────────────┘
```

**Bước 3:** Click **Xóa buồng**

**Kết quả:**
- ✅ Buồng biến mất khỏi danh sách
- ✅ Số lượng buồng giảm đi 1

**⚠️ LƯU Ý:**
- ❌ **KHÔNG thể xóa** buồng có tag 🟠 "Đã sử dụng"
- ❌ Nút xóa sẽ bị **disable** (màu xám)
- ✅ Chỉ xóa được buồng **chưa từng được dùng**

---

## 🎯 Quy Tắc & Giới Hạn

### **Thêm Buồng:**
- ✅ Tối thiểu: 1 buồng
- ✅ Tối đa: 10 buồng / lần
- ✅ Tên tự động: Buồng [số tiếp theo]
- ✅ Trạng thái mặc định: Hoạt động

### **Xóa Buồng:**
- ❌ Không xóa nếu `hasBeenUsed = true`
- ✅ Chỉ xóa buồng chưa dùng
- ⚠️ Không thể hoàn tác

### **Toggle Trạng Thái:**
- ✅ Có thể bật/tắt bất kỳ buồng nào
- ✅ Kể cả buồng đã sử dụng
- ✅ Cần xác nhận trước khi thay đổi

---

## 🔍 Hiển Thị Tag

| Tag | Màu | Ý Nghĩa |
|-----|-----|---------|
| 🟢 **Hoạt động** | Green | Buồng đang bật, có thể dùng |
| 🔴 **Tắt** | Red | Buồng đang tắt, không dùng được |
| 🟠 **Đã sử dụng** | Orange | Buồng đã từng có lịch/bệnh nhân |

**Kết hợp:**
- `Buồng 1` + `🟢 Hoạt động` = Buồng mới, chưa dùng, đang bật
- `Buồng 2` + `🔴 Tắt` + `🟠 Đã sử dụng` = Buồng cũ, đang tắt, không xóa được
- `Buồng 3` + `🟢 Hoạt động` + `🟠 Đã sử dụng` = Buồng cũ, đang bật, không xóa được

---

## 🚨 Xử Lý Lỗi

### **Lỗi 1: "Không thể xóa buồng đã được sử dụng"**
```
Nguyên nhân: Buồng có hasBeenUsed = true
Giải pháp: Chỉ có thể tắt buồng (toggle), không xóa được
```

### **Lỗi 2: "Số lượng buồng phải từ 1 đến 10"**
```
Nguyên nhân: Nhập số không hợp lệ
Giải pháp: Chọn số trong khoảng 1-10
```

### **Lỗi 3: API lỗi khi thêm/xóa/toggle**
```
Hiển thị: Toast error với message từ server
Giải pháp: Kiểm tra network, thử lại
```

---

## 💡 Tips & Tricks

### **Tip 1: Thêm Nhiều Buồng Nhanh**
```
Thay vì thêm từng buồng 1:
❌ Thêm 1 → Thêm 1 → Thêm 1 (3 lần click)

Hãy thêm cùng lúc:
✅ Chọn số lượng 3 → Thêm 3 buồng (1 lần click)
```

### **Tip 2: Toggle Hàng Loạt**
```
Muốn tắt nhiều buồng:
1. Toggle buồng 1 → Xác nhận
2. Toggle buồng 2 → Xác nhận
3. Toggle buồng 3 → Xác nhận

(Chưa có toggle all, nhưng rất nhanh)
```

### **Tip 3: Kiểm Tra Trước Khi Xóa**
```
Trước khi xóa, kiểm tra:
- Có tag "Đã sử dụng" không? → Không xóa được
- Nút xóa disable? → Không xóa được
- Nút xóa enable? → OK, xóa được
```

---

## 📊 Workflow Hoàn Chỉnh

### **Scenario: Tạo Phòng Phẫu Thuật với 5 buồng**

```
Bước 1: Tạo phòng mới
  ↓
  [Tên phòng: Phòng Phẫu Thuật]
  [Loại: Có buồng con]
  [Số lượng: 5]
  → Click "Tạo mới"
  ↓
Kết quả: Phòng có 5 buồng (Buồng 1-5)

Bước 2: Cần thêm 2 buồng nữa
  ↓
  Click "Edit" → Modal mở
  Chọn số lượng: 2
  Click "Thêm 2 buồng"
  ↓
Kết quả: Phòng có 7 buồng (Buồng 1-7)

Bước 3: Tắt Buồng 3 (bảo trì)
  ↓
  Click Switch ở Buồng 3
  Xác nhận
  ↓
Kết quả: Buồng 3 chuyển sang "Tắt"

Bước 4: Xóa Buồng 7 (thừa)
  ↓
  Click 🗑️ ở Buồng 7
  Xác nhận xóa
  ↓
Kết quả: Còn 6 buồng (Buồng 1-6)
```

---

## ✅ Checklist Sử Dụng

Khi edit phòng có subrooms, bạn có thể:

- [x] Xem danh sách buồng đầy đủ
- [x] Kiểm tra trạng thái từng buồng (Hoạt động/Tắt)
- [x] Xem buồng nào đã được sử dụng
- [x] Bật/tắt trạng thái buồng
- [x] Thêm buồng mới (1-10 buồng/lần)
- [x] Xóa buồng chưa sử dụng
- [x] Mọi thay đổi cập nhật ngay lập tức
- [x] Không cần reload trang

---

## 🎉 Hoàn Tất!

Bây giờ bạn có thể quản lý phòng và buồng hoàn chỉnh ngay trong một modal duy nhất! 🚀

**Có câu hỏi?** Xem file `UPDATE_ROOM_MODAL_SUBROOM_MANAGEMENT.md` để biết chi tiết kỹ thuật.
