/**
 * Statistics API - Mock Data
 * Dựa trên phân tích models thực tế từ THONG_KE_CHUAN_XAC.md
 * 
 * 3 API chính:
 * 1. Revenue Statistics (Doanh thu)
 * 2. Booking Channel Statistics (Online/Offline)
 * 3. Patient Retention Statistics (Bệnh nhân quay lại)
 */

import { getApiInstance } from './apiFactory.js';

const statisticApi = getApiInstance('statistic'); // For statistics endpoints
const appointmentApi = getApiInstance('appointment'); // For appointment-related stats

// ==================== HELPER FUNCTIONS ====================

const generateDateRange = (days, startDate = null) => {
  const dates = [];
  const baseDate = startDate ? new Date(startDate) : new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const groupByPeriod = (dates, data, groupBy) => {
  if (groupBy === 'day') {
    return dates.map((date, i) => ({ date, value: data[i] }));
  }
  
  // Group by month, quarter, year
  const grouped = {};
  dates.forEach((date, i) => {
    const d = new Date(date);
    let key;
    
    if (groupBy === 'month') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else if (groupBy === 'quarter') {
      const quarter = Math.ceil((d.getMonth() + 1) / 3);
      key = `Q${quarter}-${d.getFullYear()}`;
    } else if (groupBy === 'year') {
      key = `${d.getFullYear()}`;
    }
    
    if (!grouped[key]) {
      grouped[key] = 0;
    }
    grouped[key] += data[i];
  });
  
  return Object.entries(grouped).map(([date, value]) => ({ date, value }));
};

// ==================== MOCK DATA ====================

// Dentists (Nha sỹ) - EXPANDED TO 30 DENTISTS
const MOCK_DENTISTS = [
  { id: 'D001', name: 'BS. Nguyễn Văn An', employeeCode: 'NV00000001', specialization: 'Phục hình', experience: 12, rating: 4.9, education: 'ĐH Y Hà Nội', certification: 'Chứng chỉ Phục hình nâng cao' },
  { id: 'D002', name: 'BS. Trần Thị Bảo', employeeCode: 'NV00000002', specialization: 'Nha chu', experience: 8, rating: 4.8, education: 'ĐH Y TP.HCM', certification: 'Chuyên khoa Nha chu' },
  { id: 'D003', name: 'BS. Lê Văn Cường', employeeCode: 'NV00000003', specialization: 'Chỉnh nha', experience: 15, rating: 4.9, education: 'ĐH Y Huế', certification: 'Thạc sĩ Chỉnh nha' },
  { id: 'D004', name: 'BS. Phạm Thị Diệu', employeeCode: 'NV00000004', specialization: 'Implant', experience: 10, rating: 4.7, education: 'ĐH Y Hà Nội', certification: 'Chứng chỉ Implant Nobel' },
  { id: 'D005', name: 'BS. Hoàng Văn Em', employeeCode: 'NV00000005', specialization: 'Nội nha', experience: 7, rating: 4.6, education: 'ĐH Y Cần Thơ', certification: 'Chuyên khoa Nội nha' },
  { id: 'D006', name: 'BS. Ngô Thị Phương', employeeCode: 'NV00000006', specialization: 'Răng sứ', experience: 9, rating: 4.8, education: 'ĐH Y TP.HCM', certification: 'Chứng chỉ Thẩm mỹ' },
  { id: 'D007', name: 'BS. Đỗ Văn Giang', employeeCode: 'NV00000007', specialization: 'Tổng quát', experience: 5, rating: 4.5, education: 'ĐH Y Hải Phòng', certification: 'Bác sĩ đa khoa' },
  { id: 'D008', name: 'BS. Vũ Thị Hương', employeeCode: 'NV00000008', specialization: 'Thẩm mỹ', experience: 11, rating: 4.9, education: 'ĐH Y Hà Nội', certification: 'Thạc sĩ Thẩm mỹ răng' },
  { id: 'D009', name: 'BS. Bùi Văn Khôi', employeeCode: 'NV00000009', specialization: 'Phẫu thuật', experience: 13, rating: 4.8, education: 'ĐH Y TP.HCM', certification: 'Chuyên khoa Phẫu thuật' },
  { id: 'D010', name: 'BS. Đặng Thị Lan', employeeCode: 'NV00000010', specialization: 'Nha khoa trẻ em', experience: 6, rating: 4.7, education: 'ĐH Y Hà Nội', certification: 'Chuyên khoa Nhi' },
  { id: 'D011', name: 'BS. Võ Văn Minh', employeeCode: 'NV00000011', specialization: 'Implant', experience: 14, rating: 4.9, education: 'ĐH Y Huế', certification: 'Chứng chỉ Implant Straumann' },
  { id: 'D012', name: 'BS. Phan Thị Ngọc', employeeCode: 'NV00000012', specialization: 'Chỉnh nha', experience: 9, rating: 4.7, education: 'ĐH Y TP.HCM', certification: 'Chứng chỉ Invisalign' },
  { id: 'D013', name: 'BS. Lý Văn Ông', employeeCode: 'NV00000013', specialization: 'Phục hình', experience: 8, rating: 4.6, education: 'ĐH Y Đà Nẵng', certification: 'Chuyên khoa Phục hình' },
  { id: 'D014', name: 'BS. Trương Thị Phượng', employeeCode: 'NV00000014', specialization: 'Răng sứ', experience: 10, rating: 4.8, education: 'ĐH Y Hà Nội', certification: 'Chứng chỉ Emax' },
  { id: 'D015', name: 'BS. Nguyễn Văn Quân', employeeCode: 'NV00000015', specialization: 'Nha chu', experience: 7, rating: 4.6, education: 'ĐH Y Cần Thơ', certification: 'Chuyên khoa Nha chu' },
  { id: 'D016', name: 'BS. Trần Văn Sơn', employeeCode: 'NV00000016', specialization: 'Implant', experience: 16, rating: 4.9, education: 'ĐH Y Hà Nội', certification: 'Tiến sĩ Implant' },
  { id: 'D017', name: 'BS. Lê Thị Tâm', employeeCode: 'NV00000017', specialization: 'Chỉnh nha', experience: 11, rating: 4.8, education: 'ĐH Y TP.HCM', certification: 'Thạc sĩ Chỉnh nha' },
  { id: 'D018', name: 'BS. Phạm Văn Út', employeeCode: 'NV00000018', specialization: 'Nội nha', experience: 9, rating: 4.7, education: 'ĐH Y Huế', certification: 'Chuyên khoa Nội nha' },
  { id: 'D019', name: 'BS. Hoàng Thị Vân', employeeCode: 'NV00000019', specialization: 'Thẩm mỹ', experience: 12, rating: 4.9, education: 'ĐH Y Hà Nội', certification: 'Chứng chỉ Veneer' },
  { id: 'D020', name: 'BS. Ngô Văn Xuân', employeeCode: 'NV00000020', specialization: 'Phẫu thuật', experience: 14, rating: 4.8, education: 'ĐH Y TP.HCM', certification: 'Chuyên khoa Phẫu thuật' },
  { id: 'D021', name: 'BS. Đỗ Thị Yến', employeeCode: 'NV00000021', specialization: 'Răng sứ', experience: 8, rating: 4.7, education: 'ĐH Y Đà Nẵng', certification: 'Chứng chỉ Răng sứ' },
  { id: 'D022', name: 'BS. Vũ Văn An', employeeCode: 'NV00000022', specialization: 'Tổng quát', experience: 6, rating: 4.5, education: 'ĐH Y Hải Phòng', certification: 'Bác sĩ đa khoa' },
  { id: 'D023', name: 'BS. Bùi Thị Bình', employeeCode: 'NV00000023', specialization: 'Nha khoa trẻ em', experience: 7, rating: 4.6, education: 'ĐH Y Hà Nội', certification: 'Chuyên khoa Nhi' },
  { id: 'D024', name: 'BS. Đặng Văn Chiến', employeeCode: 'NV00000024', specialization: 'Phục hình', experience: 10, rating: 4.7, education: 'ĐH Y TP.HCM', certification: 'Chuyên khoa Phục hình' },
  { id: 'D025', name: 'BS. Võ Thị Dung', employeeCode: 'NV00000025', specialization: 'Nha chu', experience: 9, rating: 4.6, education: 'ĐH Y Huế', certification: 'Chuyên khoa Nha chu' },
  { id: 'D026', name: 'BS. Phan Văn Đức', employeeCode: 'NV00000026', specialization: 'Implant', experience: 13, rating: 4.8, education: 'ĐH Y Hà Nội', certification: 'Chứng chỉ Implant' },
  { id: 'D027', name: 'BS. Lý Thị Hoa', employeeCode: 'NV00000027', specialization: 'Chỉnh nha', experience: 10, rating: 4.7, education: 'ĐH Y TP.HCM', certification: 'Chứng chỉ Chỉnh nha' },
  { id: 'D028', name: 'BS. Trương Văn Khánh', employeeCode: 'NV00000028', specialization: 'Thẩm mỹ', experience: 11, rating: 4.8, education: 'ĐH Y Hà Nội', certification: 'Thạc sĩ Thẩm mỹ' },
  { id: 'D029', name: 'BS. Nguyễn Thị Linh', employeeCode: 'NV00000029', specialization: 'Nội nha', experience: 8, rating: 4.6, education: 'ĐH Y Đà Nẵng', certification: 'Chuyên khoa Nội nha' },
  { id: 'D030', name: 'BS. Trần Văn Mạnh', employeeCode: 'NV00000030', specialization: 'Phẫu thuật', experience: 15, rating: 4.9, education: 'ĐH Y TP.HCM', certification: 'Tiến sĩ Phẫu thuật' }
];

// Services (Dịch vụ) - EXPANDED TO 50 SERVICES
const MOCK_SERVICES = [
  // Exam services (Dịch vụ khám) - 8 services
  { id: 'SV001', name: 'Khám tổng quát', type: 'exam', category: 'general', basePrice: 200000, duration: 30, popularity: 95, satisfaction: 4.8 },
  { id: 'SV002', name: 'Khám nha chu', type: 'exam', category: 'periodontics', basePrice: 300000, duration: 45, popularity: 82, satisfaction: 4.7 },
  { id: 'SV003', name: 'Khám chỉnh nha', type: 'exam', category: 'orthodontics', basePrice: 500000, duration: 60, popularity: 78, satisfaction: 4.9 },
  { id: 'SV004', name: 'Tư vấn implant', type: 'exam', category: 'implant', basePrice: 0, duration: 30, popularity: 65, satisfaction: 4.8 },
  { id: 'SV005', name: 'Khám răng trẻ em', type: 'exam', category: 'pediatric', basePrice: 250000, duration: 30, popularity: 88, satisfaction: 4.9 },
  { id: 'SV006', name: 'Khám định kỳ 6 tháng', type: 'exam', category: 'general', basePrice: 150000, duration: 20, popularity: 92, satisfaction: 4.7 },
  { id: 'SV007', name: 'Khám răng miệng tổng quát', type: 'exam', category: 'general', basePrice: 350000, duration: 40, popularity: 85, satisfaction: 4.8 },
  { id: 'SV008', name: 'Tư vấn thẩm mỹ răng', type: 'exam', category: 'cosmetic', basePrice: 0, duration: 45, popularity: 70, satisfaction: 4.9 },
  
  // High-value treatment services (Dịch vụ điều trị giá cao) - 15 services
  { id: 'SV009', name: 'Răng sứ thẩm mỹ Emax', type: 'treatment', category: 'cosmetic', basePrice: 6000000, duration: 120, popularity: 88, satisfaction: 4.9 },
  { id: 'SV010', name: 'Răng sứ Titan', type: 'treatment', category: 'cosmetic', basePrice: 3500000, duration: 90, popularity: 75, satisfaction: 4.7 },
  { id: 'SV011', name: 'Răng sứ Zirconia', type: 'treatment', category: 'cosmetic', basePrice: 5000000, duration: 110, popularity: 82, satisfaction: 4.8 },
  { id: 'SV012', name: 'Cấy ghép Implant Nobel', type: 'treatment', category: 'implant', basePrice: 18000000, duration: 180, popularity: 72, satisfaction: 4.9 },
  { id: 'SV013', name: 'Cấy ghép Implant Osstem', type: 'treatment', category: 'implant', basePrice: 12000000, duration: 150, popularity: 85, satisfaction: 4.8 },
  { id: 'SV014', name: 'Cấy ghép Implant Straumann', type: 'treatment', category: 'implant', basePrice: 25000000, duration: 200, popularity: 65, satisfaction: 4.9 },
  { id: 'SV015', name: 'Niềng răng Invisalign', type: 'treatment', category: 'orthodontics', basePrice: 85000000, duration: 90, popularity: 68, satisfaction: 4.9 },
  { id: 'SV016', name: 'Niềng răng mắc cài kim loại', type: 'treatment', category: 'orthodontics', basePrice: 35000000, duration: 90, popularity: 78, satisfaction: 4.7 },
  { id: 'SV017', name: 'Niềng răng mắc cài sứ', type: 'treatment', category: 'orthodontics', basePrice: 45000000, duration: 90, popularity: 72, satisfaction: 4.8 },
  { id: 'SV018', name: 'Niềng răng mắc cài tự đóng', type: 'treatment', category: 'orthodontics', basePrice: 55000000, duration: 95, popularity: 70, satisfaction: 4.8 },
  { id: 'SV019', name: 'Cấy ghép xương hàm', type: 'treatment', category: 'implant', basePrice: 15000000, duration: 150, popularity: 60, satisfaction: 4.7 },
  { id: 'SV020', name: 'Nâng xoang hàm', type: 'treatment', category: 'implant', basePrice: 20000000, duration: 180, popularity: 55, satisfaction: 4.8 },
  { id: 'SV021', name: 'Trồng răng toàn hàm', type: 'treatment', category: 'implant', basePrice: 120000000, duration: 240, popularity: 45, satisfaction: 4.9 },
  { id: 'SV022', name: 'Phục hình All-on-4', type: 'treatment', category: 'implant', basePrice: 150000000, duration: 300, popularity: 42, satisfaction: 4.9 },
  { id: 'SV023', name: 'Phục hình All-on-6', type: 'treatment', category: 'implant', basePrice: 180000000, duration: 320, popularity: 38, satisfaction: 4.9 },
  
  // Medium-value treatment services (Dịch vụ điều trị giá trung bình) - 12 services
  { id: 'SV024', name: 'Tẩy trắng răng Laser', type: 'treatment', category: 'cosmetic', basePrice: 4000000, duration: 90, popularity: 85, satisfaction: 4.8 },
  { id: 'SV025', name: 'Tẩy trắng răng tại nhà', type: 'treatment', category: 'cosmetic', basePrice: 2500000, duration: 60, popularity: 78, satisfaction: 4.7 },
  { id: 'SV026', name: 'Bọc răng sứ toàn phần', type: 'treatment', category: 'cosmetic', basePrice: 4500000, duration: 120, popularity: 72, satisfaction: 4.7 },
  { id: 'SV027', name: 'Veneer sứ', type: 'treatment', category: 'cosmetic', basePrice: 5500000, duration: 90, popularity: 80, satisfaction: 4.8 },
  { id: 'SV028', name: 'Điều trị tủy răng hàm', type: 'treatment', category: 'endodontics', basePrice: 2500000, duration: 90, popularity: 75, satisfaction: 4.6 },
  { id: 'SV029', name: 'Điều trị tủy răng cửa', type: 'treatment', category: 'endodontics', basePrice: 1800000, duration: 60, popularity: 68, satisfaction: 4.6 },
  { id: 'SV030', name: 'Điều trị tủy răng tiền hàm', type: 'treatment', category: 'endodontics', basePrice: 2000000, duration: 75, popularity: 65, satisfaction: 4.6 },
  { id: 'SV031', name: 'Mão răng sứ kim loại', type: 'treatment', category: 'restorative', basePrice: 2800000, duration: 80, popularity: 70, satisfaction: 4.5 },
  { id: 'SV032', name: 'Cầu răng sứ 3 đơn vị', type: 'treatment', category: 'restorative', basePrice: 8500000, duration: 130, popularity: 62, satisfaction: 4.7 },
  { id: 'SV033', name: 'Phục hình hàm tháo lắp', type: 'treatment', category: 'restorative', basePrice: 12000000, duration: 100, popularity: 55, satisfaction: 4.5 },
  { id: 'SV034', name: 'Hàm tháo lắp toàn phần', type: 'treatment', category: 'restorative', basePrice: 15000000, duration: 120, popularity: 48, satisfaction: 4.6 },
  { id: 'SV035', name: 'Hàm tháo lắp một phần', type: 'treatment', category: 'restorative', basePrice: 8000000, duration: 90, popularity: 52, satisfaction: 4.5 },
  
  // Low-value treatment services (Dịch vụ điều trị giá thấp) - 15 services
  { id: 'SV036', name: 'Nhổ răng khôn', type: 'treatment', category: 'surgery', basePrice: 1500000, duration: 45, popularity: 82, satisfaction: 4.5 },
  { id: 'SV037', name: 'Nhổ răng sữa', type: 'treatment', category: 'pediatric', basePrice: 300000, duration: 20, popularity: 88, satisfaction: 4.7 },
  { id: 'SV038', name: 'Nhổ răng thường', type: 'treatment', category: 'surgery', basePrice: 500000, duration: 30, popularity: 78, satisfaction: 4.5 },
  { id: 'SV039', name: 'Nhổ răng khôn mọc lệch', type: 'treatment', category: 'surgery', basePrice: 2500000, duration: 60, popularity: 65, satisfaction: 4.6 },
  { id: 'SV040', name: 'Trám răng Composite', type: 'treatment', category: 'restorative', basePrice: 600000, duration: 45, popularity: 92, satisfaction: 4.7 },
  { id: 'SV041', name: 'Trám răng GIC', type: 'treatment', category: 'restorative', basePrice: 400000, duration: 30, popularity: 85, satisfaction: 4.5 },
  { id: 'SV042', name: 'Trám răng Amalgam', type: 'treatment', category: 'restorative', basePrice: 350000, duration: 30, popularity: 72, satisfaction: 4.4 },
  { id: 'SV043', name: 'Lấy cao răng 1 hàm', type: 'treatment', category: 'periodontics', basePrice: 500000, duration: 45, popularity: 88, satisfaction: 4.6 },
  { id: 'SV044', name: 'Lấy cao răng toàn hàm', type: 'treatment', category: 'periodontics', basePrice: 800000, duration: 60, popularity: 90, satisfaction: 4.7 },
  { id: 'SV045', name: 'Cạo vôi răng', type: 'treatment', category: 'periodontics', basePrice: 350000, duration: 30, popularity: 85, satisfaction: 4.6 },
  { id: 'SV046', name: 'Làm sạch răng sâu', type: 'treatment', category: 'periodontics', basePrice: 800000, duration: 60, popularity: 75, satisfaction: 4.6 },
  { id: 'SV047', name: 'Phủ Flour cho trẻ', type: 'treatment', category: 'pediatric', basePrice: 200000, duration: 20, popularity: 90, satisfaction: 4.8 },
  { id: 'SV048', name: 'Bít hố rãnh phòng sâu răng', type: 'treatment', category: 'pediatric', basePrice: 300000, duration: 25, popularity: 88, satisfaction: 4.7 },
  { id: 'SV049', name: 'Điều trị viêm nướu', type: 'treatment', category: 'periodontics', basePrice: 600000, duration: 40, popularity: 80, satisfaction: 4.6 },
  { id: 'SV050', name: 'Điều trị viêm quanh răng', type: 'treatment', category: 'periodontics', basePrice: 1200000, duration: 60, popularity: 68, satisfaction: 4.6 }
];

// Generate revenue data for dentist
const generateDentistRevenue = (dentistId, days = 30) => {
  const dentist = MOCK_DENTISTS.find(d => d.id === dentistId);
  if (!dentist) return null;
  
  // Base revenue tùy theo chuyên môn
  let baseRevenue;
  switch (dentist.specialization) {
    case 'Implant': baseRevenue = 25000000; break;
    case 'Chỉnh nha': baseRevenue = 22000000; break;
    case 'Răng sứ': baseRevenue = 20000000; break;
    case 'Phục hình': baseRevenue = 18000000; break;
    case 'Thẩm mỹ': baseRevenue = 16000000; break;
    case 'Nội nha': baseRevenue = 12000000; break;
    case 'Nha chu': baseRevenue = 10000000; break;
    default: baseRevenue = 8000000;
  }
  
  const dailyRevenue = [];
  for (let i = 0; i < days; i++) {
    const variation = 0.7 + Math.random() * 0.6; // 70-130%
    dailyRevenue.push(Math.floor(baseRevenue / 30 * variation));
  }
  
  const totalRevenue = dailyRevenue.reduce((sum, val) => sum + val, 0);
  const appointmentCount = Math.floor(totalRevenue / (baseRevenue / 30) * 4); // ~4 appointments per day revenue
  
  return {
    dentistId: dentist.id,
    dentistName: dentist.name,
    specialization: dentist.specialization,
    totalRevenue,
    appointmentCount,
    serviceCount: appointmentCount + getRandomNumber(10, 30), // Some have additional services
    avgRevenuePerAppointment: Math.floor(totalRevenue / appointmentCount),
    dailyData: dailyRevenue
  };
};

// Generate revenue data for service
const generateServiceRevenue = (serviceId, days = 30) => {
  const service = MOCK_SERVICES.find(s => s.id === serviceId);
  if (!service) return null;
  
  // Exam services: nhiều lượt nhưng giá thấp
  // Treatment services: ít lượt nhưng giá cao
  const countPerDay = service.type === 'exam' 
    ? getRandomNumber(3, 8) 
    : getRandomNumber(1, 3);
  
  const dailyData = [];
  let totalCount = 0;
  let totalRevenue = 0;
  
  for (let i = 0; i < days; i++) {
    const count = Math.floor(countPerDay * (0.7 + Math.random() * 0.6));
    const priceVariation = 0.9 + Math.random() * 0.2; // ±10%
    const revenue = count * service.basePrice * priceVariation;
    
    dailyData.push({
      count,
      revenue: Math.floor(revenue)
    });
    
    totalCount += count;
    totalRevenue += revenue;
  }
  
  return {
    serviceId: service.id,
    serviceName: service.name,
    serviceType: service.type,
    totalRevenue: Math.floor(totalRevenue),
    totalCount,
    avgRevenuePerService: totalCount > 0 ? Math.floor(totalRevenue / totalCount) : 0,
    dailyData
  };
};

// ==================== API 1: REVENUE STATISTICS ====================

/**
 * Lấy thống kê doanh thu
 * @param {Object} params - { startDate, endDate, groupBy, dentistId, serviceId, dentists, services }
 */
export const getRevenueStatistics = async (params = {}) => {
  try {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day',
      dentistId = null,
      serviceId = null,
      dentists = [], // Truyền vào từ component (đã load sẵn)
      services = []  // Truyền vào từ component (đã load sẵn)
    } = params;
    
    // Build query params
    const queryParams = new URLSearchParams({
      groupBy
    });
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (dentistId) queryParams.append('dentistId', dentistId);
    if (serviceId) queryParams.append('serviceId', serviceId);
    
    // Call real backend API
    const response = await statisticApi.get(`/statistics/revenue?${queryParams.toString()}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể lấy thống kê doanh thu');
    }
    
    // Transform backend data to match frontend expectations
    const backendData = response.data.data;
    
    // Create lookup maps for fast access
    const dentistMap = new Map(dentists.map(d => [d._id, d]));
    const serviceMap = new Map();
    services.forEach(service => {
      // Add parent service
      serviceMap.set(service._id, service);
      // Add all service addons
      if (service.serviceAddOns && Array.isArray(service.serviceAddOns)) {
        service.serviceAddOns.forEach(addon => {
          serviceMap.set(addon._id, { ...addon, parentName: service.name });
        });
      }
    });
    
    // Map backend structure to frontend structure
    return {
      success: true,
      data: {
        summary: {
          totalRevenue: backendData.summary?.totalRevenue || 0,
          totalAppointments: backendData.summary?.totalInvoices || 0,
          totalServices: backendData.byService?.length || 0,
          avgRevenuePerAppointment: backendData.summary?.averageValue || 0,
          period: backendData.period || {}
        },
        // Enrich byDentist với thông tin từ API /api/user/all-staff
        revenueByDentist: (backendData.byDentist || []).map(dentist => {
          const dentistInfo = dentistMap.get(dentist.dentistId);
          return {
            dentistId: dentist.dentistId,
            dentistName: dentistInfo 
              ? `${dentistInfo.fullName} (${dentistInfo.employeeCode})` 
              : `Nha sỹ ${dentist.dentistId.slice(-4)}`,
            specialization: dentistInfo?.specialization || 'Tổng quát',
            totalRevenue: dentist.totalRevenue || 0,
            appointmentCount: dentist.appointmentCount || 0,
            serviceCount: dentist.serviceCount || 0,
            avgRevenuePerAppointment: dentist.avgRevenuePerAppointment || 0,
            // Thêm thông tin từ API
            dentistFullName: dentistInfo?.fullName || 'N/A',
            dentistEmployeeCode: dentistInfo?.employeeCode || null,
            dentistEmail: dentistInfo?.email || null,
            dentistPhone: dentistInfo?.phone || null
          };
        }),
        // Enrich byService với thông tin từ API /api/service
        revenueByService: (backendData.byService || [])
          .filter(service => service.totalRevenue > 0 && service.serviceId) // ✅ Chỉ hiển thị services có revenue > 0 VÀ có serviceId
          .map(service => {
            const serviceInfo = serviceMap.get(service.serviceId);
            return {
              serviceId: service.serviceId,
              serviceName: service.serviceName || (serviceInfo?.name || 'Dịch vụ không xác định'),
              serviceType: service.serviceType || (serviceInfo?.type || 'unknown'),
              totalRevenue: service.totalRevenue || 0,
              totalCount: service.totalCount || 0,
              avgRevenuePerService: service.avgRevenuePerService || 0,
              // Thêm thông tin từ API
              servicePrice: serviceInfo?.price || serviceInfo?.basePrice || 0,
              serviceDuration: serviceInfo?.durationMinutes || 0,
              serviceParent: serviceInfo?.parentName || null
            };
          }),
        // Map trends to revenueByTime
        revenueByTime: (backendData.trends || []).map(trend => ({
          date: trend.date,
          revenue: trend.revenue || 0,
          count: trend.count || 0
        })),
        // ✅ Map rawDetails for cross-filtering
        rawDetails: (backendData.rawDetails || []).map(detail => ({
          dentistId: detail.dentistId,
          serviceId: detail.serviceId,
          revenue: detail.revenue || 0,
          count: detail.count || 0,
          invoiceCount: detail.invoiceCount || 0
        })),
        // Comparison data - ✅ Filter giống revenueByService
        comparison: (backendData.byService || [])
          .filter(s => s.totalRevenue > 0 && s.serviceId) // ✅ Chỉ hiển thị services có revenue > 0 VÀ có serviceId
          .map(s => ({
            name: s.serviceName,
            type: s.serviceType,
            count: s.totalCount || 0,
            revenue: s.totalRevenue || 0,
            avgRevenue: s.avgRevenuePerService || 0
          }))
      }
    };
  } catch (error) {
    console.error('Error fetching revenue statistics:', error);
    throw error;
  }
};

// ==================== API 2: BOOKING CHANNEL STATISTICS ====================

/**
 * Lấy thống kê Online vs Offline appointments
 * @param {Object} params - { startDate, endDate, groupBy }
 */
export const getBookingChannelStatistics = async (params = {}) => {
  try {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day'
    } = params;

    if (!startDate || !endDate) {
      throw new Error('startDate và endDate là bắt buộc');
    }

    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      groupBy
    });

    const response = await appointmentApi.get(`/appointments/booking-channel-stats?${queryParams.toString()}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể lấy thống kê kênh đặt hẹn');
    }

    const backendData = response.data.data;

    // Role name mapping
    const roleNames = {
      receptionist: 'Lễ tân',
      admin: 'Quản trị viên',
      manager: 'Quản lý'
    };

    return {
      success: true,
      data: {
        summary: backendData.summary || {},
        trend: backendData.trends || [],
        offlineByRole: (backendData.offlineByRole || []).map(item => ({
          role: item.role,
          name: roleNames[item.role] || item.role,
          count: item.count || 0,
          percentage: parseFloat(item.percentage) || 0
        })),
        topStaff: (backendData.topStaff || []).map(item => ({
          staffId: item.staffId,
          name: `Staff ${item.staffId.slice(-6)}`, // Show last 6 chars of ID
          role: item.role,
          roleName: roleNames[item.role] || item.role,
          count: item.count || 0,
          completionRate: parseFloat(item.completionRate) || 0
        }))
      }
    };
  } catch (error) {
    console.error('Error fetching booking channel statistics:', error);
    throw error;
  }
};

