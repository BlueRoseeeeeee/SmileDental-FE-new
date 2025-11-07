/**
 * Statistics API - Mock Data
 * Dựa trên phân tích models thực tế từ THONG_KE_CHUAN_XAC.md
 * 
 * 3 API chính:
 * 1. Revenue Statistics (Doanh thu)
 * 2. Booking Channel Statistics (Online/Offline)
 * 3. Patient Retention Statistics (Bệnh nhân quay lại)
 */

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

// Dentists (Nha sỹ)
const MOCK_DENTISTS = [
  { id: 'D001', name: 'BS. Nguyễn Văn A', employeeCode: 'NV00000001', specialization: 'Phục hình' },
  { id: 'D002', name: 'BS. Trần Thị B', employeeCode: 'NV00000002', specialization: 'Nha chu' },
  { id: 'D003', name: 'BS. Lê Văn C', employeeCode: 'NV00000003', specialization: 'Chỉnh nha' },
  { id: 'D004', name: 'BS. Phạm Thị D', employeeCode: 'NV00000004', specialization: 'Implant' },
  { id: 'D005', name: 'BS. Hoàng Văn E', employeeCode: 'NV00000005', specialization: 'Nội nha' },
  { id: 'D006', name: 'BS. Ngô Thị F', employeeCode: 'NV00000006', specialization: 'Răng sứ' },
  { id: 'D007', name: 'BS. Đỗ Văn G', employeeCode: 'NV00000007', specialization: 'Tổng quát' },
  { id: 'D008', name: 'BS. Vũ Thị H', employeeCode: 'NV00000008', specialization: 'Thẩm mỹ' }
];

// Services (Dịch vụ)
const MOCK_SERVICES = [
  // Exam services
  { id: 'SV001', name: 'Khám tổng quát', type: 'exam', basePrice: 200000 },
  { id: 'SV002', name: 'Khám nha chu', type: 'exam', basePrice: 300000 },
  { id: 'SV003', name: 'Khám chỉnh nha', type: 'exam', basePrice: 500000 },
  { id: 'SV004', name: 'Tư vấn implant', type: 'exam', basePrice: 0 },
  
  // Treatment services
  { id: 'SV005', name: 'Răng sứ thẩm mỹ', type: 'treatment', basePrice: 5000000 },
  { id: 'SV006', name: 'Cấy ghép Implant', type: 'treatment', basePrice: 15000000 },
  { id: 'SV007', name: 'Niềng răng Invisalign', type: 'treatment', basePrice: 80000000 },
  { id: 'SV008', name: 'Niềng răng mắc cài', type: 'treatment', basePrice: 35000000 },
  { id: 'SV009', name: 'Tẩy trắng răng', type: 'treatment', basePrice: 3000000 },
  { id: 'SV010', name: 'Nhổ răng khôn', type: 'treatment', basePrice: 1500000 },
  { id: 'SV011', name: 'Trám răng', type: 'treatment', basePrice: 500000 },
  { id: 'SV012', name: 'Lấy cao răng', type: 'treatment', basePrice: 400000 },
  { id: 'SV013', name: 'Điều trị tủy', type: 'treatment', basePrice: 2000000 },
  { id: 'SV014', name: 'Cấy ghép xương', type: 'treatment', basePrice: 12000000 },
  { id: 'SV015', name: 'Bọc răng sứ', type: 'treatment', basePrice: 4000000 }
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
 * @param {Object} params - { startDate, endDate, groupBy, dentistId, serviceId }
 */
export const getRevenueStatistics = async (params = {}) => {
  const { 
    startDate, 
    endDate, 
    groupBy = 'day',
    dentistId = null,
    serviceId = null 
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
        dates = generateDateRange(30); // Default last 30 days
      }
      
      // Generate revenue by dentist
      const revenueByDentist = MOCK_DENTISTS.map(dentist => 
        generateDentistRevenue(dentist.id, dates.length)
      ).filter(d => !dentistId || d.dentistId === dentistId)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      // Generate revenue by service
      const revenueByService = MOCK_SERVICES.map(service => 
        generateServiceRevenue(service.id, dates.length)
      ).filter(s => !serviceId || s.serviceId === serviceId)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      // Calculate totals
      const totalRevenue = revenueByDentist.reduce((sum, d) => sum + d.totalRevenue, 0);
      const totalAppointments = revenueByDentist.reduce((sum, d) => sum + d.appointmentCount, 0);
      
      // Revenue by time
      const revenueByTime = dates.map((date, i) => {
        const dailyTotal = revenueByDentist.reduce((sum, d) => sum + d.dailyData[i], 0);
        return { date, revenue: dailyTotal };
      });
      
      // Group by period if needed
      const groupedRevenue = groupBy === 'day' 
        ? revenueByTime 
        : groupByPeriod(
            dates, 
            revenueByTime.map(r => r.revenue), 
            groupBy
          ).map(item => ({ date: item.date, revenue: item.value }));
      
      resolve({
        success: true,
        data: {
          summary: {
            totalRevenue,
            totalAppointments,
            totalServices: revenueByService.reduce((sum, s) => sum + s.totalCount, 0),
            avgRevenuePerAppointment: totalAppointments > 0 
              ? Math.floor(totalRevenue / totalAppointments) 
              : 0,
            period: {
              startDate: dates[0],
              endDate: dates[dates.length - 1],
              days: dates.length
            }
          },
          revenueByDentist: revenueByDentist.slice(0, 10), // Top 10
          revenueByService: revenueByService.slice(0, 10), // Top 10
          revenueByTime: groupedRevenue,
          // Comparison data (count vs revenue)
          comparison: revenueByService.map(s => ({
            name: s.serviceName,
            type: s.serviceType,
            count: s.totalCount,
            revenue: s.totalRevenue,
            avgRevenue: s.avgRevenuePerService
          }))
        }
      });
    }, 800);
  });
};

