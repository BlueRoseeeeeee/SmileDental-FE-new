// Mock data for patient booking flow testing
export const mockServices = [
  {
    _id: 'service1',
    name: 'Khám - Gặp bác sĩ tư vấn',
    description: 'Tư vấn và khám tổng quát răng miệng với đội ngũ bác sĩ giàu kinh nghiệm',
    price: 100000,
    duration: 30,
    isActive: true
  },
  {
    _id: 'service2',
    name: 'Lấy cao răng',
    description: 'Vệ sinh răng miệng chuyên sâu, làm sạch cao răng và mảng bám',
    price: 200000,
    duration: 45,
    isActive: true
  },
  {
    _id: 'service3',
    name: 'Nhổ răng khôn',
    description: 'Nhổ răng khôn an toàn với công nghệ hiện đại, giảm thiểu đau đớn',
    price: 500000,
    duration: 60,
    isActive: true
  },
  {
    _id: 'service4',
    name: 'Trám răng',
    description: 'Trám răng thẩm mỹ, phục hồi răng bị sâu hoặc hư tổn',
    price: 300000,
    duration: 45,
    isActive: true
  },
  {
    _id: 'service5',
    name: 'Tẩy trắng răng',
    description: 'Tẩy trắng răng công nghệ Laser, an toàn và hiệu quả',
    price: 1500000,
    duration: 90,
    isActive: true
  }
];

export const mockDentists = [
  {
    _id: 'dentist1',
    fullName: 'Nguyễn Văn A',
    title: 'BS.CKI',
    email: 'nguyenvana@smiledental.com',
    phone: '0901234567',
    gender: 'male',
    assignmentRole: 'dentist',
    isActive: true,
    avatar: null,
    specialization: 'Răng hàm mặt',
    experience: 10,
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    _id: 'dentist2',
    fullName: 'Nguyễn Văn B',
    title: 'TS.BS',
    email: 'nguyenvanb@smiledental.com',
    phone: '0901234568',
    gender: 'male',
    assignmentRole: 'dentist',
    isActive: true,
    avatar: null,
    specialization: 'Chỉnh nha',
    experience: 15,
    workingDays: ['monday', 'wednesday', 'friday', 'saturday']
  },
  {
    _id: 'dentist3',
    fullName: 'Nguyễn Văn An',
    title: 'BS.CKII',
    email: 'nguyenvanan@smiledental.com',
    phone: '0901234569',
    gender: 'male',
    assignmentRole: 'dentist',
    isActive: true,
    avatar: null,
    specialization: 'Nha chu',
    experience: 8,
    workingDays: ['tuesday', 'thursday', 'friday', 'saturday']
  }
];

export const mockSlots = {
  morning: [
    {
      _id: 'slot1',
      startTime: '2025-10-20T08:00:00.000Z',
      endTime: '2025-10-20T08:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'morning'
    },
    {
      _id: 'slot2',
      startTime: '2025-10-20T08:30:00.000Z',
      endTime: '2025-10-20T09:00:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'morning'
    },
    {
      _id: 'slot3',
      startTime: '2025-10-20T09:00:00.000Z',
      endTime: '2025-10-20T09:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'morning'
    },
    {
      _id: 'slot4',
      startTime: '2025-10-20T09:30:00.000Z',
      endTime: '2025-10-20T10:00:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'morning'
    },
    {
      _id: 'slot5',
      startTime: '2025-10-20T10:00:00.000Z',
      endTime: '2025-10-20T10:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'morning'
    },
    {
      _id: 'slot6',
      startTime: '2025-10-20T10:30:00.000Z',
      endTime: '2025-10-20T11:00:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'morning'
    },
    {
      _id: 'slot7',
      startTime: '2025-10-20T11:00:00.000Z',
      endTime: '2025-10-20T11:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'morning'
    }
  ],
  afternoon: [
    {
      _id: 'slot8',
      startTime: '2025-10-20T13:00:00.000Z',
      endTime: '2025-10-20T13:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'afternoon'
    },
    {
      _id: 'slot9',
      startTime: '2025-10-20T13:30:00.000Z',
      endTime: '2025-10-20T14:00:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'afternoon'
    },
    {
      _id: 'slot10',
      startTime: '2025-10-20T14:00:00.000Z',
      endTime: '2025-10-20T14:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'afternoon'
    },
    {
      _id: 'slot11',
      startTime: '2025-10-20T14:30:00.000Z',
      endTime: '2025-10-20T15:00:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'afternoon'
    },
    {
      _id: 'slot12',
      startTime: '2025-10-20T15:00:00.000Z',
      endTime: '2025-10-20T15:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'afternoon'
    },
    {
      _id: 'slot13',
      startTime: '2025-10-20T15:30:00.000Z',
      endTime: '2025-10-20T16:00:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'afternoon'
    },
    {
      _id: 'slot14',
      startTime: '2025-10-20T16:00:00.000Z',
      endTime: '2025-10-20T16:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'afternoon'
    }
  ],
  evening: [
    {
      _id: 'slot15',
      startTime: '2025-10-20T17:00:00.000Z',
      endTime: '2025-10-20T17:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'evening'
    },
    {
      _id: 'slot16',
      startTime: '2025-10-20T17:30:00.000Z',
      endTime: '2025-10-20T18:00:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'evening'
    },
    {
      _id: 'slot17',
      startTime: '2025-10-20T18:00:00.000Z',
      endTime: '2025-10-20T18:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'evening'
    },
    {
      _id: 'slot18',
      startTime: '2025-10-20T18:30:00.000Z',
      endTime: '2025-10-20T19:00:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'evening'
    },
    {
      _id: 'slot19',
      startTime: '2025-10-20T19:00:00.000Z',
      endTime: '2025-10-20T19:30:00.000Z',
      status: 'available',
      date: '2025-10-20',
      shiftName: 'evening'
    }
  ]
};

export const mockPatient = {
  _id: 'patient1',
  fullName: 'Nguyễn Linh',
  email: 'nguyenlinh@gmail.com',
  phone: '0987654321',
  dateOfBirth: '2003-02-01',
  gender: 'female',
  address: 'Gò Vấp, TP.HCM',
  role: 'patient'
};