// ==================== API 3: PATIENT RETENTION STATISTICS ====================

/**
 * Lấy thống kê bệnh nhân quay lại
 * @param {Object} params - { startDate, endDate, groupBy }
 */
export const getPatientRetentionStatistics = async (params = {}) => {
  const { 
    startDate, 
    endDate, 
    groupBy = 'day'
  } = params;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Calculate date range
      let dates;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        dates = generateDateRange(diffDays, startDate);
      } else {
        dates = generateDateRange(30);
      }
      
      // Generate daily new vs returning patients
      const dailyData = dates.map(date => {
        const d = new Date(date);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const multiplier = isWeekend ? 0.6 : 1.0;
        
        // New patients: 20-30% of total
        const newPatients = Math.floor(getRandomNumber(2, 5) * multiplier);
        // Returning patients: 70-80% of total
        const returningPatients = Math.floor(getRandomNumber(8, 15) * multiplier);
        
        return { date, new: newPatients, returning: returningPatients };
      });
      
      const totalNew = dailyData.reduce((sum, d) => sum + d.new, 0);
      const totalReturning = dailyData.reduce((sum, d) => sum + d.returning, 0);
      const total = totalNew + totalReturning;
      
      // Top loyal patients - EXPANDED TO 100 PATIENTS
      const loyalPatients = [
        { patientId: 'P001', name: 'Nguyễn Văn Anh', phone: '0901234567', email: 'nva@email.com', totalVisits: 28, totalSpent: 145000000, firstVisit: '2022-11-15', lastVisit: '2024-11-05', frequency: 2.8, avgSpent: 5178571, loyaltyTier: 'VIP' },
        { patientId: 'P002', name: 'Trần Thị Bảo', phone: '0907654321', email: 'ttb@email.com', totalVisits: 24, totalSpent: 128000000, firstVisit: '2023-01-20', lastVisit: '2024-11-03', frequency: 2.4, avgSpent: 5333333, loyaltyTier: 'VIP' },
        { patientId: 'P003', name: 'Lê Văn Cường', phone: '0912345678', email: 'lvc@email.com', totalVisits: 22, totalSpent: 115000000, firstVisit: '2023-02-10', lastVisit: '2024-10-28', frequency: 2.2, avgSpent: 5227273, loyaltyTier: 'VIP' },
        { patientId: 'P004', name: 'Phạm Thị Diệu', phone: '0923456789', email: 'ptd@email.com', totalVisits: 20, totalSpent: 98000000, firstVisit: '2023-03-15', lastVisit: '2024-10-25', frequency: 2.0, avgSpent: 4900000, loyaltyTier: 'Platinum' },
        { patientId: 'P005', name: 'Hoàng Văn Em', phone: '0934567890', email: 'hve@email.com', totalVisits: 19, totalSpent: 92000000, firstVisit: '2023-04-20', lastVisit: '2024-10-20', frequency: 1.9, avgSpent: 4842105, loyaltyTier: 'Platinum' },
        { patientId: 'P006', name: 'Ngô Thị Phương', phone: '0945678901', email: 'ntp@email.com', totalVisits: 18, totalSpent: 87000000, firstVisit: '2023-04-25', lastVisit: '2024-10-18', frequency: 1.8, avgSpent: 4833333, loyaltyTier: 'Platinum' },
        { patientId: 'P007', name: 'Đỗ Văn Giang', phone: '0956789012', email: 'dvg@email.com', totalVisits: 17, totalSpent: 82000000, firstVisit: '2023-05-10', lastVisit: '2024-10-15', frequency: 1.7, avgSpent: 4823529, loyaltyTier: 'Platinum' },
        { patientId: 'P008', name: 'Vũ Thị Hương', phone: '0967890123', email: 'vth@email.com', totalVisits: 16, totalSpent: 78000000, firstVisit: '2023-05-15', lastVisit: '2024-10-12', frequency: 1.6, avgSpent: 4875000, loyaltyTier: 'Platinum' },
        { patientId: 'P009', name: 'Bùi Văn Khôi', phone: '0978901234', email: 'bvk@email.com', totalVisits: 15, totalSpent: 74000000, firstVisit: '2023-06-01', lastVisit: '2024-10-10', frequency: 1.5, avgSpent: 4933333, loyaltyTier: 'Gold' },
        { patientId: 'P010', name: 'Đặng Thị Lan', phone: '0989012345', email: 'dtl@email.com', totalVisits: 15, totalSpent: 72000000, firstVisit: '2023-06-10', lastVisit: '2024-10-08', frequency: 1.5, avgSpent: 4800000, loyaltyTier: 'Gold' },
        { patientId: 'P011', name: 'Võ Văn Minh', phone: '0990123456', email: 'vvm@email.com', totalVisits: 14, totalSpent: 68000000, firstVisit: '2023-06-20', lastVisit: '2024-10-05', frequency: 1.4, avgSpent: 4857143, loyaltyTier: 'Gold' },
        { patientId: 'P012', name: 'Phan Thị Ngọc', phone: '0901234568', email: 'ptn@email.com', totalVisits: 14, totalSpent: 66000000, firstVisit: '2023-07-01', lastVisit: '2024-10-03', frequency: 1.4, avgSpent: 4714286, loyaltyTier: 'Gold' },
        { patientId: 'P013', name: 'Lý Văn Ông', phone: '0912345679', email: 'lvo@email.com', totalVisits: 13, totalSpent: 64000000, firstVisit: '2023-07-15', lastVisit: '2024-10-01', frequency: 1.3, avgSpent: 4923077, loyaltyTier: 'Gold' },
        { patientId: 'P014', name: 'Trương Thị Phượng', phone: '0923456780', email: 'ttp@email.com', totalVisits: 13, totalSpent: 62000000, firstVisit: '2023-07-20', lastVisit: '2024-09-28', frequency: 1.3, avgSpent: 4769231, loyaltyTier: 'Gold' },
        { patientId: 'P015', name: 'Nguyễn Văn Quân', phone: '0934567891', email: 'nvq@email.com', totalVisits: 12, totalSpent: 58000000, firstVisit: '2023-08-01', lastVisit: '2024-09-25', frequency: 1.2, avgSpent: 4833333, loyaltyTier: 'Gold' },
        { patientId: 'P016', name: 'Trần Thị Rồng', phone: '0945678902', totalVisits: 12, totalSpent: 56000000, firstVisit: '2023-08-10', lastVisit: '2024-09-22', frequency: 1.2 },
        { patientId: 'P017', name: 'Lê Văn Sơn', phone: '0956789013', totalVisits: 11, totalSpent: 54000000, firstVisit: '2023-08-20', lastVisit: '2024-09-20', frequency: 1.1 },
        { patientId: 'P018', name: 'Phạm Thị Tâm', phone: '0967890124', totalVisits: 11, totalSpent: 52000000, firstVisit: '2023-09-01', lastVisit: '2024-09-18', frequency: 1.1 },
        { patientId: 'P019', name: 'Hoàng Văn Út', phone: '0978901235', totalVisits: 10, totalSpent: 48000000, firstVisit: '2023-09-10', lastVisit: '2024-09-15', frequency: 1.0 },
        { patientId: 'P020', name: 'Ngô Thị Vân', phone: '0989012346', totalVisits: 10, totalSpent: 46000000, firstVisit: '2023-09-15', lastVisit: '2024-09-12', frequency: 1.0 },
        { patientId: 'P021', name: 'Đỗ Văn Xuân', phone: '0990123457', totalVisits: 9, totalSpent: 44000000, firstVisit: '2023-09-25', lastVisit: '2024-09-10', frequency: 0.9 },
        { patientId: 'P022', name: 'Vũ Thị Yến', phone: '0901234569', totalVisits: 9, totalSpent: 42000000, firstVisit: '2023-10-01', lastVisit: '2024-09-08', frequency: 0.9 },
        { patientId: 'P023', name: 'Bùi Văn An', phone: '0912345680', totalVisits: 9, totalSpent: 40000000, firstVisit: '2023-10-10', lastVisit: '2024-09-05', frequency: 0.9 },
        { patientId: 'P024', name: 'Đặng Thị Bình', phone: '0923456781', totalVisits: 8, totalSpent: 38000000, firstVisit: '2023-10-15', lastVisit: '2024-09-03', frequency: 0.8 },
        { patientId: 'P025', name: 'Võ Văn Chiến', phone: '0934567892', totalVisits: 8, totalSpent: 36000000, firstVisit: '2023-10-20', lastVisit: '2024-09-01', frequency: 0.8 },
        { patientId: 'P026', name: 'Phan Thị Dung', phone: '0945678903', totalVisits: 8, totalSpent: 35000000, firstVisit: '2023-11-01', lastVisit: '2024-08-28', frequency: 0.8 },
        { patientId: 'P027', name: 'Lý Văn Đức', phone: '0956789014', totalVisits: 7, totalSpent: 33000000, firstVisit: '2023-11-05', lastVisit: '2024-08-25', frequency: 0.7 },
        { patientId: 'P028', name: 'Trương Thị Hoa', phone: '0967890125', totalVisits: 7, totalSpent: 32000000, firstVisit: '2023-11-10', lastVisit: '2024-08-22', frequency: 0.7 },
        { patientId: 'P029', name: 'Nguyễn Văn Khánh', phone: '0978901236', totalVisits: 7, totalSpent: 30000000, firstVisit: '2023-11-15', lastVisit: '2024-08-20', frequency: 0.7 },
        { patientId: 'P030', name: 'Trần Thị Linh', phone: '0989012347', totalVisits: 6, totalSpent: 28000000, firstVisit: '2023-11-20', lastVisit: '2024-08-18', frequency: 0.6 },
        { patientId: 'P031', name: 'Lê Văn Mạnh', phone: '0990123458', totalVisits: 6, totalSpent: 27000000, firstVisit: '2023-12-01', lastVisit: '2024-08-15', frequency: 0.6 },
        { patientId: 'P032', name: 'Phạm Thị Nam', phone: '0901234570', totalVisits: 6, totalSpent: 26000000, firstVisit: '2023-12-05', lastVisit: '2024-08-12', frequency: 0.6 },
        { patientId: 'P033', name: 'Hoàng Văn Phong', phone: '0912345681', totalVisits: 6, totalSpent: 25000000, firstVisit: '2023-12-10', lastVisit: '2024-08-10', frequency: 0.6 },
        { patientId: 'P034', name: 'Ngô Thị Quỳnh', phone: '0923456782', totalVisits: 5, totalSpent: 24000000, firstVisit: '2023-12-15', lastVisit: '2024-08-08', frequency: 0.5 },
        { patientId: 'P035', name: 'Đỗ Văn Sáng', phone: '0934567893', totalVisits: 5, totalSpent: 23000000, firstVisit: '2023-12-20', lastVisit: '2024-08-05', frequency: 0.5 },
        { patientId: 'P036', name: 'Vũ Thị Thảo', phone: '0945678904', totalVisits: 5, totalSpent: 22000000, firstVisit: '2024-01-05', lastVisit: '2024-08-03', frequency: 0.5 },
        { patientId: 'P037', name: 'Bùi Văn Tuấn', phone: '0956789015', totalVisits: 5, totalSpent: 21000000, firstVisit: '2024-01-10', lastVisit: '2024-08-01', frequency: 0.5 },
        { patientId: 'P038', name: 'Đặng Thị Uyên', phone: '0967890126', totalVisits: 4, totalSpent: 20000000, firstVisit: '2024-01-15', lastVisit: '2024-07-28', frequency: 0.4 },
        { patientId: 'P039', name: 'Võ Văn Vinh', phone: '0978901237', totalVisits: 4, totalSpent: 19000000, firstVisit: '2024-01-20', lastVisit: '2024-07-25', frequency: 0.4 },
        { patientId: 'P040', name: 'Phan Thị Xuân', phone: '0989012348', totalVisits: 4, totalSpent: 18000000, firstVisit: '2024-02-01', lastVisit: '2024-07-22', frequency: 0.4 },
        { patientId: 'P041', name: 'Lý Văn Dũng', phone: '0990123459', totalVisits: 4, totalSpent: 17500000, firstVisit: '2024-02-05', lastVisit: '2024-07-20', frequency: 0.4 },
        { patientId: 'P042', name: 'Trương Thị Ánh', phone: '0901234571', totalVisits: 4, totalSpent: 17000000, firstVisit: '2024-02-10', lastVisit: '2024-07-18', frequency: 0.4 },
        { patientId: 'P043', name: 'Nguyễn Văn Bằng', phone: '0912345682', totalVisits: 3, totalSpent: 16000000, firstVisit: '2024-02-15', lastVisit: '2024-07-15', frequency: 0.3 },
        { patientId: 'P044', name: 'Trần Thị Cúc', phone: '0923456783', totalVisits: 3, totalSpent: 15500000, firstVisit: '2024-02-20', lastVisit: '2024-07-12', frequency: 0.3 },
        { patientId: 'P045', name: 'Lê Văn Đạt', phone: '0934567894', totalVisits: 3, totalSpent: 15000000, firstVisit: '2024-03-01', lastVisit: '2024-07-10', frequency: 0.3 },
        { patientId: 'P046', name: 'Phạm Thị Hằng', phone: '0945678905', totalVisits: 3, totalSpent: 14500000, firstVisit: '2024-03-05', lastVisit: '2024-07-08', frequency: 0.3 },
        { patientId: 'P047', name: 'Hoàng Văn Kiên', phone: '0956789016', totalVisits: 3, totalSpent: 14000000, firstVisit: '2024-03-10', lastVisit: '2024-07-05', frequency: 0.3 },
        { patientId: 'P048', name: 'Ngô Thị Mai', phone: '0967890127', totalVisits: 2, totalSpent: 13000000, firstVisit: '2024-03-15', lastVisit: '2024-07-03', frequency: 0.2 },
        { patientId: 'P049', name: 'Đỗ Văn Nhân', phone: '0978901238', totalVisits: 2, totalSpent: 12500000, firstVisit: '2024-03-20', lastVisit: '2024-07-01', frequency: 0.2 },
        { patientId: 'P050', name: 'Vũ Thị Oanh', phone: '0989012349', totalVisits: 2, totalSpent: 12000000, firstVisit: '2024-04-01', lastVisit: '2024-06-28', frequency: 0.2 }
      ];
      
      // Calculate CLV
      const avgCLV = loyalPatients.reduce((sum, p) => sum + p.totalSpent, 0) / loyalPatients.length;
      
      // Retention & Churn rate
      const retentionRate = ((totalReturning / total) * 100).toFixed(1);
      const churnRate = (100 - retentionRate).toFixed(1);
      
      // Group by period
      const groupedData = groupBy === 'day' 
        ? dailyData 
        : groupByPeriod(
            dates,
            dailyData.map(d => d.new + d.returning),
            groupBy
          ).map((item, i) => {
            const newRatio = totalNew / total;
            return {
              date: item.date,
              new: Math.floor(item.value * newRatio),
              returning: item.value - Math.floor(item.value * newRatio)
            };
          });
      
      resolve({
        success: true,
        data: {
          summary: {
            total,
            newPatients: {
              count: totalNew,
              percentage: ((totalNew / total) * 100).toFixed(1),
              avgPerDay: (totalNew / dates.length).toFixed(1)
            },
            returningPatients: {
              count: totalReturning,
              percentage: ((totalReturning / total) * 100).toFixed(1),
              avgPerDay: (totalReturning / dates.length).toFixed(1)
            },
            retentionRate: parseFloat(retentionRate),
            churnRate: parseFloat(churnRate),
            avgCLV: Math.floor(avgCLV),
            period: {
              startDate: dates[0],
              endDate: dates[dates.length - 1],
              days: dates.length
            }
          },
          trend: groupedData,
          loyalPatients,
          // Cohort analysis (monthly retention) - EXPANDED to 12 months
          cohortAnalysis: [
            { month: '2023-12', newPatients: 38, withSecondVisit: 25, retentionRate: 65.8 },
            { month: '2024-01', newPatients: 45, withSecondVisit: 32, retentionRate: 71.1 },
            { month: '2024-02', newPatients: 52, withSecondVisit: 38, retentionRate: 73.1 },
            { month: '2024-03', newPatients: 48, withSecondVisit: 36, retentionRate: 75.0 },
            { month: '2024-04', newPatients: 55, withSecondVisit: 43, retentionRate: 78.2 },
            { month: '2024-05', newPatients: 50, withSecondVisit: 39, retentionRate: 78.0 },
            { month: '2024-06', newPatients: 58, withSecondVisit: 47, retentionRate: 81.0 },
            { month: '2024-07', newPatients: 62, withSecondVisit: 51, retentionRate: 82.3 },
            { month: '2024-08', newPatients: 54, withSecondVisit: 45, retentionRate: 83.3 },
            { month: '2024-09', newPatients: 60, withSecondVisit: 51, retentionRate: 85.0 },
            { month: '2024-10', newPatients: 57, withSecondVisit: 49, retentionRate: 86.0 },
            { month: '2024-11', newPatients: 48, withSecondVisit: 42, retentionRate: 87.5 }
          ],
          // Patient segment analysis
          segmentAnalysis: [
            { 
              segment: 'VIP (10+ visits)', 
              count: 250, 
              percentage: 12.5, 
              avgSpent: 58000000, 
              totalRevenue: 14500000000,
              retention: 95.2
            },
            { 
              segment: 'Loyal (5-9 visits)', 
              count: 420, 
              percentage: 21.0, 
              avgSpent: 28000000, 
              totalRevenue: 11760000000,
              retention: 87.8
            },
            { 
              segment: 'Regular (2-4 visits)', 
              count: 680, 
              percentage: 34.0, 
              avgSpent: 12000000, 
              totalRevenue: 8160000000,
              retention: 72.5
            },
            { 
              segment: 'One-time', 
              count: 650, 
              percentage: 32.5, 
              avgSpent: 3500000, 
              totalRevenue: 2275000000,
              retention: 18.2
            }
          ],
          // Churn risk analysis
          churnRiskAnalysis: [
            { 
              riskLevel: 'High Risk', 
              count: 180, 
              lastVisit: '> 6 months ago',
              avgDaysSinceVisit: 210,
              potentialRevenueLoss: 450000000
            },
            { 
              riskLevel: 'Medium Risk', 
              count: 320, 
              lastVisit: '3-6 months ago',
              avgDaysSinceVisit: 135,
              potentialRevenueLoss: 640000000
            },
            { 
              riskLevel: 'Low Risk', 
              count: 450, 
              lastVisit: '< 3 months ago',
              avgDaysSinceVisit: 45,
              potentialRevenueLoss: 180000000
            }
          ]
        }
      });
    }, 800);
  });
};