// ==================== API 2: BOOKING CHANNEL STATISTICS ====================

/**
 * Lấy thống kê Online vs Offline appointments
 * @param {Object} params - { startDate, endDate, groupBy }
 */
export const getBookingChannelStatistics = async (params = {}) => {
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
      
      // Generate daily online/offline counts
      const dailyData = dates.map(date => {
        const d = new Date(date);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        
        // Weekend: fewer bookings
        const multiplier = isWeekend ? 0.5 : 1.0;
        
        // Online: 65-75% of total
        const online = Math.floor(getRandomNumber(8, 15) * multiplier);
        // Offline: 25-35% of total
        const offline = Math.floor(getRandomNumber(3, 7) * multiplier);
        
        return { date, online, offline };
      });
      
      const totalOnline = dailyData.reduce((sum, d) => sum + d.online, 0);
      const totalOffline = dailyData.reduce((sum, d) => sum + d.offline, 0);
      const total = totalOnline + totalOffline;
      
      // Offline by staff role
      const offlineByRole = [
        { role: 'receptionist', name: 'Lễ tân', count: Math.floor(totalOffline * 0.68), percentage: 68.0 },
        { role: 'admin', name: 'Quản trị viên', count: Math.floor(totalOffline * 0.21), percentage: 21.0 },
        { role: 'manager', name: 'Quản lý', count: Math.floor(totalOffline * 0.11), percentage: 11.0 }
      ];
      
      // Top staff who book offline
      const topStaff = [
        { staffId: 'ST001', name: 'Nguyễn Thị X', role: 'receptionist', count: Math.floor(totalOffline * 0.25) },
        { staffId: 'ST002', name: 'Trần Văn Y', role: 'receptionist', count: Math.floor(totalOffline * 0.22) },
        { staffId: 'ST003', name: 'Lê Thị Z', role: 'receptionist', count: Math.floor(totalOffline * 0.21) },
        { staffId: 'ST004', name: 'Phạm Văn M', role: 'admin', count: Math.floor(totalOffline * 0.12) },
        { staffId: 'ST005', name: 'Hoàng Thị N', role: 'admin', count: Math.floor(totalOffline * 0.09) }
      ];
      
      // Completion rate
      const onlineCompleted = Math.floor(totalOnline * 0.87); // 87%
      const offlineCompleted = Math.floor(totalOffline * 0.93); // 93%
      
      // Group by period
      const groupedData = groupBy === 'day' 
        ? dailyData 
        : groupByPeriod(
            dates,
            dailyData.map(d => d.online + d.offline),
            groupBy
          ).map((item, i) => {
            // Recalculate online/offline ratio for grouped data
            const onlineRatio = totalOnline / total;
            return {
              date: item.date,
              online: Math.floor(item.value * onlineRatio),
              offline: item.value - Math.floor(item.value * onlineRatio)
            };
          });
      
      resolve({
        success: true,
        data: {
          summary: {
            total,
            online: {
              count: totalOnline,
              percentage: ((totalOnline / total) * 100).toFixed(1),
              avgPerDay: (totalOnline / dates.length).toFixed(1),
              completionRate: ((onlineCompleted / totalOnline) * 100).toFixed(1),
              completed: onlineCompleted
            },
            offline: {
              count: totalOffline,
              percentage: ((totalOffline / total) * 100).toFixed(1),
              avgPerDay: (totalOffline / dates.length).toFixed(1),
              completionRate: ((offlineCompleted / totalOffline) * 100).toFixed(1),
              completed: offlineCompleted
            },
            period: {
              startDate: dates[0],
              endDate: dates[dates.length - 1],
              days: dates.length
            }
          },
          trend: groupedData,
          offlineByRole,
          topStaff
        }
      });
    }, 800);
  });
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
      
      // Top loyal patients
      const loyalPatients = [
        { 
          patientId: 'P001', 
          name: 'Nguyễn Văn Anh', 
          phone: '0901234567', 
          totalVisits: 24, 
          totalSpent: 125000000, 
          firstVisit: '2023-01-15', 
          lastVisit: '2024-11-05',
          frequency: 2.4 // visits per month
        },
        { 
          patientId: 'P002', 
          name: 'Trần Thị Bình', 
          phone: '0907654321', 
          totalVisits: 18, 
          totalSpent: 98000000, 
          firstVisit: '2023-03-20', 
          lastVisit: '2024-11-03',
          frequency: 1.8
        },
        { 
          patientId: 'P003', 
          name: 'Lê Văn Cường', 
          phone: '0912345678', 
          totalVisits: 16, 
          totalSpent: 87000000, 
          firstVisit: '2023-05-10', 
          lastVisit: '2024-10-28',
          frequency: 1.6
        },
        { 
          patientId: 'P004', 
          name: 'Phạm Thị Dung', 
          phone: '0923456789', 
          totalVisits: 14, 
          totalSpent: 76000000, 
          firstVisit: '2023-06-15', 
          lastVisit: '2024-10-25',
          frequency: 1.4
        },
        { 
          patientId: 'P005', 
          name: 'Hoàng Văn Em', 
          phone: '0934567890', 
          totalVisits: 12, 
          totalSpent: 65000000, 
          firstVisit: '2023-07-20', 
          lastVisit: '2024-10-20',
          frequency: 1.2
        }
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
          // Cohort analysis (monthly retention)
          cohortAnalysis: [
            { month: '2024-01', newPatients: 45, withSecondVisit: 32, retentionRate: 71.1 },
            { month: '2024-02', newPatients: 52, withSecondVisit: 38, retentionRate: 73.1 },
            { month: '2024-03', newPatients: 48, withSecondVisit: 36, retentionRate: 75.0 },
            { month: '2024-04', newPatients: 55, withSecondVisit: 43, retentionRate: 78.2 },
            { month: '2024-05', newPatients: 50, withSecondVisit: 39, retentionRate: 78.0 },
            { month: '2024-06', newPatients: 58, withSecondVisit: 47, retentionRate: 81.0 }
          ]
        }
      });
    }, 800);
  });
};

// Export mock data (functions are already exported with 'export const' above)
export { MOCK_DENTISTS, MOCK_SERVICES };