// ==================== API 4: APPOINTMENT STATISTICS ====================

/**
 * Lấy thống kê lịch hẹn
 * @param {Object} params - { startDate, endDate, groupBy, status }
 */
export const getAppointmentStatistics = async (params = {}) => {
  const { startDate, endDate, groupBy = 'day', status = null } = params;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      let dates;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        dates = generateDateRange(diffDays, startDate);
      } else {
        dates = generateDateRange(30);
      }
      
      // Generate daily appointment data
      const dailyData = dates.map(date => {
        const d = new Date(date);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const multiplier = isWeekend ? 0.4 : 1.0;
        
        const total = Math.floor(getRandomNumber(15, 25) * multiplier);
        const completed = Math.floor(total * 0.87);
        const cancelled = Math.floor(total * 0.08);
        const noShow = total - completed - cancelled;
        
        return { date, total, completed, cancelled, noShow };
      });
      
      const totalAppointments = dailyData.reduce((sum, d) => sum + d.total, 0);
      const totalCompleted = dailyData.reduce((sum, d) => sum + d.completed, 0);
      const totalCancelled = dailyData.reduce((sum, d) => sum + d.cancelled, 0);
      const totalNoShow = dailyData.reduce((sum, d) => sum + d.noShow, 0);
      
      // Appointment by time slot
      const byTimeSlot = [
        { timeSlot: '08:00-09:00', count: Math.floor(totalAppointments * 0.08) },
        { timeSlot: '09:00-10:00', count: Math.floor(totalAppointments * 0.12) },
        { timeSlot: '10:00-11:00', count: Math.floor(totalAppointments * 0.11) },
        { timeSlot: '11:00-12:00', count: Math.floor(totalAppointments * 0.09) },
        { timeSlot: '13:00-14:00', count: Math.floor(totalAppointments * 0.07) },
        { timeSlot: '14:00-15:00', count: Math.floor(totalAppointments * 0.13) },
        { timeSlot: '15:00-16:00', count: Math.floor(totalAppointments * 0.12) },
        { timeSlot: '16:00-17:00', count: Math.floor(totalAppointments * 0.14) },
        { timeSlot: '17:00-18:00', count: Math.floor(totalAppointments * 0.14) }
      ];
      
      resolve({
        success: true,
        data: {
          summary: {
            total: totalAppointments,
            completed: totalCompleted,
            cancelled: totalCancelled,
            noShow: totalNoShow,
            completionRate: ((totalCompleted / totalAppointments) * 100).toFixed(1),
            cancellationRate: ((totalCancelled / totalAppointments) * 100).toFixed(1),
            noShowRate: ((totalNoShow / totalAppointments) * 100).toFixed(1)
          },
          trend: dailyData,
          byTimeSlot,
          byDayOfWeek: [
            { day: 'Mon', count: Math.floor(totalAppointments * 0.16) },
            { day: 'Tue', count: Math.floor(totalAppointments * 0.17) },
            { day: 'Wed', count: Math.floor(totalAppointments * 0.18) },
            { day: 'Thu', count: Math.floor(totalAppointments * 0.17) },
            { day: 'Fri', count: Math.floor(totalAppointments * 0.19) },
            { day: 'Sat', count: Math.floor(totalAppointments * 0.08) },
            { day: 'Sun', count: Math.floor(totalAppointments * 0.05) }
          ]
        }
      });
    }, 800);
  });
};

// ==================== API 5: SERVICE USAGE STATISTICS ====================

/**
 * Lấy thống kê sử dụng dịch vụ
 * @param {Object} params - { startDate, endDate, category }
 */
export const getServiceUsageStatistics = async (params = {}) => {
  const { startDate, endDate, category = null } = params;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      let dates;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        dates = generateDateRange(diffDays, startDate);
      } else {
        dates = generateDateRange(30);
      }
      
      // Service usage by category
      const byCategory = [
        { category: 'cosmetic', name: 'Thẩm mỹ', count: 285, revenue: 1425000000, avgPrice: 5000000 },
        { category: 'implant', name: 'Cấy ghép', count: 145, revenue: 2175000000, avgPrice: 15000000 },
        { category: 'orthodontics', name: 'Chỉnh nha', count: 98, revenue: 4410000000, avgPrice: 45000000 },
        { category: 'periodontics', name: 'Nha chu', count: 520, revenue: 260000000, avgPrice: 500000 },
        { category: 'endodontics', name: 'Nội nha', count: 180, revenue: 360000000, avgPrice: 2000000 },
        { category: 'restorative', name: 'Phục hồi', count: 420, revenue: 210000000, avgPrice: 500000 },
        { category: 'surgery', name: 'Phẫu thuật', count: 215, revenue: 322500000, avgPrice: 1500000 },
        { category: 'pediatric', name: 'Nha khoa trẻ em', count: 185, revenue: 46250000, avgPrice: 250000 },
        { category: 'general', name: 'Tổng quát', count: 680, revenue: 136000000, avgPrice: 200000 }
      ];
      
      // Top trending services
      const trendingServices = [
        { serviceId: 'SV010', name: 'Niềng răng Invisalign', growth: 45.2, count: 42, prevCount: 29 },
        { serviceId: 'SV015', name: 'Tẩy trắng răng Laser', growth: 38.5, count: 68, prevCount: 49 },
        { serviceId: 'SV018', name: 'Veneer sứ', growth: 32.8, count: 85, prevCount: 64 },
        { serviceId: 'SV008', name: 'Cấy ghép Implant Nobel', growth: 28.3, count: 52, prevCount: 41 },
        { serviceId: 'SV006', name: 'Răng sứ thẩm mỹ Emax', growth: 25.7, count: 95, prevCount: 76 }
      ];
      
      resolve({
        success: true,
        data: {
          summary: {
            totalServices: byCategory.reduce((sum, c) => sum + c.count, 0),
            totalRevenue: byCategory.reduce((sum, c) => sum + c.revenue, 0),
            avgServiceValue: Math.floor(byCategory.reduce((sum, c) => sum + c.revenue, 0) / byCategory.reduce((sum, c) => sum + c.count, 0))
          },
          byCategory,
          trendingServices,
          topServices: MOCK_SERVICES.slice(0, 15).map(s => ({
            ...s,
            count: getRandomNumber(50, 150),
            revenue: s.basePrice * getRandomNumber(50, 150)
          })).sort((a, b) => b.revenue - a.revenue)
        }
      });
    }, 800);
  });
};

// ==================== API 6: DENTIST PERFORMANCE STATISTICS ====================

/**
 * Lấy thống kê hiệu suất nha sỹ
 * @param {Object} params - { startDate, endDate, dentistId }
 */
export const getDentistPerformanceStatistics = async (params = {}) => {
  const { startDate, endDate, dentistId = null } = params;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const performanceData = MOCK_DENTISTS.map(dentist => {
        const baseAppointments = getRandomNumber(80, 150);
        const completed = Math.floor(baseAppointments * 0.92);
        const cancelled = Math.floor(baseAppointments * 0.05);
        const noShow = baseAppointments - completed - cancelled;
        
        const baseRevenue = dentist.specialization === 'Implant' ? 25000000 :
                           dentist.specialization === 'Chỉnh nha' ? 22000000 :
                           dentist.specialization === 'Răng sứ' ? 20000000 : 15000000;
        
        const totalRevenue = baseRevenue * getRandomNumber(3, 6);
        const avgRevenue = Math.floor(totalRevenue / completed);
        
        return {
          dentistId: dentist.id,
          dentistName: dentist.name,
          specialization: dentist.specialization,
          experience: dentist.experience,
          rating: dentist.rating,
          totalAppointments: baseAppointments,
          completed,
          cancelled,
          noShow,
          completionRate: ((completed / baseAppointments) * 100).toFixed(1),
          totalRevenue,
          avgRevenuePerAppointment: avgRevenue,
          patientSatisfaction: getRandomNumber(85, 98),
          repeatPatientRate: getRandomNumber(70, 90)
        };
      }).filter(d => !dentistId || d.dentistId === dentistId)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      resolve({
        success: true,
        data: {
          dentists: performanceData,
          topPerformers: performanceData.slice(0, 5),
          averages: {
            avgAppointments: Math.floor(performanceData.reduce((sum, d) => sum + d.totalAppointments, 0) / performanceData.length),
            avgRevenue: Math.floor(performanceData.reduce((sum, d) => sum + d.totalRevenue, 0) / performanceData.length),
            avgCompletionRate: (performanceData.reduce((sum, d) => sum + parseFloat(d.completionRate), 0) / performanceData.length).toFixed(1),
            avgRating: (performanceData.reduce((sum, d) => sum + d.rating, 0) / performanceData.length).toFixed(1)
          }
        }
      });
    }, 800);
  });
};

// Export mock data (functions are already exported with 'export const' above)
export { MOCK_DENTISTS, MOCK_SERVICES };

// ==================== API 7: CLINIC UTILIZATION STATISTICS ====================

/**
 * Lấy thống kê hiệu suất phòng khám (slot-based)
 * @param {Object} params - { startDate, endDate, roomIds, timeRange, shiftName }
 */
export const getClinicUtilizationStatistics = async (params = {}) => {
  const { 
    startDate, 
    endDate, 
    roomIds = [],
    timeRange = 'month',
    shiftName = null
  } = params;
  
  try {
    const response = await statisticApi.get('/statistics/clinic-utilization', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching clinic utilization:', error);
    throw error;
  }
};
