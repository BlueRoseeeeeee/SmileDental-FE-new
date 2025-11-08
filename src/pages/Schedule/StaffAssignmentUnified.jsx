/**
 * @author: TrungNghia & HoTram
 * Component: Phân công nhân sự - Giao diện thống nhất với tạo lịch
 * Flow: Chọn phòng → Chọn ca → Hiển thị danh sách nhân sự + conflict checking
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Modal,
  Select,
  Radio,
  Alert,
  Badge,
  Popover,
  Collapse,
  Empty,
  Spin,
  Tabs,
  Checkbox,
  Divider,
  DatePicker,
  Input,
  Tooltip
} from 'antd';
import {
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SwapOutlined,
  SearchOutlined,
  HomeOutlined,
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../services/toastService';
import roomService from '../../services/roomService';
import scheduleService from '../../services/scheduleService';
import userService from '../../services/userService';
import slotService from '../../services/slotService';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { debounce } from '../../utils/searchUtils';

dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const normalizeText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const normalizeLower = (value) => normalizeText(value).toLowerCase();

const buildStaffDisplayName = (staff) => {
  if (!staff || typeof staff !== 'object') {
    return 'Chưa cập nhật tên';
  }

  const firstName = normalizeText(staff.firstName);
  const lastName = normalizeText(staff.lastName);
  const combinedName = [firstName, lastName].filter(Boolean).join(' ');

  const candidates = [
    staff.fullName,
    staff.name,
    staff.displayName,
    staff.profile?.fullName,
    combinedName,
    staff.username,
    staff.email
  ];

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized) return normalized;
  }

  return 'Chưa cập nhật tên';
};

const getRoleLabel = (role) => {
  const normalized = normalizeLower(role);
  if (normalized === 'dentist' || normalized === 'doctor') return 'Nha sĩ';
  if (normalized === 'nurse') return 'Y tá';
  return 'Khác';
};

const getRoleTagColor = (role) => {
  const normalized = normalizeLower(role);
  if (normalized === 'dentist' || normalized === 'doctor') return 'blue';
  if (normalized === 'nurse') return 'green';
  return 'default';
};

const buildStaffSearchKeywords = (staff, displayName, employeeCode, assignmentRole) => {
  if (!staff || typeof staff !== 'object') {
    return '';
  }

  const tokens = [
    displayName,
    employeeCode,
    staff.fullName,
    staff.name,
    staff.username,
    staff.email,
    staff.phoneNumber,
    staff.phone,
    staff.profile?.fullName,
    getRoleLabel(assignmentRole || staff.role),
    staff.role
  ];

  return tokens
    .map(normalizeLower)
    .filter(Boolean)
    .join(' ');
};

// 🆕 Helper: Check if staff has a specific role (supports multi-roles)
const staffHasRole = (staff, targetRole) => {
  if (!staff) return false;
  
  // Check roles array first (new multi-role system)
  if (Array.isArray(staff.roles)) {
    return staff.roles.includes(targetRole);
  }
  
  // Fallback to single role field
  const role = staff.role === 'doctor' ? 'dentist' : staff.role;
  return role === targetRole;
};

// 🆕 Helper: Get all valid assignment roles for a staff member
const getStaffAssignmentRoles = (staff) => {
  if (!staff) return [];
  
  // Check roles array first (new multi-role system)
  if (Array.isArray(staff.roles)) {
    return staff.roles
      .map(r => r === 'doctor' ? 'dentist' : r)
      .filter(r => r === 'dentist' || r === 'nurse');
  }
  
  // Fallback to single role field
  const role = staff.role === 'doctor' ? 'dentist' : staff.role;
  if (role === 'dentist' || role === 'nurse') {
    return [role];
  }
  
  return [];
};

const normalizeStaffRecord = (staff) => {
  if (!staff || typeof staff !== 'object') {
    return {
      assignmentRole: '',
      assignmentRoles: [], // 🆕 Array of valid assignment roles
      displayName: 'Chưa cập nhật tên',
      employeeCode: '',
      searchKeywords: ''
    };
  }

  // 🆕 Support multi-roles
  const assignmentRoles = getStaffAssignmentRoles(staff);
  const assignmentRole = assignmentRoles[0] || ''; // Primary role for backward compatibility
  
  const displayName = buildStaffDisplayName(staff);
  const employeeCode = normalizeText(staff.employeeCode || staff.code || staff.employee_code);
  const searchKeywords = buildStaffSearchKeywords(staff, displayName, employeeCode, assignmentRole);

  return {
    ...staff,
    assignmentRole,
    assignmentRoles, // 🆕 Array of valid assignment roles
    displayName,
    employeeCode,
    searchKeywords
  };
};

const renderRoleTag = (role) => {
  const label = getRoleLabel(role);
  const color = getRoleTagColor(role);
  return <Tag color={color}>{label}</Tag>;
};

const renderDisplayNameWithTag = (staff, showCode = true) => {
  const displayName = staff?.displayName || buildStaffDisplayName(staff);
  const employeeCode = staff?.employeeCode || normalizeText(staff?.employeeCode || staff?.code);
  const role = staff?.assignmentRole || staff?.role;

  return (
    <Space size="small">
      <Text>{displayName}</Text>
      {showCode && employeeCode && <Tag color="purple">{employeeCode}</Tag>}
      {role && renderRoleTag(role)}
    </Space>
  );
};

const resolveSlotId = (slot) => slot?._id || slot?.id || slot?.slotId || slot?.slotID || null;

const isSlotFullyAssigned = (slot) => {
  if (!slot) return false;
  
  // 🔄 Updated to handle array dentist/nurse (new schema)
  // Check if dentist is assigned (single value or array)
  const hasDentist = Array.isArray(slot?.dentist) 
    ? slot.dentist.length > 0 
    : Boolean(slot?.dentist?._id || slot?.dentist || slot?.dentistId);
  
  // Check if nurse is assigned (single value or array)
  const hasNurse = Array.isArray(slot?.nurse)
    ? slot.nurse.length > 0
    : Boolean(slot?.nurse?._id || slot?.nurse || slot?.nurseId);
  
  return hasDentist || hasNurse;
};

const normalizeSlotList = (slots) => {
  if (!Array.isArray(slots)) return [];
  return slots.map(slot => {
    const slotId = resolveSlotId(slot);
    if (slotId && slot?._id !== slotId) {
      return { ...slot, _id: slotId };
    }
    return slot;
  });
};

const parseDateTimeSafe = (dateStr, isoCandidate, hhmmCandidate, fallbackHHmm) => {
  if (isoCandidate) {
    const isoParsed = dayjs(isoCandidate);
    if (isoParsed.isValid()) {
      return isoParsed;
    }
  }

  const tryFormats = [];
  if (hhmmCandidate) {
    tryFormats.push(hhmmCandidate);
  }
  if (fallbackHHmm && fallbackHHmm !== hhmmCandidate) {
    tryFormats.push(fallbackHHmm);
  }

  for (const timeStr of tryFormats) {
    if (!timeStr) continue;

    if (timeStr.includes('T')) {
      const iso = dayjs(timeStr);
      if (iso.isValid()) {
        return iso;
      }
    }

    const combined = dayjs(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm', true);
    if (combined.isValid()) {
      return combined;
    }

    const relaxed = dayjs(timeStr);
    if (relaxed.isValid()) {
      return relaxed;
    }
  }

  return null;
};

const buildSlotDetail = (entry, slot, shiftMeta, defaultRoom, defaultSubRoom) => {
  const slotId = resolveSlotId(slot);
  if (!slotId) return null;

  const dateStr = entry.date;
  const startCandidate = parseDateTimeSafe(
    dateStr,
    slot?.startDateTime || slot?.startTime,
    slot?.startTimeVN || slot?.startHour,
    shiftMeta?.startTime
  );
  const endCandidate = parseDateTimeSafe(
    dateStr,
    slot?.endDateTime || slot?.endTime,
    slot?.endTimeVN || slot?.endHour,
    shiftMeta?.endTime
  );

  const fallbackStart = shiftMeta?.startTime
    ? dayjs(`${dateStr} ${shiftMeta.startTime}`, 'YYYY-MM-DD HH:mm', true)
    : null;
  const fallbackEnd = shiftMeta?.endTime
    ? dayjs(`${dateStr} ${shiftMeta.endTime}`, 'YYYY-MM-DD HH:mm', true)
    : null;

  const start = startCandidate || (fallbackStart?.isValid() ? fallbackStart : null) || dayjs(dateStr).startOf('day');
  const end = endCandidate || (fallbackEnd?.isValid() ? fallbackEnd : null) || dayjs(dateStr).endOf('day');

  const roomName = slot?.room?.name || slot?.roomName || defaultRoom?.name || null;
  const subRoomName = slot?.subRoom?.name || slot?.subRoomName || defaultSubRoom?.name || null;

  return {
    slotId,
    date: dateStr,
    shiftName: entry.shiftName,
    start,
    end,
    startTime: start?.format('HH:mm') || null,
    endTime: end?.format('HH:mm') || null,
    roomName,
    subRoomName,
    roomId: slot?.room?._id || defaultRoom?._id || null,
    slotData: slot
  };
};

const detectConflictsForStaff = (staff, slotDetails, scheduleEntries) => {
  const staffRole = staff.assignmentRole || staff.role;
  
  if (!Array.isArray(slotDetails) || slotDetails.length === 0) {
    return [];
  }

  const conflicts = [];
  const seenKeys = new Set();

  const recordConflict = (detail, overrideRoomName, overrideSubRoomName, source, conflictRole) => {
    const key = `${staff._id}-${detail.date}-${detail.shiftName}-${detail.start?.format?.('HH:mm') || detail.startTime || ''}-${overrideRoomName || detail.roomName || ''}-${source}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    conflicts.push({
      date: detail.date,
      shiftName: detail.shiftName,
      startTime: detail.start ? detail.start.format('HH:mm') : detail.startTime || null,
      endTime: detail.end ? detail.end.format('HH:mm') : detail.endTime || null,
      roomName: overrideRoomName || detail.roomName || null,
      subRoomName: overrideSubRoomName || detail.subRoomName || null,
      conflictRole: conflictRole || null, // 🆕 Thêm role gây conflict
      source
    });
  };

  // ⭐ REMOVED: Không check current-assignment vì đó là re-assignment, không phải conflict
  // Nếu staff đã được assign vào chính slot đang chọn → không phải conflict

  const normalizedSchedule = Array.isArray(scheduleEntries) ? scheduleEntries : [];

  normalizedSchedule.forEach(entry => {
    // 🔥 FIX: Không bỏ qua entry vì role khác nhau
    // Vì một user có thể có nhiều role (vd: vừa là dentist, vừa là nurse)
    // Nên phải kiểm tra xung đột thời gian cho TẤT CẢ các role của user đó
    // Nếu user đang được check với role dentist, nhưng user đã được assign với role nurse
    // ở cùng thời gian → vẫn là conflict vì user không thể ở 2 nơi cùng lúc
    
    const entryDate = entry.date || entry.startDate || entry.shiftDate;
    if (!entryDate) return;
    
    // Convert Date object to YYYY-MM-DD string
    const entryDateStr = entry.dateStr || (entryDate instanceof Date 
      ? dayjs(entryDate).format('YYYY-MM-DD')
      : (typeof entryDate === 'string' ? entryDate : dayjs(entryDate).format('YYYY-MM-DD')));

    const entryStart = parseDateTimeSafe(entryDateStr, entry.startDateTime || entry.startTimeISO, entry.startTime, null);
    const entryEnd = parseDateTimeSafe(entryDateStr, entry.endDateTime || entry.endTimeISO, entry.endTime, null);

      if (!entryStart || !entryEnd) {
        return;
      }    slotDetails.forEach(detail => {
      if (!detail.start || !detail.end) {
        return;
      }

      const sameDay = entryStart.isSame(detail.start, 'day');
      if (!sameDay) {
        return;
      }

      // ⭐ Check if this is the same slot being re-assigned (not a conflict)
      const entrySlotId = entry.slotId || entry._id;
      const detailSlotId = detail.slotId || detail._id;
      if (entrySlotId && detailSlotId && entrySlotId.toString() === detailSlotId.toString()) {
        return; // Same slot, not a conflict
      }

      // ⭐ Check if same room + same subroom + overlapping time (not a conflict if same slot)
      const sameRoom = (entry.roomId || entry.room?._id) === (detail.roomId || detail.room?._id);
      const sameSubRoom = (entry.subRoomId || entry.subRoom?._id) === (detail.subRoomId || detail.subRoom?._id);
      
      if (sameRoom && sameSubRoom) {
        // Same room + subroom → check if different slot but overlapping
        // If not same slot (already checked above), this is a real conflict within same room
      }

      // ⭐ Check time overlap - ACTIVE CONFLICT DETECTION
      if (detail.start.isBefore(entryEnd) && entryStart.isBefore(detail.end)) {
        const entryRole = entry.assignedAs || entry.role;
        recordConflict(
          detail,
          entry.roomName || entry.room?.name || detail.roomName,
          entry.subRoomName || entry.subRoom?.name || detail.subRoomName,
          'schedule',
          entryRole // 🆕 Truyền role gây conflict
        );
      }
    });
  });
  
  return conflicts;
};

const timeStringToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

const minutesToTimeString = (minutes) => {
  if (typeof minutes !== 'number' || Number.isNaN(minutes)) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const summarizeConflictRanges = (conflicts) => {
  if (!Array.isArray(conflicts)) return [];

  const grouped = new Map();

  conflicts.forEach(conflict => {
    if (!conflict) return;
    const key = [
      conflict.date || '',
      conflict.roomName || '',
      conflict.subRoomName || '',
      conflict.source || ''
    ].join('|');

    const entry = grouped.get(key) || [];
    entry.push(conflict);
    grouped.set(key, entry);
  });

  const summaries = [];

  grouped.forEach(items => {
    const enriched = items
      .map(item => ({
        ...item,
        startMinutes: timeStringToMinutes(item.startTime),
        endMinutes: timeStringToMinutes(item.endTime)
      }))
      .sort((a, b) => {
        if (a.startMinutes === null && b.startMinutes === null) return 0;
        if (a.startMinutes === null) return 1;
        if (b.startMinutes === null) return -1;
        return a.startMinutes - b.startMinutes;
      });

    let current = null;

    const flushCurrent = () => {
      if (!current) return;
      summaries.push({
        date: current.date,
        roomName: current.roomName,
        subRoomName: current.subRoomName,
        source: current.source,
        startTime: minutesToTimeString(current.startMinutes),
        endTime: minutesToTimeString(current.endMinutes),
        shiftNames: Array.from(current.shiftNames),
        count: current.count
      });
      current = null;
    };

    enriched.forEach(item => {
      const shiftName = item.shiftName || null;
      const hasTimeRange = typeof item.startMinutes === 'number' && typeof item.endMinutes === 'number';

      if (!hasTimeRange) {
        flushCurrent();
        summaries.push({
          date: item.date,
          roomName: item.roomName,
          subRoomName: item.subRoomName,
          source: item.source,
          shiftNames: shiftName ? [shiftName] : [],
          startTime: item.startTime || null,
          endTime: item.endTime || null,
          count: 1
        });
        return;
      }

      if (!current) {
        current = {
          date: item.date,
          roomName: item.roomName,
          subRoomName: item.subRoomName,
          source: item.source,
          startMinutes: item.startMinutes,
          endMinutes: item.endMinutes,
          shiftNames: new Set(shiftName ? [shiftName] : []),
          count: 1
        };
        return;
      }

      if (item.startMinutes <= current.endMinutes) {
        current.endMinutes = Math.max(current.endMinutes, item.endMinutes);
        if (shiftName) {
          current.shiftNames.add(shiftName);
        }
        current.count += 1;
      } else {
        flushCurrent();
        current = {
          date: item.date,
          roomName: item.roomName,
          subRoomName: item.subRoomName,
          source: item.source,
          startMinutes: item.startMinutes,
          endMinutes: item.endMinutes,
          shiftNames: new Set(shiftName ? [shiftName] : []),
          count: 1
        };
      }
    });

    flushCurrent();
  });

  return summaries;
};

const formatConflictDescription = (conflict) => {
  if (!conflict) return '';
  const datePart = conflict.date ? dayjs(conflict.date).format('DD/MM') : '';
  const shiftNames = Array.isArray(conflict.shiftNames) ? conflict.shiftNames : conflict.shiftName ? [conflict.shiftName] : [];
  const shiftPart = shiftNames.length > 0 ? shiftNames.join(', ') : '';
  const timePart = conflict.startTime && conflict.endTime
    ? `${conflict.startTime}-${conflict.endTime}`
    : conflict.startTime || '';
  const locationParts = [conflict.roomName, conflict.subRoomName].filter(Boolean);
  const location = locationParts.join(' • ');
  
  // 🆕 Hiển thị role nếu có (để biết user đang làm role gì ở chỗ trùng)
  const rolePart = conflict.conflictRole ? `(${getRoleDisplayName(conflict.conflictRole)})` : '';
  
  const metaParts = conflict.count && conflict.count > 1 ? [`${conflict.count} slot trùng`] : [];

  const parts = [datePart, shiftPart, timePart, location, rolePart, ...metaParts].filter(Boolean);
  return parts.join(' • ');
};

// 🆕 Helper function để hiển thị tên role tiếng Việt
const getRoleDisplayName = (role) => {
  const roleMap = {
    'dentist': 'Nha sĩ',
    'doctor': 'Nha sĩ',
    'nurse': 'Y tá',
    'admin': 'Quản trị',
    'manager': 'Quản lý'
  };
  return roleMap[role] || role;
};

const normalizeSelectionValue = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (value) {
    return [value];
  }
  return [];
};

const SlotQuickSelect = ({
  slots = [],
  selectedSlotIds = [],
  onToggleSlot,
  onToggleFiltered,
  onOpenModal,
  loading = false,
}) => {
  // No filter needed - show all slots
  const filteredSlots = useMemo(() => {
    return Array.isArray(slots) ? slots : [];
  }, [slots]);

  const totalSlots = slots?.length || 0;
  const filteredSlotIds = filteredSlots.map(resolveSlotId).filter(Boolean);
  const allFilteredSelected = filteredSlotIds.length > 0 && filteredSlotIds.every(id => selectedSlotIds.includes(id));
  const someFilteredSelected = filteredSlotIds.some(id => selectedSlotIds.includes(id)) && !allFilteredSelected;

  return (
    <div style={{ width: 320 }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Spin />
          <div style={{ marginTop: 8 }}>Đang tải slot...</div>
        </div>
      ) : totalSlots === 0 ? (
        <Empty description="Không có slot" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Đã chọn: {selectedSlotIds.length}/{totalSlots} slot
            </Text>
            <Checkbox
              disabled={filteredSlotIds.length === 0}
              checked={allFilteredSelected}
              indeterminate={someFilteredSelected}
              onChange={(e) => {
                if (onToggleFiltered) {
                  onToggleFiltered(e.target.checked, filteredSlotIds);
                }
              }}
            >
              Chọn tất cả
            </Checkbox>
          </Space>

          <Divider style={{ margin: '4px 0' }} />

          <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
            {filteredSlots.map(slot => {
              const slotId = resolveSlotId(slot);
              const isSelected = slotId ? selectedSlotIds.includes(slotId) : false;
              const startTime = slot?.startTimeVN || (slot?.startTime ? dayjs(slot.startTime).format('HH:mm') : '--:--');
              const endTime = slot?.endTimeVN || (slot?.endTime ? dayjs(slot.endTime).format('HH:mm') : '--:--');

              return (
                <Card
                  key={slotId}
                  size="small"
                  style={{
                    marginBottom: 8,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                    borderColor: isSelected ? '#1890ff' : '#f0f0f0'
                  }}
                  onClick={() => {
                    if (onToggleSlot && slotId) {
                      onToggleSlot(slotId);
                    }
                  }}
                >
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Checkbox
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => {
                        if (onToggleSlot && slotId) {
                          onToggleSlot(slotId);
                        }
                      }}
                    />
                    <Space direction="vertical" size={0} style={{ flex: 1, marginLeft: 8 }}>
                      <Text strong>{startTime} - {endTime}</Text>
                      
                      {/* ⭐ Show dentist info with fullName + employeeCode */}
                      {slot?.dentist && (
                        <div style={{ fontSize: 11, color: '#1890ff' }}>
                          {Array.isArray(slot.dentist) ? (
                            slot.dentist.map((d, idx) => {
                              const fullName = d?.fullName || d?.name || 'N/A';
                              const employeeCode = d?.employeeCode || d?.code;
                              return (
                                <div key={idx}>
                                  NS: {fullName}{employeeCode ? ` (${employeeCode})` : ''}
                                </div>
                              );
                            })
                          ) : (
                            <div>
                              NS: {slot.dentist?.fullName || slot.dentist?.name || 'N/A'}
                              {(slot.dentist?.employeeCode || slot.dentist?.code) && ` (${slot.dentist.employeeCode || slot.dentist.code})`}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* ⭐ Show nurse info with fullName + employeeCode */}
                      {slot?.nurse && (
                        <div style={{ fontSize: 11, color: '#52c41a' }}>
                          {Array.isArray(slot.nurse) ? (
                            slot.nurse.map((n, idx) => {
                              const fullName = n?.fullName || n?.name || 'N/A';
                              const employeeCode = n?.employeeCode || n?.code;
                              return (
                                <div key={idx}>
                                  YT: {fullName}{employeeCode ? ` (${employeeCode})` : ''}
                                </div>
                              );
                            })
                          ) : (
                            <div>
                              YT: {slot.nurse?.fullName || slot.nurse?.name || 'N/A'}
                              {(slot.nurse?.employeeCode || slot.nurse?.code) && ` (${slot.nurse.employeeCode || slot.nurse.code})`}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {slot?.room?.name && slot.room.name !== 'Phòng không xác định' && (
                        <Space size={4}>
                          <HomeOutlined style={{ fontSize: 12, color: '#666' }} />
                          <Text style={{ fontSize: 12, color: '#666' }}>
                            {slot.room.name}
                            {slot?.room?.subRoom?.name && ` - ${slot.room.subRoom.name}`}
                          </Text>
                        </Space>
                      )}
                    </Space>
                  </Space>
                </Card>
              );
            })}
          </div>

          {onOpenModal && (
            <Button type="link" size="small" onClick={onOpenModal} style={{ padding: 0 }}>
              Mở rộng
            </Button>
          )}
        </Space>
      )}
    </div>
  );
};

const StaffAssignmentUnified = () => {
  const navigate = useNavigate();
  
  // Main workflow mode
  const [activeTab, setActiveTab] = useState('room-based'); // 'room-based' hoặc 'staff-based'
  
  // States cho Workflow 1: Phân công theo phòng
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomActiveFilter, setRoomActiveFilter] = useState(true);
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState('has-schedule');
  const [roomSearchValue, setRoomSearchValue] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  
  // Assignment Modal States - Calendar View
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSubRoom, setSelectedSubRoom] = useState(null);
  const [roomCalendarData, setRoomCalendarData] = useState(null); // Calendar data của phòng
  const [loadingRoomCalendar, setLoadingRoomCalendar] = useState(false);
  const [currentMonthForRoom, setCurrentMonthForRoom] = useState(dayjs().startOf('month')); // Đổi sang tháng
  const [currentPageForRoom, setCurrentPageForRoom] = useState(0); // 0 = tháng hiện tại
  const [selectedSlotsForAssignment, setSelectedSlotsForAssignment] = useState([]); // [{ slotKey, date, shiftName, slotIds, totalSlots, slots }]
  const [availableShiftKeys, setAvailableShiftKeys] = useState([]);
  const [selectedShiftFilters, setSelectedShiftFilters] = useState([]);
  
  // ⭐ Lưu trạng thái shift filters và slots theo từng tháng (key: YYYY-MM)
  const [monthStateForRoom, setMonthStateForRoom] = useState({}); // { 'YYYY-MM': { shiftFilters: [], slots: [] } }
  
  // Track selected subroom in dropdown for each room (to reset after modal closes)
  const [subroomSelectValues, setSubroomSelectValues] = useState({});
  
  // Cache for slot details (to avoid repeated API calls on hover)
  const [slotDetailsCache, setSlotDetailsCache] = useState({});
  
  // Slot Selection Modal (for selecting individual slots)
  const [showSlotSelectionModal, setShowSlotSelectionModal] = useState(false);
  const [slotModalData, setSlotModalData] = useState(null); // { date, shiftName, shiftData, slots }
  const [selectedIndividualSlots, setSelectedIndividualSlots] = useState([]); // Array of slot IDs
  const [slotModalFilter, setSlotModalFilter] = useState('all'); // 'all', 'assigned', 'unassigned'
  const [loadingSlotModal, setLoadingSlotModal] = useState(false);
  const [quickSelectLoadingKey, setQuickSelectLoadingKey] = useState(null);
  const [selectingAllMonth, setSelectingAllMonth] = useState(false); // ⭐ Loading for "Chọn tất cả tháng"
  
  // Staff List States (kept for future use - staff selection after calendar)
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [dentistConflictFilter, setDentistConflictFilter] = useState('all'); // 'all', 'no-conflict', 'has-conflict'
  const [nurseConflictFilter, setNurseConflictFilter] = useState('all'); // 'all', 'no-conflict', 'has-conflict'
  const [selectedDentists, setSelectedDentists] = useState([]);
  const [selectedNurses, setSelectedNurses] = useState([]);
  const [maxDentists, setMaxDentists] = useState(1);
  const [maxNurses, setMaxNurses] = useState(1);
  
  // States cho Workflow 2: Thay thế theo nhân sự
  const [allStaff, setAllStaff] = useState([]); // Toàn bộ danh sách nhân sự
  const [loadingAllStaff, setLoadingAllStaff] = useState(false);
  const [staffAssignmentFilter, setStaffAssignmentFilter] = useState('has-schedule'); // 'all', 'has-schedule', 'no-schedule'
  const [staffRoleFilter, setStaffRoleFilter] = useState('all'); // 'all', 'dentist', 'nurse'
  const [staffSearchValue, setStaffSearchValue] = useState('');
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffScheduleMap, setStaffScheduleMap] = useState({}); // { staffId: hasSchedule }
  const [selectedStaffForReplacement, setSelectedStaffForReplacement] = useState(null);
  const [staffScheduleDetails, setStaffScheduleDetails] = useState(null);
  const [loadingStaffSchedule, setLoadingStaffSchedule] = useState(false);
  const [showStaffScheduleModal, setShowStaffScheduleModal] = useState(false);
  
  // 🆕 Role selection modal for multi-role users
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false);
  const [pendingStaffForRoleSelection, setPendingStaffForRoleSelection] = useState(null);
  const [selectedRoleForViewing, setSelectedRoleForViewing] = useState(null);
  
  // Calendar view states for Workflow 2 - Tương tự như phòng
  const [currentMonthForStaff, setCurrentMonthForStaff] = useState(dayjs().startOf('month'));
  const [currentPageForStaff, setCurrentPageForStaff] = useState(0); // 0 = tháng hiện tại
  const [staffCalendarData, setStaffCalendarData] = useState(null); // Lịch theo tháng của nhân sự
  const [selectedSlotsForReplacement, setSelectedSlotsForReplacement] = useState([]); // [{ slotKey, date, shiftName, slotIds, totalSlots, slots }]
  const [availableShiftKeysStaff, setAvailableShiftKeysStaff] = useState([]);
  const [selectedShiftFiltersStaff, setSelectedShiftFiltersStaff] = useState([]);
  
  // ⭐ Lưu trạng thái shift filters và slots theo từng tháng (key: YYYY-MM) cho Staff
  const [monthStateForStaff, setMonthStateForStaff] = useState({}); // { 'YYYY-MM': { shiftFilters: [], slots: [] } }
  
  const [slotDetailsCacheStaff, setSlotDetailsCacheStaff] = useState({});
  const [quickSelectLoadingKeyStaff, setQuickSelectLoadingKeyStaff] = useState(null);
  const [selectingAllMonthStaff, setSelectingAllMonthStaff] = useState(false); // ⭐ Loading for staff "Chọn tất cả tháng"
  const [replacementStaffList, setReplacementStaffList] = useState([]);
  const [loadingReplacementStaff, setLoadingReplacementStaff] = useState(false);
  const [selectedReplacementStaff, setSelectedReplacementStaff] = useState(null);
  const [replacementStaffFilter, setReplacementStaffFilter] = useState('all'); // 'all', 'no-conflict', 'has-conflict'
  const [replacementStaffSearchValue, setReplacementStaffSearchValue] = useState('');
  const [replacementStaffSearchTerm, setReplacementStaffSearchTerm] = useState('');

  // ⭐ Slot Selection Modal States for Staff-based Replacement
  const [showSlotSelectionModalStaff, setShowSlotSelectionModalStaff] = useState(false);
  const [slotModalDataStaff, setSlotModalDataStaff] = useState(null); // { date, shiftName, shiftData, slots }
  const [selectedIndividualSlotsStaff, setSelectedIndividualSlotsStaff] = useState([]); // Array of slot IDs
  const [slotModalFilterStaff, setSlotModalFilterStaff] = useState('all'); // 'all', 'assigned', 'unassigned'
  const [loadingSlotModalStaff, setLoadingSlotModalStaff] = useState(false);

  const debouncedRoomSearch = useMemo(
    () => debounce((value) => {
      setRoomSearchTerm(normalizeLower(value));
    }, 300),
    []
  );

  const debouncedStaffSearch = useMemo(
    () => debounce((value) => {
      setStaffSearchTerm(normalizeLower(value));
    }, 300),
    []
  );

  const debouncedReplacementStaffSearch = useMemo(
    () => debounce((value) => {
      setReplacementStaffSearchTerm(normalizeLower(value));
    }, 300),
    []
  );

  const filteredRooms = useMemo(() => {
    if (!roomSearchTerm) {
      return rooms;
    }

    return rooms.filter(room => {
      const keywords = [
        room.name,
        room.roomNumber,
        room.roomCode,
        room.code,
        room.description,
        room.type
      ]
        .map(normalizeLower)
        .filter(Boolean)
        .join(' ');

      return keywords.includes(roomSearchTerm);
    });
  }, [rooms, roomSearchTerm]);

  const filteredAllStaff = useMemo(() => {
    let filtered = allStaff;

    // Filter by role - CHỈ hiển thị staff có role dentist hoặc nurse (hỗ trợ multi-roles)
    filtered = filtered.filter(staff => {
      const roles = staff.assignmentRoles || [];
      return roles.includes('dentist') || roles.includes('nurse');
    });

    // Filter by role selection (hỗ trợ multi-roles)
    if (staffRoleFilter !== 'all') {
      filtered = filtered.filter(staff => {
        const roles = staff.assignmentRoles || [];
        return roles.includes(staffRoleFilter);
      });
    }

    // Filter by schedule status (from staffScheduleMap)
    if (staffAssignmentFilter === 'has-schedule') {
      filtered = filtered.filter(staff => staffScheduleMap[staff._id] === true);
    } else if (staffAssignmentFilter === 'no-schedule') {
      filtered = filtered.filter(staff => staffScheduleMap[staff._id] !== true);
    }

    // Filter by search term
    if (staffSearchTerm) {
      filtered = filtered.filter(staff => staff.searchKeywords?.includes(staffSearchTerm));
    }

    return filtered;
  }, [allStaff, staffSearchTerm, staffRoleFilter, staffAssignmentFilter, staffScheduleMap]);

  const slotSelectionStats = useMemo(() => {
    let selected = 0;
    let total = 0;
    let fullyAssigned = 0;

    // ⭐ Tính tổng slots từ TẤT CẢ CÁC THÁNG (bao gồm tháng hiện tại)
    // Combine slots from monthStateForRoom + selectedSlotsForAssignment (tháng hiện tại)
    const allMonthSlots = [];
    
    // 1. Lấy slots từ các tháng đã lưu trong monthStateForRoom
    Object.values(monthStateForRoom).forEach(monthState => {
      if (monthState?.slots && Array.isArray(monthState.slots)) {
        allMonthSlots.push(...monthState.slots);
      }
    });
    
    // 2. Thêm slots của tháng hiện tại (nếu chưa được lưu vào monthStateForRoom)
    const currentMonthKey = dayjs().add(currentPageForRoom, 'month').format('YYYY-MM');
    if (!monthStateForRoom[currentMonthKey] && selectedSlotsForAssignment.length > 0) {
      allMonthSlots.push(...selectedSlotsForAssignment);
    }

    // Tính tổng từ tất cả slots
    allMonthSlots.forEach(entry => {
      const selectedIds = new Set(entry?.slotIds || []);
      if (selectedIds.size === 0) {
        return;
      }

      selected += selectedIds.size;
      total += entry?.totalSlots || selectedIds.size;

      if (Array.isArray(entry?.slots) && entry.slots.length > 0) {
        entry.slots.forEach(slot => {
          const slotId = resolveSlotId(slot);
          if (!slotId || !selectedIds.has(slotId)) {
            return;
          }

          if (isSlotFullyAssigned(slot)) {
            fullyAssigned += 1;
          }
        });
      }
    });

    return {
      selected,
      total,
      fullyAssigned
    };
  }, [selectedSlotsForAssignment, monthStateForRoom, currentPageForRoom]);

  const totalSelectedSlotCount = slotSelectionStats.selected;
  const totalAvailableSlotCount = slotSelectionStats.total;
  const fullyAssignedSlotCount = slotSelectionStats.fullyAssigned;

  // ⭐ Check if ALL selected slots are fully assigned (both dentist and nurse)
  const allSlotsFullyAssigned = useMemo(() => {
    if (totalSelectedSlotCount === 0) return false;
    return fullyAssignedSlotCount === totalSelectedSlotCount;
  }, [totalSelectedSlotCount, fullyAssignedSlotCount]);

  // ⭐ Determine button enable state
  // - If ALL slots fully assigned → need at least 1 (dentist OR nurse)
  // - If ANY slot NOT fully assigned → need BOTH (dentist AND nurse)
  const canConfirmAssignment = useMemo(() => {
    if (totalSelectedSlotCount === 0) return false;
    
    // 🔧 Xử lý cho phòng không yêu cầu dentist hoặc nurse
    const requiresDentist = maxDentists > 0;
    const requiresNurse = maxNurses > 0;
    
    if (allSlotsFullyAssigned) {
      // All slots fully assigned → allow update with at least 1 staff
      return selectedDentists.length > 0 || selectedNurses.length > 0;
    } else {
      // Some slots not fully assigned → validate theo yêu cầu của phòng
      if (requiresDentist && requiresNurse) {
        // Phòng yêu cầu cả dentist và nurse
        return selectedDentists.length > 0 && selectedNurses.length > 0;
      } else if (requiresDentist) {
        // Chỉ yêu cầu dentist (maxNurses = 0)
        return selectedDentists.length > 0;
      } else if (requiresNurse) {
        // Chỉ yêu cầu nurse (maxDentists = 0)
        return selectedNurses.length > 0;
      }
      // Không yêu cầu gì (không thể xảy ra vì backend validate tổng >= 1)
      return false;
    }
  }, [allSlotsFullyAssigned, totalSelectedSlotCount, selectedDentists, selectedNurses, maxDentists, maxNurses]);

  const createSlotKey = useCallback((dateStr, shiftName) => `${dateStr}-${shiftName}`, []);

  const getShiftSelectionEntry = useCallback((dateStr, shiftName) => {
    const key = createSlotKey(dateStr, shiftName);
    return selectedSlotsForAssignment.find(entry => entry.slotKey === key) || null;
  }, [selectedSlotsForAssignment, createSlotKey]);

  const updateShiftSelection = useCallback((dateStr, shiftName, slots, slotIds) => {
    const slotKey = createSlotKey(dateStr, shiftName);
    const normalizedSlots = normalizeSlotList(slots);
    const normalizedSlotIds = Array.isArray(slotIds)
      ? slotIds.map(id => id).filter(Boolean)
      : [];
    const uniqueSlotIds = Array.from(new Set(normalizedSlotIds));

    setSelectedSlotsForAssignment(prev => {
      const prevEntry = prev.find(entry => entry.slotKey === slotKey);
      const others = prev.filter(entry => entry.slotKey !== slotKey);

      if (uniqueSlotIds.length === 0) {
        return others;
      }

      const fallbackSlots = normalizedSlots.length > 0
        ? normalizedSlots
        : normalizeSlotList(prevEntry?.slots);
      const totalSlots = fallbackSlots.length || prevEntry?.totalSlots || uniqueSlotIds.length;
      const assignedSlotIds = fallbackSlots.length > 0
        ? fallbackSlots.filter(slot => slot?.dentist || slot?.nurse).map(resolveSlotId).filter(Boolean)
        : prevEntry?.assignedSlotIds || [];

      const newEntry = {
        slotKey,
        date: dateStr,
        shiftName,
        slotIds: uniqueSlotIds,
        totalSlots,
        slots: fallbackSlots,
        assignedSlotIds,
      };

      return [...others, newEntry];
    });
  }, [createSlotKey]);

  // ⭐ Helper functions để lưu và khôi phục state theo tháng (Room-based)
  const saveMonthStateForRoom = useCallback((monthKey) => {
    setMonthStateForRoom(prev => ({
      ...prev,
      [monthKey]: {
        shiftFilters: [...selectedShiftFilters],
        slots: [...selectedSlotsForAssignment]
      }
    }));
  }, [selectedShiftFilters, selectedSlotsForAssignment]);

  const restoreMonthStateForRoom = useCallback((monthKey) => {
    const savedState = monthStateForRoom[monthKey];
    if (savedState) {
      // Khôi phục state đã lưu
      setSelectedShiftFilters(savedState.shiftFilters || []);
      setSelectedSlotsForAssignment(savedState.slots || []);
      return true;
    }
    // Không có state đã lưu → reset về mặc định
    setSelectedShiftFilters([]);
    setSelectedSlotsForAssignment([]);
    return false;
  }, [monthStateForRoom]);

  // ⭐ Helper functions để lưu và khôi phục state theo tháng (Staff-based)
  const saveMonthStateForStaff = useCallback((monthKey) => {
    setMonthStateForStaff(prev => ({
      ...prev,
      [monthKey]: {
        shiftFilters: [...selectedShiftFiltersStaff],
        slots: [...selectedSlotsForReplacement]
      }
    }));
  }, [selectedShiftFiltersStaff, selectedSlotsForReplacement]);

  const restoreMonthStateForStaff = useCallback((monthKey) => {
    const savedState = monthStateForStaff[monthKey];
    if (savedState) {
      // Khôi phục state đã lưu
      setSelectedShiftFiltersStaff(savedState.shiftFilters || []);
      setSelectedSlotsForReplacement(savedState.slots || []);
      return true;
    }
    // Không có state đã lưu → reset về mặc định
    setSelectedShiftFiltersStaff([]);
    setSelectedSlotsForReplacement([]);
    return false;
  }, [monthStateForStaff]);

  const toggleSingleSlotSelection = useCallback((dateObj, shiftName, slots, slotId) => {
    if (!slotId) return;
    const dateStr = dateObj.format('YYYY-MM-DD');
    const currentEntry = getShiftSelectionEntry(dateStr, shiftName);
    const currentIds = new Set(currentEntry?.slotIds || []);

    const slotKey = createSlotKey(dateStr, shiftName);
    const rawSlots = Array.isArray(slots) && slots.length > 0
      ? slots
      : currentEntry?.slots || slotDetailsCache[slotKey] || [];
    const effectiveSlots = normalizeSlotList(rawSlots);

    if (effectiveSlots.length === 0) return;

    if (currentIds.has(slotId)) {
      currentIds.delete(slotId);
    } else {
      currentIds.add(slotId);
    }

    updateShiftSelection(dateStr, shiftName, effectiveSlots, Array.from(currentIds));
  }, [getShiftSelectionEntry, updateShiftSelection, slotDetailsCache, createSlotKey]);

  const toggleFilteredSlotSelection = useCallback((dateObj, shiftName, slots, slotIds, shouldSelect) => {
    if (!Array.isArray(slotIds) || slotIds.length === 0) return;
    const dateStr = dateObj.format('YYYY-MM-DD');
    const currentEntry = getShiftSelectionEntry(dateStr, shiftName);
    const currentIds = new Set(currentEntry?.slotIds || []);

    const slotKey = createSlotKey(dateStr, shiftName);
    const rawSlots = Array.isArray(slots) && slots.length > 0
      ? slots
      : currentEntry?.slots || slotDetailsCache[slotKey] || [];
    const effectiveSlots = normalizeSlotList(rawSlots);

    if (effectiveSlots.length === 0) return;

    slotIds.forEach(id => {
      if (!id) return;
      if (shouldSelect) {
        currentIds.add(id);
      } else {
        currentIds.delete(id);
      }
    });

    updateShiftSelection(dateStr, shiftName, effectiveSlots, Array.from(currentIds));
  }, [getShiftSelectionEntry, updateShiftSelection, slotDetailsCache, createSlotKey]);
  
  useEffect(() => {
    if (activeTab === 'room-based') {
      fetchRooms();
    } else if (activeTab === 'staff-based') {
      fetchAllStaff();
    }
  }, [roomActiveFilter, scheduleStatusFilter, activeTab, staffAssignmentFilter, staffRoleFilter, roomSearchTerm]); // 🔥 Add roomSearchTerm

  useEffect(() => {
    if (roomCalendarData?.shiftOverview) {
      const shiftNames = Object.keys(roomCalendarData.shiftOverview);
      setAvailableShiftKeys(shiftNames);

      setSelectedShiftFilters(prev => {
        const stillValid = prev.filter(name => shiftNames.includes(name));
        return stillValid;
      });
    } else {
      setAvailableShiftKeys([]);
      setSelectedShiftFilters([]);
    }
  }, [roomCalendarData]);

  useEffect(() => {
    if (selectedSubRoom) {
      setMaxDentists(1);
      setMaxNurses(1);
      setSelectedDentists(prev => prev.slice(0, 1));
      setSelectedNurses(prev => prev.slice(0, 1));
      return;
    }

    if (selectedRoom) {
      // 🔧 Sử dụng ?? thay vì || để cho phép giá trị 0
      const dentistLimit = selectedRoom?.maxDentists ?? selectedRoom?.maxDoctors ?? 1;
      const nurseLimit = selectedRoom?.maxNurses ?? 1;
      setMaxDentists(dentistLimit);
      setMaxNurses(nurseLimit);
      
      // 🔧 Clear selection nếu limit = 0, ngược lại trim về limit
      setSelectedDentists(prev => dentistLimit === 0 ? [] : prev.slice(0, dentistLimit));
      setSelectedNurses(prev => nurseLimit === 0 ? [] : prev.slice(0, nurseLimit));
    } else {
      setMaxDentists(1);
      setMaxNurses(1);
      setSelectedDentists([]);
      setSelectedNurses([]);
    }
  }, [selectedRoom, selectedSubRoom]);

  // Handle shift filter change (no auto-selection)
  const handleShiftFilterChange = (newFilters) => {
    const removedShifts = selectedShiftFilters.filter(sf => !newFilters.includes(sf));

    setSelectedShiftFilters(newFilters);

    if (removedShifts.length > 0) {
      setSelectedSlotsForAssignment(prev => prev.filter(entry => !removedShifts.includes(entry.shiftName)));
    }
  };

  // Keep old useEffect for backward compatibility (but won't fire if using handleShiftFilterChange)
  useEffect(() => {
    // This is now handled in handleShiftFilterChange
    // setSelectedSlotsForAssignment([]);
  }, [selectedShiftFilters]);

  // ⭐ Auto-load staff when slots are selected
  useEffect(() => {
    if (totalSelectedSlotCount > 0) {
      proceedToAssignStaff();
    } else {
      // Clear staff list when no slots selected
      setStaffList([]);
    }
  }, [totalSelectedSlotCount]);

  // ⭐ Clear cache when switching rooms/subrooms to prevent data pollution
  useEffect(() => {
    setSlotDetailsCache({});
    setSlotDetailsCacheStaff({});
  }, [selectedRoom, selectedSubRoom]);

  // Fetch rooms with schedule info
  const fetchRooms = async () => {
    setLoading(true);
    try {
      // 🔥 When searching, fetch ALL rooms to enable search across all data
      const shouldFetchAll = roomSearchTerm.trim() !== '';
      
      const response = await roomService.getRoomsForSchedule({
        page: 1,
        limit: shouldFetchAll ? 9999 : 20, // Fetch all when searching
        isActive: roomActiveFilter !== 'all' ? roomActiveFilter : undefined
      });

      if (response.success) {
        // Backend trả về data: { rooms: [...], total, page, ... }
        let filteredRooms = response.data?.rooms || [];
        
        // Apply schedule status filter - 🔧 FIX: Dùng hasBeenUsed thay vì hasSchedule
        if (scheduleStatusFilter === 'has-schedule') {
          filteredRooms = filteredRooms.filter(room => room.hasBeenUsed);
        } else if (scheduleStatusFilter === 'no-schedule') {
          filteredRooms = filteredRooms.filter(room => !room.hasBeenUsed);
        }
        
        setRooms(filteredRooms);
      } else {
        toast.error(response.message || 'Lỗi khi tải danh sách phòng');
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách phòng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all staff for Workflow 2
  const fetchAllStaff = async () => {
    setLoadingAllStaff(true);
    try {
      const response = await userService.getAllStaff(1, 1000);
      
      if (response.success) {
        let normalizedStaff = (response.users || []).map(normalizeStaffRecord);
        setAllStaff(normalizedStaff);

        // 🆕 Check schedule for all staff (group by role)
        const dentists = normalizedStaff.filter(s => staffHasRole(s, 'dentist'));
        const nurses = normalizedStaff.filter(s => staffHasRole(s, 'nurse'));
        
        const scheduleMap = {};
        
        // Check dentists
        if (dentists.length > 0) {
          try {
            const dentistIds = dentists.map(d => d._id);
            const dentistScheduleResponse = await slotService.checkStaffHasSchedule(dentistIds, 'dentist');
            if (dentistScheduleResponse.success) {
              dentistScheduleResponse.data.forEach(item => {
                // 🔥 Use OR logic for multi-role users: if has schedule in ANY role, show as hasSchedule
                scheduleMap[item.staffId] = scheduleMap[item.staffId] || item.hasSchedule;
              });
            }
          } catch (error) {
            console.error('Error checking dentist schedules:', error);
          }
        }
        
        // Check nurses
        if (nurses.length > 0) {
          try {
            const nurseIds = nurses.map(n => n._id);
            const nurseScheduleResponse = await slotService.checkStaffHasSchedule(nurseIds, 'nurse');
            if (nurseScheduleResponse.success) {
              nurseScheduleResponse.data.forEach(item => {
                // 🔥 Use OR logic for multi-role users: if has schedule in ANY role, show as hasSchedule
                scheduleMap[item.staffId] = scheduleMap[item.staffId] || item.hasSchedule;
              });
            }
          } catch (error) {
            console.error('Error checking nurse schedules:', error);
          }
        }
        
        setStaffScheduleMap(scheduleMap);
      } else {
        toast.error(response.message || 'Lỗi khi tải danh sách nhân sự');
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách nhân sự: ' + error.message);
    } finally {
      setLoadingAllStaff(false);
    }
  };

  // Handle select staff for viewing schedule (Workflow 2)
  const handleSelectStaffForReplacement = async (staff) => {
    // 🔥 Check if staff has multiple roles
    const assignmentRoles = staff.assignmentRoles || [staff.assignmentRole || staff.role];
    const validRoles = assignmentRoles.filter(r => r === 'dentist' || r === 'nurse');
    
    if (validRoles.length > 1) {
      // Multi-role user → Show role selection modal
      setPendingStaffForRoleSelection(staff);
      setShowRoleSelectionModal(true);
    } else {
      // Single role → Directly show schedule
      const role = validRoles[0] || staff.assignmentRole || staff.role;
      await openStaffScheduleModal(staff, role);
    }
  };
  
  // 🆕 Open staff schedule modal with selected role
  const openStaffScheduleModal = async (staff, role) => {
    setSelectedStaffForReplacement(staff);
    setSelectedRoleForViewing(role);
    setShowStaffScheduleModal(true);
    setCurrentPageForStaff(0); // Reset về tháng hiện tại
    setSelectedSlotsForReplacement([]); // Clear selections
    setSelectedShiftFiltersStaff([]); // Reset shift filters
    
    // ⭐ Reset month state khi chọn nhân sự mới
    setMonthStateForStaff({});
    
    await fetchStaffCalendar(staff._id, role, 0);
  };

  // Fetch staff calendar theo tháng (tương tự fetchRoomCalendar)
  const fetchStaffCalendar = async (staffId, role, pageOverride = null) => {
    setLoadingStaffSchedule(true);
    try {
      const targetPage = typeof pageOverride === 'number' ? pageOverride : currentPageForStaff;
      const startDate = dayjs().add(targetPage, 'month').startOf('month');
      setCurrentMonthForStaff(startDate);
      if (typeof pageOverride === 'number') {
        setCurrentPageForStaff(pageOverride);
      }
      
      const params = {
        viewType: 'month',
        page: 0,
        startDate: startDate.format('YYYY-MM-DD'),
        futureOnly: true  // ⭐ Only fetch future slots for staff assignment
      };
      
      let response;
      if (role === 'dentist' || role === 'doctor') {
        response = await slotService.getDentistCalendar(staffId, params);
      } else if (role === 'nurse') {
        response = await slotService.getNurseCalendar(staffId, params);
      } else {
        throw new Error(`Invalid role: ${role}. Must be dentist, doctor, or nurse.`);
      }
      
      if (!response || !response.success) {
        throw new Error(response?.message || 'Không thể tải lịch làm việc');
      }
      
      const normalizedData = {
        ...response?.data,
        periods: Array.isArray(response?.data?.periods) ? response.data.periods : []
      };
      
      setStaffCalendarData(normalizedData);
      
      // Extract available shift names from periods data
      const shiftsSet = new Set();
      if (normalizedData.periods && normalizedData.periods.length > 0) {
        normalizedData.periods.forEach(period => {
          if (period.days && Array.isArray(period.days)) {
            period.days.forEach(day => {
              if (day.shifts) {
                Object.keys(day.shifts).forEach(shiftName => {
                  if (day.shifts[shiftName].totalSlots > 0) {
                    shiftsSet.add(shiftName);
                  }
                });
              }
            });
          }
        });
      }
      
      const shiftNames = Array.from(shiftsSet);
      if (shiftNames.length > 0) {
        setAvailableShiftKeysStaff(shiftNames);
        setSelectedShiftFiltersStaff([]); // DON'T auto-select - let user choose
      } else {
        toast.warning('Nhân sự này chưa có lịch làm việc trong tháng này');
        setAvailableShiftKeysStaff([]);
        setSelectedShiftFiltersStaff([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading staff calendar:', error);
      toast.error('Lỗi khi tải lịch: ' + error.message);
      setStaffCalendarData(null);
      setAvailableShiftKeysStaff([]);
      setSelectedShiftFiltersStaff([]);
    } finally {
      setLoadingStaffSchedule(false);
    }
  };

  // Month navigation for staff calendar (tương tự room calendar)
  const goToPreviousMonthForStaff = () => {
    if (currentPageForStaff > 0) {
      // ⭐ Lưu state của tháng hiện tại trước khi chuyển
      const currentMonthKey = dayjs().add(currentPageForStaff, 'month').format('YYYY-MM');
      saveMonthStateForStaff(currentMonthKey);
      
      const targetPage = currentPageForStaff - 1;
      const targetMonthKey = dayjs().add(targetPage, 'month').format('YYYY-MM');
      
      setCurrentPageForStaff(targetPage);
      
      // ⭐ Khôi phục state của tháng mới (nếu có)
      restoreMonthStateForStaff(targetMonthKey);
      
      if (selectedStaffForReplacement) {
        fetchStaffCalendar(
          selectedStaffForReplacement._id,
          selectedStaffForReplacement.assignmentRole || selectedStaffForReplacement.role,
          targetPage
        );
      }
    }
  };

  const goToNextMonthForStaff = () => {
    // ⭐ Lưu state của tháng hiện tại trước khi chuyển
    const currentMonthKey = dayjs().add(currentPageForStaff, 'month').format('YYYY-MM');
    saveMonthStateForStaff(currentMonthKey);
    
    const targetPage = currentPageForStaff + 1;
    const targetMonthKey = dayjs().add(targetPage, 'month').format('YYYY-MM');
    
    setCurrentPageForStaff(targetPage);
    
    // ⭐ Khôi phục state của tháng mới (nếu có)
    restoreMonthStateForStaff(targetMonthKey);
    
    if (selectedStaffForReplacement) {
      fetchStaffCalendar(
        selectedStaffForReplacement._id,
        selectedStaffForReplacement.assignmentRole || selectedStaffForReplacement.role,
        targetPage
      );
    }
  };

  const goToSpecificMonthForStaff = (date) => {
    if (!date) return;
    
    // ⭐ Lưu state của tháng hiện tại trước khi chuyển
    const currentMonthKey = dayjs().add(currentPageForStaff, 'month').format('YYYY-MM');
    saveMonthStateForStaff(currentMonthKey);
    
    const now = dayjs().startOf('month');
    const targetMonth = dayjs(date).startOf('month');
    const monthDiff = targetMonth.diff(now, 'month');
    const targetMonthKey = targetMonth.format('YYYY-MM');
    
    setCurrentPageForStaff(monthDiff);
    setCurrentMonthForStaff(targetMonth);
    
    // ⭐ Khôi phục state của tháng mới (nếu có)
    restoreMonthStateForStaff(targetMonthKey);
    
    if (selectedStaffForReplacement) {
      fetchStaffCalendar(
        selectedStaffForReplacement._id,
        selectedStaffForReplacement.assignmentRole || selectedStaffForReplacement.role,
        monthDiff
      );
    }
  };

  // Get month days for staff calendar
  const getMonthDaysForStaff = () => {
    const days = [];
    const reference = currentMonthForStaff || (staffCalendarData?.periods?.[0]?.startDate
      ? dayjs(staffCalendarData.periods[0].startDate)
      : dayjs().add(currentPageForStaff, 'month'));
    const startOfMonth = reference.startOf('month');
    
    const daysInMonth = startOfMonth.daysInMonth();
    for (let i = 0; i < daysInMonth; i++) {
      days.push(startOfMonth.add(i, 'day'));
    }
    return days;
  };

  // Get day data from staff calendar
  const getStaffDayData = (date) => {
    if (!staffCalendarData?.periods?.[0]?.days) return null;
    const dateStr = date.format('YYYY-MM-DD');
    return staffCalendarData.periods[0].days.find(day => day?.date === dateStr) || null;
  };

  // ========== STAFF CALENDAR SLOT SELECTION LOGIC (Tương tự Room Calendar) ==========
  
  // Helper: Tạo slot key
  const createSlotKeyForStaff = (date, shiftName) => `${date}-${shiftName}`;

  // Helper: Lấy entry của shift đã chọn
  const getShiftSelectionEntryForStaff = (date, shiftName) => {
    const slotKey = createSlotKeyForStaff(date, shiftName);
    return selectedSlotsForReplacement.find(entry => entry.slotKey === slotKey);
  };

  // Helper: Cập nhật shift selection
  const updateShiftSelectionForStaff = (date, shiftName, slots, slotIds) => {
    const slotKey = createSlotKeyForStaff(date, shiftName);
    const totalSlots = slots?.length || 0;

    setSelectedSlotsForReplacement(prev => {
      const filtered = prev.filter(entry => entry.slotKey !== slotKey);
      if (slotIds.length === 0) {
        return filtered;
      }
      return [...filtered, {
        slotKey,
        date,
        shiftName,
        slotIds: [...slotIds],
        totalSlots,
        slots: normalizeSlotList(slots)
      }];
    });
  };

  // Handle shift filter change for staff
  const handleShiftFilterChangeForStaff = (newFilters) => {
    const removedShifts = selectedShiftFiltersStaff.filter(sf => !newFilters.includes(sf));
    
    setSelectedShiftFiltersStaff(newFilters);

    // Xóa các slot đã chọn của shift bị bỏ
    if (removedShifts.length > 0) {
      setSelectedSlotsForReplacement(prev =>
        prev.filter(entry => !removedShifts.includes(entry.shiftName))
      );
    }
  };

  // Fetch slot details for staff (tương tự fetchSlotDetails cho room)
  const fetchSlotDetailsForStaff = async (date, shiftName, shiftData) => {
    const dateStr = date.format('YYYY-MM-DD');
    const cacheKey = createSlotKeyForStaff(dateStr, shiftName);
    
    if (slotDetailsCacheStaff[cacheKey]) {
      return normalizeSlotList(slotDetailsCacheStaff[cacheKey]);
    }
    
    if (shiftData?.slots && Array.isArray(shiftData.slots) && shiftData.slots.length > 0) {
      const normalized = normalizeSlotList(shiftData.slots);
      setSlotDetailsCacheStaff(prev => ({ ...prev, [cacheKey]: normalized }));
      return normalized;
    }
    
    // Fetch from API
    try {
      const params = {
        date: dateStr,
        shiftName: shiftName
      };
      
      const role = selectedStaffForReplacement?.assignmentRole || selectedStaffForReplacement?.role;
      
      let response;
      if (role === 'dentist' || role === 'doctor') {
        response = await slotService.getDentistSlotsFuture(selectedStaffForReplacement._id, params);
      } else if (role === 'nurse') {
        response = await slotService.getNurseSlotsFuture(selectedStaffForReplacement._id, params);
      } else {
        console.error('❌ Invalid role:', role);
        return [];
      }
      
      if (response?.success && response?.data?.slots) {
        const normalized = normalizeSlotList(response.data.slots);
        setSlotDetailsCacheStaff(prev => ({ ...prev, [cacheKey]: normalized }));
        return normalized;
      } else if (response?.data?.slots) {
        // Backend might return data directly without success wrapper
        const normalized = normalizeSlotList(response.data.slots);
        setSlotDetailsCacheStaff(prev => ({ ...prev, [cacheKey]: normalized }));
        return normalized;
      }
    } catch (error) {
      console.error('❌ Error fetching staff slot details:', error);
    }
    
    return [];
  };

  // Toggle single slot selection for staff
  const toggleSingleSlotSelectionForStaff = (date, shiftName, slots, slotId) => {
    const dateStr = typeof date === 'string' ? date : date.format('YYYY-MM-DD');
    const existing = getShiftSelectionEntryForStaff(dateStr, shiftName);
    const currentIds = existing?.slotIds || [];
    
    let newIds;
    if (currentIds.includes(slotId)) {
      newIds = currentIds.filter(id => id !== slotId);
    } else {
      newIds = [...currentIds, slotId];
    }
    
    updateShiftSelectionForStaff(dateStr, shiftName, slots, newIds);
  };

  // Toggle filtered slots for staff
  const toggleFilteredSlotSelectionForStaff = (date, shiftName, slots, slotIds, checked) => {
    const dateStr = typeof date === 'string' ? date : date.format('YYYY-MM-DD');
    const existing = getShiftSelectionEntryForStaff(dateStr, shiftName);
    const currentIds = existing?.slotIds || [];
    
    let newIds;
    if (checked) {
      newIds = [...new Set([...currentIds, ...slotIds])];
    } else {
      newIds = currentIds.filter(id => !slotIds.includes(id));
    }
    
    updateShiftSelectionForStaff(dateStr, shiftName, slots, newIds);
  };

  // Toggle entire shift for staff
  const handleToggleEntireShiftForStaff = async (date, shiftName, shiftData, shiftEndTime) => {
    const dateStr = date.format('YYYY-MM-DD');

    const cacheKey = createSlotKeyForStaff(dateStr, shiftName);
    let slots = slotDetailsCacheStaff[cacheKey];
    
    if (!slots || slots.length === 0) {
      setQuickSelectLoadingKeyStaff(cacheKey);
      slots = await fetchSlotDetailsForStaff(date, shiftName, shiftData);
      setQuickSelectLoadingKeyStaff(null);
    }

    const existing = getShiftSelectionEntryForStaff(dateStr, shiftName);
    const allSlotIds = slots.map(resolveSlotId).filter(Boolean);
    const currentIds = existing?.slotIds || [];
    
    const isFullySelected = allSlotIds.length > 0 && allSlotIds.every(id => currentIds.includes(id));
    
    if (isFullySelected) {
      updateShiftSelectionForStaff(dateStr, shiftName, slots, []);
    } else {
      updateShiftSelectionForStaff(dateStr, shiftName, slots, allSlotIds);
    }
  };

  // Select all slots for staff calendar
  const handleSelectAllSlotsForStaff = async () => {
    const selectableStats = selectableSlotStatsForStaff;
    
    if (selectableStats.total === 0) {
      if (selectedShiftFiltersStaff.length === 0 && availableShiftKeysStaff.length > 0) {
        toast.warning('Vui lòng chọn ít nhất một ca trước khi chọn tất cả');
      }
      return;
    }

    if (selectableStats.fullySelected === selectableStats.total) {
      setSelectedSlotsForReplacement(prev =>
        prev.filter(slot => !selectableStats.keys.has(slot.slotKey))
      );
      toast.info('Đã bỏ chọn tất cả các ca trong tháng');
      return;
    }

    console.log('🔄 Setting selectingAllMonthStaff to TRUE');
    setSelectingAllMonthStaff(true); // ⭐ Show loading overlay
    
    // ⭐ Give React time to render the loading overlay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ Starting to select all slots for staff...');
    let totalSelected = 0;

    try {
      for (const slot of selectableStats.slots) {
        const existing = getShiftSelectionEntryForStaff(slot.date, slot.shiftName);
        const required = slot.totalSlots || existing?.totalSlots || 0;
        const currentIds = existing?.slotIds || [];
        
        if (currentIds.length >= required) continue;

        const cacheKey = createSlotKeyForStaff(slot.date, slot.shiftName);
        let slots = slotDetailsCacheStaff[cacheKey];
        
        if (!slots || slots.length === 0) {
          const dateDayjs = dayjs(slot.date);
          slots = await fetchSlotDetailsForStaff(dateDayjs, slot.shiftName, slot.shiftData);
        }

        const allSlotIds = slots.map(resolveSlotId).filter(Boolean);
        updateShiftSelectionForStaff(slot.date, slot.shiftName, slots, allSlotIds);
        totalSelected += allSlotIds.length;
      }

      if (totalSelected > 0) {
        toast.success(`Đã chọn tất cả slot khả dụng trong tháng (${totalSelected} slot)`);
      } else {
        toast.info('Tất cả các ca đã được chọn đầy đủ');
      }
    } finally {
      console.log('🔄 Setting selectingAllMonthStaff to FALSE');
      setSelectingAllMonthStaff(false); // ⭐ Hide loading overlay
    }
  };

  // Calculate selectable slot stats for staff
  const selectableSlotStatsForStaff = useMemo(() => {
    const period = staffCalendarData?.periods?.[0];
    if (!period?.days || selectedShiftFiltersStaff.length === 0) {
      return { slots: [], keys: new Set(), total: 0, fullySelected: 0, partiallySelected: 0, metaByKey: new Map() };
    }

    const now = dayjs();
    const startOfMonth = (currentMonthForStaff || (period.startDate ? dayjs(period.startDate) : dayjs())).startOf('month');
    const daysInMonth = startOfMonth.daysInMonth();
    const dayMap = new Map();
    period.days.forEach(day => {
      if (day?.date) {
        dayMap.set(day.date, day);
      }
    });

    const slots = [];
    const metaByKey = new Map();

    for (let i = 0; i < daysInMonth; i += 1) {
      const date = startOfMonth.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const dayData = dayMap.get(dateStr);
      if (!dayData?.shifts) continue;

      Object.entries(dayData.shifts).forEach(([shiftName, shiftData]) => {
        if (!selectedShiftFiltersStaff.includes(shiftName)) return;

        // Backend returns totalSlots directly
        const hasSlots = (shiftData?.totalSlots > 0);
        if (!hasSlots) return;

        const slotKey = `${dateStr}-${shiftName}`;
        const totalSlots = shiftData?.totalSlots || 0;
        slots.push({
          slotKey,
          date: dateStr,
          shiftName,
          shiftData,
          totalSlots
        });
        metaByKey.set(slotKey, { totalSlots, shiftData });
      });
    }

    const keys = new Set(slots.map(slot => slot.slotKey));
    let fullySelected = 0;
    let partiallySelected = 0;

    selectedSlotsForReplacement.forEach(entry => {
      if (!keys.has(entry.slotKey)) return;
      const meta = metaByKey.get(entry.slotKey);
      const required = meta?.totalSlots || entry.totalSlots || 0;
      const selectedCount = entry.slotIds?.length || 0;

      if (required > 0 && selectedCount >= required) {
        fullySelected += 1;
      } else if (selectedCount > 0) {
        partiallySelected += 1;
      }
    });

    return {
      slots,
      keys,
      total: slots.length,
      fullySelected,
      partiallySelected,
      metaByKey
    };
  }, [staffCalendarData, selectedShiftFiltersStaff, selectedSlotsForReplacement, currentMonthForStaff]);

  // Calculate total selected slot count for staff
  const totalSelectedSlotCountForStaff = useMemo(() => {
    let totalCount = 0;
    
    // ⭐ Tính tổng slots từ TẤT CẢ CÁC THÁNG (bao gồm tháng hiện tại)
    // 1. Lấy slots từ các tháng đã lưu trong monthStateForStaff
    Object.values(monthStateForStaff).forEach(monthState => {
      if (monthState?.slots && Array.isArray(monthState.slots)) {
        monthState.slots.forEach(entry => {
          totalCount += (entry.slotIds?.length || 0);
        });
      }
    });
    
    // 2. Thêm slots của tháng hiện tại (nếu chưa được lưu vào monthStateForStaff)
    const currentMonthKey = dayjs().add(currentPageForStaff, 'month').format('YYYY-MM');
    if (!monthStateForStaff[currentMonthKey] && selectedSlotsForReplacement.length > 0) {
      selectedSlotsForReplacement.forEach(entry => {
        totalCount += (entry.slotIds?.length || 0);
      });
    }
    
    return totalCount;
  }, [selectedSlotsForReplacement, monthStateForStaff, currentPageForStaff]);

  // ⭐ Auto-load replacement staff when slots are selected
  useEffect(() => {
    console.log('🔄 useEffect totalSelectedSlotCountForStaff changed:', { 
      totalSelectedSlotCountForStaff,
      listLength: replacementStaffList.length,
      loading: loadingReplacementStaff
    });
    
    if (totalSelectedSlotCountForStaff > 0) {
      console.log('🔄 Auto-loading replacement staff...', { totalSlots: totalSelectedSlotCountForStaff });
      fetchReplacementStaff();
    } else {
      console.log('🔄 Clearing replacement staff list');
      // Clear replacement staff list when no slots selected
      setReplacementStaffList([]);
      setSelectedReplacementStaff(null);
      setReplacementStaffFilter('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSelectedSlotCountForStaff]);

  // Fetch replacement staff with conflict checking
  const fetchReplacementStaff = async () => {
    console.log('🔄 fetchReplacementStaff START');
    
    // ⭐ Check total slots from ALL months instead of just current month
    if (totalSelectedSlotCountForStaff === 0) {
      console.log('⚠️ No slots selected for replacement (checked all months)');
      toast.warning('Vui lòng chọn ít nhất 1 slot để thay thế');
      return;
    }
    
    console.log('🔄 Setting loadingReplacementStaff = TRUE');
    setLoadingReplacementStaff(true);
    try {
      // ⭐ Build slot details from ALL months in monthStateForStaff
      const selectedDetails = [];
      
      // Collect all slot entries from saved months
      const allSlotEntries = [];
      
      Object.values(monthStateForStaff).forEach(monthState => {
        if (monthState?.slots && Array.isArray(monthState.slots)) {
          allSlotEntries.push(...monthState.slots);
        }
      });
      
      // Add current month if not saved
      const currentMonthKey = dayjs().add(currentPageForStaff, 'month').format('YYYY-MM');
      if (!monthStateForStaff[currentMonthKey] && selectedSlotsForReplacement.length > 0) {
        allSlotEntries.push(...selectedSlotsForReplacement);
      }
      
      console.log('📊 Processing slot entries from ALL months:', allSlotEntries.length);
      
      allSlotEntries.forEach(entry => {
        const slotKey = createSlotKeyForStaff(entry.date, entry.shiftName);
        const slotIdSet = new Set(entry.slotIds || []);
        if (slotIdSet.size === 0) return;

        const effectiveSlotsRaw = entry.slots && entry.slots.length > 0
          ? entry.slots
          : slotDetailsCacheStaff[slotKey] || [];
        const effectiveSlots = normalizeSlotList(effectiveSlotsRaw);

        effectiveSlots.forEach(slot => {
          const slotId = resolveSlotId(slot);
          if (!slotId || !slotIdSet.has(slotId)) return;

          // Build detail for conflict checking (same format as buildSlotDetail in room-based)
          const dateStr = entry.date;
          const startCandidate = parseDateTimeSafe(
            dateStr,
            slot?.startDateTime || slot?.startTime,
            slot?.startTimeVN || slot?.startHour,
            null
          );
          const endCandidate = parseDateTimeSafe(
            dateStr,
            slot?.endDateTime || slot?.endTime,
            slot?.endTimeVN || slot?.endHour,
            null
          );
          
          // ⭐ Only use fallback if parsing failed AND we have valid time strings
          let start = startCandidate;
          let end = endCandidate;
          
          if (!start && slot.startTimeVN) {
            start = dayjs(`${dateStr} ${slot.startTimeVN}`, 'YYYY-MM-DD HH:mm');
            if (!start.isValid()) start = null;
          }
          
          if (!end && slot.endTimeVN) {
            end = dayjs(`${dateStr} ${slot.endTimeVN}`, 'YYYY-MM-DD HH:mm');
            if (!end.isValid()) end = null;
          }
          
          // Skip if we still don't have valid times
          if (!start || !end) {
            console.warn('⚠️ Skipping slot due to invalid times:', {
              slotId,
              dateStr,
              startDateTime: slot?.startDateTime,
              endDateTime: slot?.endDateTime,
              startTimeVN: slot?.startTimeVN,
              endTimeVN: slot?.endTimeVN
            });
            return;
          }
          
          const detail = {
            slotId: slotId,
            date: dateStr,
            shiftName: entry.shiftName,
            start: start,
            end: end,
            startTime: start.format('HH:mm'),
            endTime: end.format('HH:mm'),
            roomName: slot?.room?.name || slot?.roomName || null,
            subRoomName: slot?.subRoom?.name || slot?.subRoomName || null,
            roomId: slot?.room?.id || slot?.room?._id || slot?.roomId || null,
            subRoomId: slot?.subRoom?.id || slot?.subRoom?._id || slot?.subRoomId || null,
            room: slot.room,
            subRoom: slot.subRoom
          };
          
          selectedDetails.push(detail);
        });
      });

      if (selectedDetails.length === 0) {
        toast.warning('Không tìm thấy thông tin chi tiết của slot đã chọn');
        return;
      }

      console.log('🎯 Selected details for replacement conflict check:', 
        selectedDetails.slice(0, 3).map(d => ({
          slotId: d.slotId,
          date: d.date,
          shiftName: d.shiftName,
          start: d.start?.format('YYYY-MM-DD HH:mm'),
          end: d.end?.format('YYYY-MM-DD HH:mm'),
          startTime: d.startTime,
          endTime: d.endTime,
          roomId: d.roomId,
          subRoomId: d.subRoomId,
          roomName: d.roomName,
          subRoomName: d.subRoomName
        }))
      );

      console.log(`📊 Total selected details for conflict check: ${selectedDetails.length}`);

      // Get date range for schedule check
      let minDate = null;
      let maxDate = null;

      selectedDetails.forEach(detail => {
        const startDate = detail.start || dayjs(detail.date);
        const endDate = detail.end || dayjs(detail.date);
        if (startDate && (!minDate || startDate.isBefore(minDate))) {
          minDate = startDate;
        }
        if (endDate && (!maxDate || endDate.isAfter(maxDate))) {
          maxDate = endDate;
        }
      });

      // ⭐ Lấy lịch từ HIỆN TẠI trở đi để check conflict (không chỉ trong khoảng slot đã chọn)
      const now = dayjs();
      const fiveMinutesLater = now.add(5, 'minute');

      console.log(`⚡ Checking conflicts for ${selectedDetails.length} replacement slots using optimized API`);

      // ⚡ STEP 1: Call optimized conflict check API
      const conflictResponse = await scheduleService.checkConflictsForSlots({
        slots: selectedDetails.map(d => ({
          date: d.date,
          startTime: d.start.toISOString(),
          endTime: d.end.toISOString(),
          shiftName: d.shiftName
        }))
      });

      if (!conflictResponse.success) {
        toast.error('Không thể kiểm tra xung đột lịch');
        return;
      }

      const { conflictingDentists, conflictingNurses, conflictDetails, staffStats } = conflictResponse.data;
      console.log(`✅ Replacement conflicts found: ${conflictingDentists.length} dentists, ${conflictingNurses.length} nurses`);

      // 🔥 VALIDATION: Check if selectedStaffForReplacement is in multiple roles in selected slots
      const staffIdToReplace = selectedStaffForReplacement?._id;
      const rolesInSelectedSlots = new Set();
      const roleConflictDetails = { asDentist: [], asNurse: [] };
      
      if (staffIdToReplace && conflictDetails[staffIdToReplace]) {
        conflictDetails[staffIdToReplace].forEach(entry => {
          // Check if this conflict is in the selected slots
          const isInSelectedSlots = selectedDetails.some(d => 
            d.slotId === entry.slotId || 
            (d.date === entry.dateStr && d.shiftName === entry.shiftName)
          );
          
          if (isInSelectedSlots) {
            rolesInSelectedSlots.add(entry.assignedAs);
            if (entry.assignedAs === 'dentist') {
              roleConflictDetails.asDentist.push(entry);
            } else if (entry.assignedAs === 'nurse') {
              roleConflictDetails.asNurse.push(entry);
            }
          }
        });
      }
      
      // If staff is in BOTH roles in selected slots, cannot replace
      if (rolesInSelectedSlots.size > 1) {
        const errorMessage = `❌ Không thể thay thế: ${selectedStaffForReplacement.displayName || selectedStaffForReplacement.fullName} đang làm NHIỀU vị trí trong các slot đã chọn!\n\n` +
          `📋 Chi tiết:\n` +
          (roleConflictDetails.asDentist.length > 0 ? `• Nha sỹ: ${roleConflictDetails.asDentist.length} slot\n` : '') +
          (roleConflictDetails.asNurse.length > 0 ? `• Y tá: ${roleConflictDetails.asNurse.length} slot\n` : '') +
          `\n⚠️ Vui lòng chọn các slot mà nhân sự chỉ làm 1 vị trí duy nhất.`;
        
        toast.error(errorMessage, { duration: 6000 });
        setLoadingReplacementStaff(false);
        return;
      }
      
      // Determine the actual role to replace based on selected slots
      const currentRole = rolesInSelectedSlots.size === 1 
        ? Array.from(rolesInSelectedSlots)[0]
        : (selectedStaffForReplacement?.assignmentRole || 
           (selectedStaffForReplacement?.role === 'doctor' ? 'dentist' : selectedStaffForReplacement?.role));

      console.log(`✅ Replacing ${selectedStaffForReplacement.displayName} as ${currentRole}`);

      // ⚡ STEP 2: Get all staff
      const response = await userService.getAllStaff(1, 1000);
      
      if (!response.success) {
        toast.error('Không thể tải danh sách nhân sự');
        return;
      }

      // currentRole already determined in validation above
      const filteredStaff = (response.users || [])
        .map(normalizeStaffRecord)
        .filter(staff => {
          // 🔥 Support multi-role: check if replacement staff has the required role
          return staffHasRole(staff, currentRole) && staff._id !== selectedStaffForReplacement._id;
        });

      // ⚡ STEP 3: Map conflicts to replacement staff (NO LOOP - just Set.has())
      const enrichedStaff = filteredStaff.map(staff => {
        const staffId = staff._id;
        
        // 🔥 NEW LOGIC: Check conflicts in BOTH roles
        // A person cannot work in 2 positions (dentist + nurse) at the same time
        const hasDentistConflict = conflictingDentists.includes(staffId);
        const hasNurseConflict = conflictingNurses.includes(staffId);
        const hasAnyConflict = hasDentistConflict || hasNurseConflict;

        let conflicts = [];
        if (hasAnyConflict && conflictDetails[staffId]) {
          // 🔥 Show ALL conflicts (both dentist and nurse)
          // Because a person cannot work in 2 positions simultaneously
          conflicts = conflictDetails[staffId].filter(entry => {
            // Check if conflict is in the future
            const entryStart = parseDateTimeSafe(
              entry.dateStr,
              entry.startDateTime,
              entry.startTime,
              null
            );
            return entryStart && entryStart.isAfter(fiveMinutesLater);
          });
        }

        return {
          ...staff,
          conflicts,
          canAssign: conflicts.length === 0,
          assignmentStats: staffStats[staffId] || { total: 0, asDentist: 0, asNurse: 0 }
        };
      });
      
      setReplacementStaffList(enrichedStaff);
      setReplacementStaffFilter('all');
      setSelectedReplacementStaff(null); // Clear selection to force user to reselect
      
      const noConflictCount = enrichedStaff.filter(s => s.conflicts.length === 0).length;
      toast.success(`Đã tải ${enrichedStaff.length} nhân sự (${noConflictCount} không trùng lịch)`);
      
      console.log('✅ fetchReplacementStaff SUCCESS', { 
        totalStaff: enrichedStaff.length,
        noConflict: noConflictCount 
      });
      
    } catch (error) {
      console.error('❌ Error fetching replacement staff:', error);
      toast.error('Lỗi khi tải danh sách nhân sự thay thế: ' + error.message);
    } finally {
      console.log('🔄 Setting loadingReplacementStaff = FALSE');
      setLoadingReplacementStaff(false);
    }
  };

  // ⭐ Staff-based: Open slot detail modal
  const handleOpenSlotModalForStaff = async (date, shiftName, shiftData, shiftEndTime) => {
    setLoadingSlotModalStaff(true);
    setShowSlotSelectionModalStaff(true);

    const existingEntry = getShiftSelectionEntryForStaff(date.format('YYYY-MM-DD'), shiftName);
    setSelectedIndividualSlotsStaff(existingEntry?.slotIds || []);
    
    // Fetch detailed slots
    const slots = await fetchSlotDetailsForStaff(date, shiftName, shiftData);
    
    setSlotModalDataStaff({
      date,
      shiftName,
      shiftData,
      shiftEndTime,
      slots
    });
    setLoadingSlotModalStaff(false);
  };

  // Staff-based: Toggle individual slot selection in modal
  const handleToggleSlotForStaff = (slotId) => {
    setSelectedIndividualSlotsStaff(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  // Staff-based: Select/deselect all slots in modal (no filter needed)
  const handleSelectAllModalSlotsForStaff = (checked) => {
    if (checked) {
      const allSlotIds = (slotModalDataStaff?.slots || []).map(resolveSlotId).filter(Boolean);
      setSelectedIndividualSlotsStaff(Array.from(new Set(allSlotIds)));
    } else {
      setSelectedIndividualSlotsStaff([]);
    }
  };

  // Staff-based: Get filtered slots based on filter (REMOVED - không cần filter cho staff-based)
  // Function kept for backward compatibility but now just returns all slots
  const getFilteredModalSlotsForStaff = () => {
    return slotModalDataStaff?.slots || [];
  };

  // Staff-based: Get stats for modal
  const getSlotModalStatsForStaff = () => {
    const totalSlots = slotModalDataStaff?.slots?.length || 0;
    const assignedSlots = slotModalDataStaff?.slots?.filter(slot => slot.dentist || slot.nurse).length || 0;
    const selectedCount = selectedIndividualSlotsStaff.length;
    
    return { totalSlots, assignedSlots, selectedCount };
  };

  // Staff-based: Add selected individual slots to replacement
  const handleAddIndividualSlotsToReplacementForStaff = () => {
    if (!slotModalDataStaff || selectedIndividualSlotsStaff.length === 0) return;

    const dateStr = slotModalDataStaff.date.format('YYYY-MM-DD');
    updateShiftSelectionForStaff(dateStr, slotModalDataStaff.shiftName, slotModalDataStaff.slots, selectedIndividualSlotsStaff);

    toast.success(`Đã chọn ${selectedIndividualSlotsStaff.length} slot để thay thế`);
    setShowSlotSelectionModalStaff(false);
  };

  // 🆕 Remove staff from selected slots (for staff replacement tab)
  const handleRemoveStaffFromReplacementSlots = async () => {
    console.log('🔴 handleRemoveStaffFromReplacementSlots called!');
    console.log('📋 selectedSlotsForReplacement:', selectedSlotsForReplacement);
    console.log('📋 monthStateForStaff:', monthStateForStaff);
    console.log('📋 totalSelectedSlotCountForStaff:', totalSelectedSlotCountForStaff);
    
    if (totalSelectedSlotCountForStaff === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 slot');
      return;
    }

    try {
      const slotIdSet = new Set();
      
      // 🔥 Collect slots from current month first
      selectedSlotsForReplacement.forEach(entry => {
        (entry.slotIds || []).forEach(id => {
          if (id) slotIdSet.add(id);
        });
      });
      
      // 🔥 Also collect from ALL months in monthStateForStaff if needed
      Object.values(monthStateForStaff).forEach(monthState => {
        if (monthState?.slots && Array.isArray(monthState.slots)) {
          monthState.slots.forEach(entry => {
            (entry.slotIds || []).forEach(id => {
              if (id) slotIdSet.add(id);
            });
          });
        }
      });

      const slotIds = Array.from(slotIdSet);
      
      if (slotIds.length === 0) {
        toast.error('Không tìm thấy slot ID để xóa nhân sự');
        return;
      }

      console.log('🗑️ Removing staff from slots:', slotIds);

      const response = await slotService.removeStaffFromSlots({
        slotIds,
        removeDentists: true,
        removeNurses: true
      });

      console.log('✅ API Response:', response);

      if (response.success) {
        toast.success(`Đã xóa nhân sự khỏi ${response.data.modifiedCount} slot!`);
        
        console.log('🔄 Refreshing calendar data...');
        // Clear slot details cache to force refresh
        setSlotDetailsCache({});
        
        // Refresh calendar data
        await fetchStaffCalendar(
          selectedStaffForReplacement._id,
          selectedStaffForReplacement.role
        );
        console.log('✅ Calendar data refreshed');
        
        // ⭐ Reset ALL selections
        setMonthStateForStaff({}); // Clear all month states
        setSelectedShiftFiltersForStaff([]); // Uncheck all shift checkboxes
        setSelectedSlotsForReplacement([]);
        setSelectedReplacementStaff(null);
        
        console.log('✅ All selections cleared');
      } else {
        toast.error(response.message || 'Xóa nhân sự thất bại');
      }
    } catch (error) {
      console.error('Error removing staff:', error);
      toast.error('Lỗi khi xóa nhân sự: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle confirm replacement
  const handleConfirmReplacement = async () => {
    if (!selectedReplacementStaff) {
      toast.warning('Vui lòng chọn nhân sự thay thế');
      return;
    }
    
    if (selectedSlotsForReplacement.length === 0) {
      toast.warning('Vui lòng chọn slot cần thay thế');
      return;
    }
    
    try {
      // ⭐ Extract all slot IDs from ALL months in monthStateForStaff
      const slotIdSet = new Set();
      
      // Collect from saved months
      Object.values(monthStateForStaff).forEach(monthState => {
        if (monthState?.slots && Array.isArray(monthState.slots)) {
          monthState.slots.forEach(entry => {
            (entry.slotIds || []).forEach(id => {
              if (id) slotIdSet.add(id);
            });
          });
        }
      });
      
      // Add current month if not saved
      const currentMonthKey = dayjs().add(currentPageForStaff, 'month').format('YYYY-MM');
      if (!monthStateForStaff[currentMonthKey] && selectedSlotsForReplacement.length > 0) {
        selectedSlotsForReplacement.forEach(entry => {
          (entry.slotIds || []).forEach(id => {
            if (id) slotIdSet.add(id);
          });
        });
      }
      
      const allSlotIds = Array.from(slotIdSet);
      
      console.log('🎯 Collected slot IDs from ALL months:', allSlotIds.length);
      console.log('📊 Total months processed:', Object.keys(monthStateForStaff).length);
      
      if (allSlotIds.length === 0) {
        toast.warning('Không có slot nào được chọn');
        return;
      }
      
      const role = selectedStaffForReplacement.assignmentRole || selectedStaffForReplacement.role;
      
      console.log('🔄 Replacing staff in slots:', {
        totalEntries: selectedSlotsForReplacement.length,
        totalSlotIds: allSlotIds.length,
        oldStaffId: selectedStaffForReplacement._id,
        oldStaffName: selectedStaffForReplacement.displayName || buildStaffDisplayName(selectedStaffForReplacement),
        newStaffId: selectedReplacementStaff._id,
        newStaffName: selectedReplacementStaff.displayName || buildStaffDisplayName(selectedReplacementStaff),
        role: role
      });
      
      // ⭐ Call API to replace staff in selected slots
      const response = await slotService.reassignStaffToSlots({
        slotIds: allSlotIds,
        oldStaffId: selectedStaffForReplacement._id,
        newStaffId: selectedReplacementStaff._id,
        role: role
      });
      
      if (response?.success) {
        toast.success(`Đã thay thế ${allSlotIds.length} slot cho ${selectedReplacementStaff.displayName || buildStaffDisplayName(selectedReplacementStaff)}`);
        
        // Refresh calendar
        await fetchStaffCalendar(
          selectedStaffForReplacement._id, 
          role,
          currentPageForStaff
        );
        
        // ⭐ Reset ALL selections (including month state and shift filters)
        setMonthStateForStaff({}); // Clear all month states
        setSelectedShiftFiltersStaff([]); // Uncheck all shift checkboxes
        setSelectedSlotsForReplacement([]);
        setSelectedReplacementStaff(null);
        setReplacementStaffList([]);
        
        console.log('✅ All replacement selections cleared');
      } else {
        throw new Error(response?.message || 'Không thể thay thế nhân sự');
      }
    } catch (error) {
      console.error('❌ Error replacing staff:', error);
      toast.error('Lỗi khi thay thế nhân sự: ' + error.message);
    }
  };

  // Handle select room for assignment
  const handleSelectRoomForAssignment = async (room, subRoom = null) => {
    setSelectedRoom(room);
    setSelectedSubRoom(subRoom);
    setShowAssignmentModal(true);
    setCurrentPageForRoom(0); // Reset to current month
    setSelectedSlotsForAssignment([]); // Clear selections
    
    // ⭐ Reset month state khi chọn phòng mới
    setMonthStateForRoom({});
    setSelectedShiftFilters([]);
    
    setStaffList([]);
    setSelectedDentists([]);
    setSelectedNurses([]);
    setDentistConflictFilter('all');
    setNurseConflictFilter('all');
    
    // Fetch room calendar data
    await fetchRoomCalendar(room._id, subRoom?._id, 0);
  };

  // Fetch room calendar data (monthly view)
  const fetchRoomCalendar = async (roomId, subRoomId = null, pageOverride = null) => {
    setLoadingRoomCalendar(true);
    setSlotDetailsCache({});
    try {
      const targetPage = typeof pageOverride === 'number' ? pageOverride : currentPageForRoom;
      const startDate = dayjs().add(targetPage, 'month').startOf('month');
      setCurrentMonthForRoom(startDate);
      if (typeof pageOverride === 'number') {
        setCurrentPageForRoom(pageOverride);
      }
      
      const params = {
        viewType: 'month', // Đổi sang month
        page: 0,
        startDate: startDate.format('YYYY-MM-DD'),
        futureOnly: true  // ⭐ Only fetch future slots for staff assignment
      };
      
      if (subRoomId) {
        params.subRoomId = subRoomId;
      }
      
      console.log('🔍 Fetching room calendar (monthly, FUTURE only):', { roomId, params, currentPage: currentPageForRoom });
      
      const response = await slotService.getRoomCalendar(roomId, params);
      
      // console.log('📅 Room calendar response:', response);
      // console.log('📊 Days count:', response?.data?.periods?.[0]?.days?.length);
      
      // Debug: Check each day's shifts
      const normalizedData = {
        ...response?.data,
        shiftOverview: response?.data?.shiftOverview || {},
        periods: Array.isArray(response?.data?.periods) ? response.data.periods : []
      };

      if (normalizedData.periods[0]?.days) {
        const daysWithSlots = normalizedData.periods[0].days.filter(day => {
          const hasMorning = day?.shifts?.['Ca Sáng']?.totalSlots > 0;
          const hasAfternoon = day?.shifts?.['Ca Chiều']?.totalSlots > 0;
          const hasEvening = day?.shifts?.['Ca Tối']?.totalSlots > 0;
          return hasMorning || hasAfternoon || hasEvening;
        });
        
        // console.log('📋 Days with slots:', daysWithSlots.length);
        // console.log('🔍 Shift distribution:');
        
        let morningCount = 0, afternoonCount = 0, eveningCount = 0;
        normalizedData.periods[0].days.forEach(day => {
          if (day?.shifts?.['Ca Sáng']?.totalSlots > 0) morningCount++;
          if (day?.shifts?.['Ca Chiều']?.totalSlots > 0) afternoonCount++;
          if (day?.shifts?.['Ca Tối']?.totalSlots > 0) eveningCount++;
        });
        
        console.log(`  - Ca Sáng: ${morningCount} days have slots`);
        console.log(`  - Ca Chiều: ${afternoonCount} days have slots`);
        console.log(`  - Ca Tối: ${eveningCount} days have slots`);
        
        // const sampleDay = normalizedData.periods[0].days.find(day => day?.date);
        // if (sampleDay) {
        //   console.log('📅 Sample day:', {
        //     date: sampleDay.date,
        //     shifts: {
        //       'Ca Sáng': sampleDay.shifts?.['Ca Sáng'],
        //       'Ca Chiều': sampleDay.shifts?.['Ca Chiều'],
        //       'Ca Tối': sampleDay.shifts?.['Ca Tối']
        //     }
        //   });
        // }
      }
      
      if (response?.success && response?.data) {
        setRoomCalendarData(normalizedData);
        console.log('✅ Calendar data set successfully');
      } else {
        console.error('❌ API returned error:', response);
        toast.error(response?.message || 'Không thể tải lịch phòng');
        setRoomCalendarData(null);
      }
    } catch (error) {
      console.error('❌ Error loading room calendar:', error);
      toast.error('Lỗi khi tải lịch: ' + error.message);
      setRoomCalendarData(null);
    } finally {
      setLoadingRoomCalendar(false);
    }
  };

  // Week navigation for room calendar
  const goToPreviousMonthForRoom = () => {
    // Chỉ cho phép quay lại nếu không ở tháng hiện tại
    if (currentPageForRoom > 0) {
      // ⭐ Lưu state của tháng hiện tại trước khi chuyển
      const currentMonthKey = dayjs().add(currentPageForRoom, 'month').format('YYYY-MM');
      saveMonthStateForRoom(currentMonthKey);
      
      const targetPage = currentPageForRoom - 1;
      const targetMonthKey = dayjs().add(targetPage, 'month').format('YYYY-MM');
      
      setCurrentPageForRoom(targetPage);
      
      // ⭐ Khôi phục state của tháng mới (nếu có)
      restoreMonthStateForRoom(targetMonthKey);
      
      if (selectedRoom) {
        fetchRoomCalendar(selectedRoom._id, selectedSubRoom?._id, targetPage);
      }
    }
  };

  const goToNextMonthForRoom = () => {
    // ⭐ Lưu state của tháng hiện tại trước khi chuyển
    const currentMonthKey = dayjs().add(currentPageForRoom, 'month').format('YYYY-MM');
    saveMonthStateForRoom(currentMonthKey);
    
    const targetPage = currentPageForRoom + 1;
    const targetMonthKey = dayjs().add(targetPage, 'month').format('YYYY-MM');
    
    setCurrentPageForRoom(targetPage);
    
    // ⭐ Khôi phục state của tháng mới (nếu có)
    restoreMonthStateForRoom(targetMonthKey);
    
    if (selectedRoom) {
      fetchRoomCalendar(selectedRoom._id, selectedSubRoom?._id, targetPage);
    }
  };

  // Jump to specific month for room calendar
  const goToSpecificMonthForRoom = (date) => {
    if (!date) return;
    
    // ⭐ Lưu state của tháng hiện tại trước khi chuyển
    const currentMonthKey = dayjs().add(currentPageForRoom, 'month').format('YYYY-MM');
    saveMonthStateForRoom(currentMonthKey);
    
    const now = dayjs().startOf('month');
    const targetMonth = dayjs(date).startOf('month');
    
    // Calculate page offset from current month
    const monthDiff = targetMonth.diff(now, 'month');
    const targetMonthKey = targetMonth.format('YYYY-MM');
    
    setCurrentPageForRoom(monthDiff);
    setCurrentMonthForRoom(targetMonth);
    
    // ⭐ Khôi phục state của tháng mới (nếu có)
    restoreMonthStateForRoom(targetMonthKey);
    
    if (selectedRoom) {
      fetchRoomCalendar(selectedRoom._id, selectedSubRoom?._id, monthDiff);
    }
  };

  // Fetch slot details for a specific date and shift
  const fetchSlotDetails = async (date, shiftName, shiftData) => {
    const dateStr = date.format('YYYY-MM-DD');
    const cacheKey = createSlotKey(dateStr, shiftName);
    
    // Return cached data if available
    if (slotDetailsCache[cacheKey]) {
      return normalizeSlotList(slotDetailsCache[cacheKey]);
    }
    
    // If slots already in shiftData, cache and return
    if (shiftData?.slots && Array.isArray(shiftData.slots) && shiftData.slots.length > 0) {
      const normalized = normalizeSlotList(shiftData.slots);
      setSlotDetailsCache(prev => ({ ...prev, [cacheKey]: normalized }));
      return normalized;
    }
    
    // Otherwise fetch from API - use FUTURE API for staff assignment
    try {
      const params = {
        date: dateStr,
        shiftName: shiftName
      };
      
      if (selectedSubRoom?._id) {
        params.subRoomId = selectedSubRoom._id;
      }
      
      const response = await slotService.getSlotsByDateFuture(selectedRoom._id, params);
      
      console.log('📊 FUTURE Slot details API response:', response);
      console.log('📊 Slots array:', response?.data?.slots);
      
      if (response?.success && response?.data?.slots) {
        // Cache the slots
        const normalized = normalizeSlotList(response.data.slots);
        setSlotDetailsCache(prev => ({ ...prev, [cacheKey]: normalized }));
        return normalized;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching FUTURE slot details:', error);
      return [];
    }
  };
  // Get week days for room calendar
  const getMonthDaysForRoom = () => {
    const days = [];
    const reference = currentMonthForRoom || (roomCalendarData?.periods?.[0]?.startDate
      ? dayjs(roomCalendarData.periods[0].startDate)
      : dayjs().add(currentPageForRoom, 'month'));
    const startOfMonth = reference.startOf('month');
    
    const daysInMonth = startOfMonth.daysInMonth();
    for (let i = 0; i < daysInMonth; i++) {
      days.push(startOfMonth.add(i, 'day'));
    }
    return days;
  };

  // Get day data from room calendar
  const getRoomDayData = (date) => {
    if (!roomCalendarData?.periods?.[0]?.days) return null;
    const dateStr = date.format('YYYY-MM-DD');
  return roomCalendarData?.periods?.[0]?.days?.find(day => day?.date === dateStr) || null;
  };

  // Open slot selection modal
  const handleOpenSlotModal = async (date, shiftName, shiftData, shiftEndTime) => {
  setLoadingSlotModal(true);
  setShowSlotSelectionModal(true);

  const existingEntry = getShiftSelectionEntry(date.format('YYYY-MM-DD'), shiftName);
  setSelectedIndividualSlots(existingEntry?.slotIds || []);
  setSlotModalFilter('all');
    
    // Fetch detailed slots
    const slots = await fetchSlotDetails(date, shiftName, shiftData);
    
    setSlotModalData({
      date,
      shiftName,
      shiftData,
      shiftEndTime,
      slots
    });
    setLoadingSlotModal(false);
  };

  // Toggle individual slot selection
  const handleToggleSlot = (slotId) => {
    setSelectedIndividualSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  // Select/deselect all filtered slots in modal
  const handleSelectAllModalSlots = (checked) => {
    if (checked) {
      const filteredSlotIds = getFilteredModalSlots().map(resolveSlotId).filter(Boolean);
      setSelectedIndividualSlots(Array.from(new Set(filteredSlotIds)));
    } else {
      setSelectedIndividualSlots([]);
    }
  };

  // Get filtered slots based on filter
  const getFilteredModalSlots = () => {
    if (!slotModalData?.slots) return [];
    
    const slots = slotModalData.slots;
    
    if (slotModalFilter === 'assigned') {
      // 🔄 Check array length for assigned staff
      return slots.filter(slot => {
        const hasDentist = Array.isArray(slot?.dentist) ? slot.dentist.length > 0 : Boolean(slot?.dentist);
        const hasNurse = Array.isArray(slot?.nurse) ? slot.nurse.length > 0 : Boolean(slot?.nurse);
        return hasDentist || hasNurse;
      });
    } else if (slotModalFilter === 'unassigned') {
      // 🔄 Check array length for unassigned
      return slots.filter(slot => {
        const hasDentist = Array.isArray(slot?.dentist) ? slot.dentist.length > 0 : Boolean(slot?.dentist);
        const hasNurse = Array.isArray(slot?.nurse) ? slot.nurse.length > 0 : Boolean(slot?.nurse);
        return !hasDentist && !hasNurse;
      });
    }
    return slots;
  };

  // Get stats for modal
  const getSlotModalStats = () => {
    const totalSlots = slotModalData?.slots?.length || 0;
    const assignedSlots = slotModalData?.slots?.filter(slot => slot.dentist || slot.nurse).length || 0;
    const selectedCount = selectedIndividualSlots.length;
    
    return { totalSlots, assignedSlots, selectedCount };
  };

  // Add selected individual slots to assignment
  const handleAddIndividualSlotsToAssignment = () => {
    if (!slotModalData || selectedIndividualSlots.length === 0) return;

    const dateStr = slotModalData.date.format('YYYY-MM-DD');
    updateShiftSelection(dateStr, slotModalData.shiftName, slotModalData.slots, selectedIndividualSlots);

    toast.success(`Đã chọn ${selectedIndividualSlots.length} slot để phân công`);
    setShowSlotSelectionModal(false);
    setSelectedIndividualSlots([]);
  };

  // Handle slot selection for assignment (modified to open modal)
  const handleSlotSelectionForAssignment = (date, shiftName, shiftData, shiftEndTime) => {
    // Check both slots array and totalSlots for compatibility
    const hasSlots = (shiftData?.slots?.length > 0) || (shiftData?.totalSlots > 0);
    if (!hasSlots) return;
    
    // Open modal for individual slot selection
    handleOpenSlotModal(date, shiftName, shiftData, shiftEndTime);
  };

  // Handle checkbox toggle - select/deselect entire shift
  const handleToggleEntireShift = async (date, shiftName, shiftData, shiftEndTime) => {
    const hasSlots = (shiftData?.slots?.length > 0) || (shiftData?.totalSlots > 0);
    if (!hasSlots) return;

    const dateStr = date.format('YYYY-MM-DD');
    
    // Check if any slots from this shift are already selected
    const existingEntry = getShiftSelectionEntry(dateStr, shiftName);
    const totalSlotsInShift = existingEntry?.totalSlots || shiftData?.totalSlots || shiftData?.slots?.length || 0;
    const hasFullSelection = existingEntry && existingEntry.slotIds?.length > 0 && (
      totalSlotsInShift > 0 ? existingEntry.slotIds.length >= totalSlotsInShift : false
    );

    if (hasFullSelection) {
      setSelectedSlotsForAssignment(prev => 
        prev.filter(entry => entry.slotKey !== createSlotKey(dateStr, shiftName))
      );
      toast.info(`Đã bỏ chọn ca ${shiftName}`);
      return;
    }

    // ⭐ Use slots from calendar response (already populated) instead of fetching separately
    const slots = shiftData?.slots || [];

    if (slots.length === 0) {
      toast.warning('Không có slot để chọn');
      return;
    }

  updateShiftSelection(dateStr, shiftName, slots, slots.map(resolveSlotId).filter(Boolean));
    toast.success(`Đã chọn ca ${shiftName} (${slots.length} slot)`);
  };

  const selectableSlotStats = useMemo(() => {
    const period = roomCalendarData?.periods?.[0];
    if (!period?.days || selectedShiftFilters.length === 0) {
      return { slots: [], keys: new Set(), total: 0, fullySelected: 0, partiallySelected: 0, metaByKey: new Map() };
    }

    const startOfMonth = (currentMonthForRoom || (period.startDate ? dayjs(period.startDate) : dayjs())).startOf('month');
    const daysInMonth = startOfMonth.daysInMonth();
    const dayMap = new Map();
    period.days.forEach(day => {
      if (day?.date) {
        dayMap.set(day.date, day);
      }
    });

    const slots = [];
    const metaByKey = new Map();

    for (let i = 0; i < daysInMonth; i += 1) {
      const date = startOfMonth.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const dayData = dayMap.get(dateStr);
      if (!dayData?.shifts) continue;

      Object.entries(dayData.shifts).forEach(([shiftName, shiftData]) => {
        if (!selectedShiftFilters.includes(shiftName)) return;

        const hasSlots = (shiftData?.slots?.length > 0) || (shiftData?.totalSlots > 0);
        if (!hasSlots) return;

        const shiftMeta = roomCalendarData?.shiftOverview?.[shiftName];
        if (!shiftMeta) return;

        // Backend already filters for future slots, so we don't need to check here
        const slotKey = `${dateStr}-${shiftName}`;
        const totalSlots = shiftData?.totalSlots || shiftData?.slots?.length || 0;
        slots.push({
          slotKey,
          date: dateStr,
          shiftName,
          shiftData,
          totalSlots
        });
        metaByKey.set(slotKey, { totalSlots, shiftData });
      });
    }

    const keys = new Set(slots.map(slot => slot.slotKey));
    let fullySelected = 0;
    let partiallySelected = 0;

    selectedSlotsForAssignment.forEach(entry => {
      if (!keys.has(entry.slotKey)) return;
      const meta = metaByKey.get(entry.slotKey);
      const required = meta?.totalSlots || entry.totalSlots || 0;
      const selectedCount = entry.slotIds?.length || 0;

      if (required > 0 && selectedCount >= required) {
        fullySelected += 1;
      } else if (selectedCount > 0) {
        partiallySelected += 1;
      }
    });

    return {
      slots,
      keys,
      total: slots.length,
      fullySelected,
      partiallySelected,
      metaByKey
    };
  }, [roomCalendarData, selectedShiftFilters, selectedSlotsForAssignment, currentMonthForRoom]);

  // Select all slots in room calendar
  const handleSelectAllSlotsForRoom = async () => {
    if (selectableSlotStats.total === 0) {
      if (selectedShiftFilters.length === 0 && availableShiftKeys.length > 0) {
        toast.warning('Vui lòng chọn ít nhất một ca trước khi chọn tất cả');
      }
      return;
    }

    if (selectableSlotStats.fullySelected === selectableSlotStats.total) {
      setSelectedSlotsForAssignment(prev => prev.filter(slot => !selectableSlotStats.keys.has(slot.slotKey)));
      toast.info('Đã bỏ chọn tất cả các ca trong tháng');
      return;
    }

    console.log('🔄 Setting selectingAllMonth to TRUE');
    setSelectingAllMonth(true); // ⭐ Show loading
    
    // ⭐ Give React time to render the loading overlay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ Starting to select all slots...');
    let totalSelected = 0;

    try {
      for (const slot of selectableSlotStats.slots) {
        const existing = getShiftSelectionEntry(slot.date, slot.shiftName);
        const required = slot.totalSlots || existing?.totalSlots || 0;
        const alreadySelected = existing?.slotIds?.length || 0;

        if (required > 0 && alreadySelected >= required) {
          continue;
        }

        const dateObj = dayjs(slot.date);
        const slots = await fetchSlotDetails(dateObj, slot.shiftName, slot.shiftData);
        if (slots.length === 0) continue;

        updateShiftSelection(slot.date, slot.shiftName, slots, slots.map(item => item._id));
        totalSelected += slots.length;
      }

      if (totalSelected > 0) {
        toast.success(`Đã chọn tất cả slot khả dụng trong tháng (${totalSelected} slot)`);
      } else {
        toast.info('Tất cả các ca đã được chọn đầy đủ');
      }
    } finally {
      setSelectingAllMonth(false); // ⭐ Hide loading
    }
  };

  // Proceed to assign staff (show staff list with conflict checking)
  const proceedToAssignStaff = async () => {
    if (totalSelectedSlotCount === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 ca để phân công');
      return;
    }

    const selectedDetails = [];

    // ⭐ Collect slot entries from ALL months in monthStateForRoom
    const allSlotEntries = [];
    
    Object.values(monthStateForRoom).forEach(monthState => {
      if (monthState?.slots && Array.isArray(monthState.slots)) {
        allSlotEntries.push(...monthState.slots);
      }
    });
    
    // Add current month if not saved
    const currentMonthKey = dayjs().add(currentPageForRoom, 'month').format('YYYY-MM');
    if (!monthStateForRoom[currentMonthKey] && selectedSlotsForAssignment.length > 0) {
      allSlotEntries.push(...selectedSlotsForAssignment);
    }
    
    console.log('📊 Processing slot entries from ALL months for assignment:', allSlotEntries.length);

    allSlotEntries.forEach(entry => {
      const slotKey = createSlotKey(entry.date, entry.shiftName);
      const slotIdSet = new Set(entry.slotIds || []);
      if (slotIdSet.size === 0) return;

      const shiftMeta = roomCalendarData?.shiftOverview?.[entry.shiftName] || null;
      const effectiveSlotsRaw = entry.slots && entry.slots.length > 0
        ? entry.slots
        : slotDetailsCache[slotKey] || [];
      const effectiveSlots = normalizeSlotList(effectiveSlotsRaw);

      effectiveSlots.forEach(slot => {
        const slotId = resolveSlotId(slot);
        if (!slotId || !slotIdSet.has(slotId)) return;

        const detail = buildSlotDetail(entry, slot, shiftMeta, selectedRoom, selectedSubRoom);
        if (detail) {
          selectedDetails.push(detail);
        }
      });
    });

    if (selectedDetails.length === 0) {
      toast.warning('Không tìm thấy thông tin chi tiết của slot đã chọn. Vui lòng thử lại.');
      return;
    }

    let minDate = null;
    let maxDate = null;

    selectedDetails.forEach(detail => {
      const startDate = detail.start || dayjs(detail.date);
      const endDate = detail.end || dayjs(detail.date);
      if (startDate && (!minDate || startDate.isBefore(minDate))) {
        minDate = startDate;
      }
      if (endDate && (!maxDate || endDate.isAfter(maxDate))) {
        maxDate = endDate;
      }
    });

    // ⭐ Lấy lịch từ HIỆN TẠI trở đi để check conflict (không chỉ trong khoảng slot đã chọn)
    const now = dayjs();
    const fiveMinutesLater = now.add(5, 'minute');
    const fromDateStr = now.format('YYYY-MM-DD');
    const toDateStr = (maxDate || minDate || dayjs().add(1, 'year')).format('YYYY-MM-DD');

    console.log('📅 Fetching staff schedules for conflict check:', { 
      fromDateStr, 
      toDateStr,
      filterAfter: fiveMinutesLater.format('YYYY-MM-DD HH:mm')
    });

    setLoadingStaff(true);
    try {
      // ⚡ STEP 1: Call optimized conflict check API
      console.log(`⚡ Checking conflicts for ${selectedDetails.length} slots using optimized API`);
      
      const conflictResponse = await scheduleService.checkConflictsForSlots({
        slots: selectedDetails.map(d => ({
          date: d.date,
          startTime: d.start.toISOString(),
          endTime: d.end.toISOString(),
          shiftName: d.shiftName
        }))
      });

      if (!conflictResponse.success) {
        toast.error('Không thể kiểm tra xung đột lịch');
        return;
      }

      const { conflictingDentists, conflictingNurses, conflictDetails, staffStats } = conflictResponse.data;
      console.log(`✅ Conflicts found: ${conflictingDentists.length} dentists, ${conflictingNurses.length} nurses`);

      // ⚡ STEP 2: Get all staff
      const response = await userService.getAllStaff(1, 1000);

      if (!response.success) {
        toast.error('Không thể tải danh sách nhân sự');
        return;
      }

      const filteredStaff = (response.users || [])
        .map(normalizeStaffRecord)
        .filter(staff => staffHasRole(staff, 'dentist') || staffHasRole(staff, 'nurse'));

      // ⚡ STEP 3: Map conflicts to staff (NO LOOP - just Set.has())
      const now = dayjs();
      const fiveMinutesLater = now.add(5, 'minute');
      
      const enrichedStaff = filteredStaff.map(staff => {
        const staffId = staff._id;
        
        // 🔥 FIX: For multi-role users, check conflicts across ALL roles
        // Because a person cannot work in 2 positions at the same time
        // Even if they have both dentist and nurse roles
        
        const staffRoles = staff.assignmentRoles || [staff.assignmentRole || staff.role];
        
        const conflictsByRole = {}; // { dentist: [...], nurse: [...] }
        
        staffRoles.forEach(role => {
          let roleConflicts = [];
          
          // 🔥 Check if staff has ANY conflict (in any role)
          // Because they can't be in 2 places at once, regardless of role
          const hasAnyConflict = conflictingDentists.includes(staffId) || 
                                conflictingNurses.includes(staffId);
          
          if (hasAnyConflict && conflictDetails[staffId]) {
            // 🔥 Show ALL conflicts (both dentist and nurse roles)
            // Because a person cannot work in 2 positions simultaneously
            roleConflicts = conflictDetails[staffId].filter(entry => {
              const entryStart = parseDateTimeSafe(
                entry.dateStr,
                entry.startDateTime,
                entry.startTime,
                null
              );
              const isFuture = entryStart && entryStart.isAfter(fiveMinutesLater);
              
              // 🔥 REMOVED: const isSameRole = entry.assignedAs === role;
              // Don't filter by role - show all conflicts because person can't be in 2 places
              
              return isFuture;
            });
          }
          
          conflictsByRole[role] = roleConflicts;
        });

        return {
          ...staff,
          conflicts: conflictDetails[staffId] || [], // Keep all conflicts for reference
          conflictsByRole, // 🔥 Conflicts separated by role (but showing ALL conflicts for each)
          canAssign: Object.values(conflictsByRole).every(c => c.length === 0),
          assignmentStats: staffStats[staffId] || { total: 0, asDentist: 0, asNurse: 0 }
        };
      });

      setStaffList(enrichedStaff);
      setDentistConflictFilter('all');
      setNurseConflictFilter('all');
      setSelectedDentists(prev => prev.slice(0, maxDentists));
      setSelectedNurses(prev => prev.slice(0, maxNurses));
    } catch (error) {
      console.error('❌ Error in proceedToAssignStaff:', error);
      toast.error('Lỗi khi tải danh sách nhân sự: ' + error.message);
    } finally {
      setLoadingStaff(false);
    }
  };

  // 🆕 Remove staff from selected slots
  const handleRemoveStaffFromSlots = async () => {
    console.log('🔴 handleRemoveStaffFromSlots called!');
    console.log('📋 selectedSlotsForAssignment:', selectedSlotsForAssignment);
    console.log('📋 monthStateForRoom:', monthStateForRoom);
    console.log('📋 totalSelectedSlotCount:', totalSelectedSlotCount);
    
    if (totalSelectedSlotCount === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 slot');
      return;
    }

    try {
      const slotIdSet = new Set();
      
      // 🔥 Collect slots from current month first
      selectedSlotsForAssignment.forEach(slot => {
        (slot.slotIds || []).forEach(id => {
          if (id) slotIdSet.add(id);
        });
      });
      
      // 🔥 Also collect from ALL months in monthStateForRoom if needed
      Object.values(monthStateForRoom).forEach(monthState => {
        if (monthState?.slots && Array.isArray(monthState.slots)) {
          monthState.slots.forEach(slot => {
            (slot.slotIds || []).forEach(id => {
              if (id) slotIdSet.add(id);
            });
          });
        }
      });

      const slotIds = Array.from(slotIdSet);
      
      if (slotIds.length === 0) {
        toast.error('Không tìm thấy slot ID để xóa nhân sự');
        return;
      }

      console.log('🗑️ Removing staff from slots:', slotIds);

      const response = await slotService.removeStaffFromSlots({
        slotIds,
        removeDentists: true,
        removeNurses: true
      });

      console.log('✅ API Response:', response);

      if (response.success) {
        toast.success(`Đã xóa nhân sự khỏi ${response.data.modifiedCount} slot!`);
        
        console.log('🔄 Refreshing calendar data...');
        // Clear slot details cache to force refresh
        setSlotDetailsCache({});
        
        // Refresh calendar data
        await fetchRoomCalendar(selectedRoom._id, selectedSubRoom?._id);
        console.log('✅ Calendar data refreshed');
        
        // ⭐ Reset ALL selections (including month state and shift filters)
        setMonthStateForRoom({}); // Clear all month states
        setSelectedShiftFilters([]); // Uncheck all shift checkboxes
        setSelectedSlotsForAssignment([]);
        setStaffList([]);
        setSelectedDentists([]);
        setSelectedNurses([]);
        
        console.log('✅ All selections cleared');
      } else {
        toast.error(response.message || 'Xóa nhân sự thất bại');
      }
    } catch (error) {
      console.error('Error removing staff:', error);
      toast.error('Lỗi khi xóa nhân sự: ' + (error.response?.data?.message || error.message));
    }
  };

  // Confirm staff assignment
  const handleConfirmAssignment = async () => {
    console.log('🎯 handleConfirmAssignment triggered');
    console.log('📋 selectedSlotsForAssignment:', selectedSlotsForAssignment);
    console.log('👥 selectedDentists:', selectedDentists);
    console.log('🩺 selectedNurses:', selectedNurses);
    
    if (selectedDentists.length === 0 && selectedNurses.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 nhân sự (nha sĩ hoặc Y tá)');
      return;
    }

    if (selectedDentists.length > maxDentists || selectedNurses.length > maxNurses) {
      toast.warning('Vui lòng kiểm tra lại số lượng nhân sự được phép phân công cho phòng này');
      return;
    }
    
    try {
      const slotIdSet = new Set();
      
      // ⭐ Collect slots from ALL months in monthStateForRoom
      Object.values(monthStateForRoom).forEach(monthState => {
        if (monthState?.slots && Array.isArray(monthState.slots)) {
          monthState.slots.forEach(slot => {
            console.log('🔍 Processing slot entry from saved month:', slot);
            (slot.slotIds || []).forEach(id => {
              if (id) {
                console.log('  ➕ Adding slot ID:', id);
                slotIdSet.add(id);
              }
            });
          });
        }
      });
      
      // ⭐ Add current month slots if not yet saved
      const currentMonthKey = dayjs().add(currentPageForRoom, 'month').format('YYYY-MM');
      if (!monthStateForRoom[currentMonthKey] && selectedSlotsForAssignment.length > 0) {
        selectedSlotsForAssignment.forEach(slot => {
          console.log('🔍 Processing slot entry from current month:', slot);
          (slot.slotIds || []).forEach(id => {
            if (id) {
              console.log('  ➕ Adding slot ID:', id);
              slotIdSet.add(id);
            }
          });
        });
      }
      
      const slotIds = Array.from(slotIdSet);
      
      console.log('🎯 Final extracted slot IDs from ALL months:', slotIds);
      console.log('📊 Total months processed:', Object.keys(monthStateForRoom).length);
      
      if (slotIds.length === 0) {
        toast.error('Không tìm thấy slot ID để phân công');
        return;
      }
      
      const assignmentData = {
        slotIds,
        roomId: selectedRoom._id,
        subRoomId: selectedSubRoom?._id
      };
      
      if (selectedDentists.length > 0) {
        assignmentData.dentistIds = selectedDentists;
      }
      
      if (selectedNurses.length > 0) {
        assignmentData.nurseIds = selectedNurses;
      }
      
      console.log('📤 Assignment data to send:', assignmentData);
      
      // Call API to assign staff
      const response = await slotService.assignStaffToSlots(assignmentData);
      
      console.log('✅ API Response:', response);
      
      if (response.success) {
        toast.success(`Đã phân công thành công ${slotIds.length} slot!`);
        
        console.log('🔄 Refreshing calendar data...');
        // Clear slot details cache to force refresh
        setSlotDetailsCache({});
        
        // Refresh calendar data
        await fetchRoomCalendar(selectedRoom._id, selectedSubRoom?._id);
        console.log('✅ Calendar data refreshed');
        
        // ⭐ Reset ALL selections (including month state and shift filters)
        setMonthStateForRoom({}); // Clear all month states
        setSelectedShiftFilters([]); // Uncheck all shift checkboxes
        setSelectedSlotsForAssignment([]);
        setStaffList([]);
        setSelectedDentists([]);
        setSelectedNurses([]);
        
        console.log('✅ All selections cleared');
      } else {
        toast.error(response.message || 'Phân công thất bại');
      }
      
    } catch (error) {
      console.error('❌ Error assigning staff:', error);
      toast.error('Lỗi khi phân công nhân sự: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDentistSelectionChange = (value) => {
    const normalized = normalizeSelectionValue(value);
    if (normalized.length > maxDentists) {
      toast.warning(`Phòng này chỉ cho phép tối đa ${maxDentists} nha sĩ`);
      return;
    }
    setSelectedDentists(normalized);
  };

  const handleNurseSelectionChange = (value) => {
    const normalized = normalizeSelectionValue(value);
    if (normalized.length > maxNurses) {
      toast.warning(`Phòng này chỉ cho phép tối đa ${maxNurses} y tá`);
      return;
    }
    setSelectedNurses(normalized);
  };

  // Table columns
  const columns = [
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.roomNumber}
          </Text>
        </div>
      )
    },
    {
      title: 'Trạng thái lịch',
      dataIndex: 'hasBeenUsed', // 🔧 FIX: Đổi thành hasBeenUsed
      key: 'hasBeenUsed',
      render: (hasBeenUsed) => (
        <Tag 
          color={hasBeenUsed ? 'success' : 'default'}
          icon={hasBeenUsed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {hasBeenUsed ? 'Đã có lịch' : 'Chưa có lịch'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        if (!record.hasBeenUsed) { // 🔧 FIX: Đổi thành hasBeenUsed
          return <Text type="secondary">Chưa có lịch để phân công</Text>;
        }
        
        if (!record.hasSubRooms) {
          return (
            <Button
              type="primary"
              icon={<TeamOutlined />}
              onClick={() => handleSelectRoomForAssignment(record)}
            >
              Phân công
            </Button>
          );
        } else {
          return (
            <Select
              key={`subroom-select-${record._id}`}
              placeholder="Chọn buồng để phân công"
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="subroomsearch"
              filterOption={(input, option) => option?.props?.subroomsearch?.includes(normalizeLower(input))}
              onChange={(subRoomId) => {
                const subRoom = record.subRooms?.find(sr => sr._id === subRoomId);
                // Track the selected value
                setSubroomSelectValues(prev => ({
                  ...prev,
                  [record._id]: subRoomId
                }));
                handleSelectRoomForAssignment(record, subRoom);
              }}
              value={subroomSelectValues[record._id] || undefined}
            >
              {record.subRooms?.map(subRoom => (
                <Option
                  key={subRoom._id}
                  value={subRoom._id}
                  subroomsearch={[
                    subRoom.name,
                    subRoom.roomCode,
                    subRoom.code,
                    subRoom.description
                  ].map(normalizeLower).filter(Boolean).join(' ')}
                >
                  {subRoom.name} {!subRoom.isActive && <Tag color="gray" style={{ marginLeft: 4 }}>Đang tắt</Tag>}
                </Option>
              ))}
            </Select>
          );
        }
      }
    }
  ];

  return (
    <>
      {/* ⭐ Full-screen loading overlay khi chọn tất cả tháng */}
      {selectingAllMonth && (
        (() => {
          console.log('🎨 Rendering loading overlay! selectingAllMonth =', selectingAllMonth);
          return (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 99999,
                pointerEvents: 'all'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, fontSize: 16, fontWeight: 500, color: '#1890ff' }}>
                  Đang chọn tất cả slot trong tháng...
                </div>
              </div>
            </div>
          );
        })()
      )}
      
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <Row align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space align="center">
              <Button
                type="text"
                icon={<ArrowLeftOutlined style={{ fontSize: 20 }} />}
                onClick={() => navigate('/dashboard/schedule')}
                style={{ padding: '4px 8px' }}
              />
              <Title level={3} style={{ margin: 0 }}>
                <TeamOutlined /> Phân công nhân sự
              </Title>
            </Space>
          </Col>
        </Row>

      {/* Main Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        items={[
          {
            key: 'room-based',
            label: (
              <span>
                <HomeOutlined />
                {' '}Phân công theo Phòng
              </span>
            ),
            children: (
              <>
                {/* Filters */}
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={16}>
                  <Col flex="320px">
                    <Input
                      allowClear
                      value={roomSearchValue}
                      placeholder="Tìm kiếm phòng..."
                      prefix={<SearchOutlined />}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRoomSearchValue(value);
                        if (!value) {
                          setRoomSearchTerm('');
                        } else {
                          debouncedRoomSearch(value);
                        }
                      }}
                    />
                  </Col>
                  <Col>
                    <Space>
                      {/* Active Filter */}
                      <Select
                        value={roomActiveFilter}
                        onChange={setRoomActiveFilter}
                        style={{ width: 180 }}
                      >
                        <Option value={true}>Phòng hoạt động</Option>
                        <Option value={false}>Phòng không hoạt động</Option>
                        <Option value="all">Tất cả phòng</Option>
                      </Select>

                      {/* Schedule Status Filter */}
                      <Radio.Group 
                        value={scheduleStatusFilter} 
                        onChange={(e) => setScheduleStatusFilter(e.target.value)}
                        buttonStyle="solid"
                      >
                        <Radio.Button value="all">Tất cả</Radio.Button>
                        <Radio.Button value="has-schedule">Đã có lịch</Radio.Button>
                        <Radio.Button value="no-schedule">Chưa có lịch</Radio.Button>
                      </Radio.Group>

                      <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchRooms}
                        loading={loading}
                      >
                        Làm mới
                      </Button>
                    </Space>
                  </Col>
                </Row>

      {/* Rooms Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredRooms}
          loading={loading}
          rowKey="_id"
          pagination={roomSearchTerm ? false : {
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} phòng`
          }}
        />
      </Card>

      {/* Assignment Modal - Calendar View */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#1890ff' }} />
            <span style={{ color: '#000' }}>
              <strong>Lịch phòng khám:</strong> {selectedSubRoom ? selectedSubRoom.name : selectedRoom?.name}
            </span>
          </Space>
        }
        centered
        bodyStyle={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}
        open={showAssignmentModal}
        onCancel={() => {
          setShowAssignmentModal(false);
          setRoomCalendarData(null);
          setSelectedSlotsForAssignment([]);
          // Reset the dropdown selection for the current room
          if (selectedRoom) {
            setSubroomSelectValues(prev => {
              const updated = {...prev};
              delete updated[selectedRoom._id];
              return updated;
            });
          }
        }}
        footer={null}
        width={1200}
      >
        {loadingRoomCalendar ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : roomCalendarData ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Room Info Card */}
            <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
              <Space direction="vertical" size={0}>
                <Text><strong>Phòng:</strong> {selectedRoom?.name}</Text>
                {selectedSubRoom && (
                  <Text><strong>Buồng:</strong> {selectedSubRoom.name}</Text>
                )}
              </Space>
            </Card>

            {/* Calendar Navigation */}
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <DatePicker
                    picker="month"
                    value={dayjs().add(currentPageForRoom, 'month')}
                    onChange={goToSpecificMonthForRoom}
                    format="MM/YYYY"
                    placeholder="Chọn tháng"
                    disabledDate={(current) => {
                      // Chỉ cho phép chọn từ tháng hiện tại trở đi
                      return current && current < dayjs().startOf('month');
                    }}
                    style={{ width: 150 }}
                  />
                  <Button
                    icon={<LeftOutlined />}
                    onClick={goToPreviousMonthForRoom}
                    disabled={currentPageForRoom === 0}
                  >
                    Tháng trước
                  </Button>
                  <Button
                    icon={<RightOutlined />}
                    onClick={goToNextMonthForRoom}
                  >
                    Tháng sau
                  </Button>
                  <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                    Tháng {dayjs().add(currentPageForRoom, 'month').format('MM/YYYY')}
                  </Tag>
                </Space>
              </Col>
              <Col>
                <Space size="middle" wrap align="center">
                  <Space size={8} align="center">
                    <Text strong>Chọn ca:</Text>
                    <Checkbox.Group
                      options={availableShiftKeys.map(name => ({ label: name, value: name }))}
                      value={selectedShiftFilters}
                      onChange={handleShiftFilterChange}
                      disabled={availableShiftKeys.length === 0}
                    />
                  </Space>
                  <Checkbox
                    checked={selectableSlotStats.total > 0 && selectableSlotStats.fullySelected === selectableSlotStats.total}
                    indeterminate={selectableSlotStats.total > 0 && (selectableSlotStats.fullySelected + selectableSlotStats.partiallySelected > 0) && selectableSlotStats.fullySelected < selectableSlotStats.total}
                    onChange={() => handleSelectAllSlotsForRoom()}
                    disabled={selectableSlotStats.total === 0 || selectingAllMonth}
                  >
                    {selectingAllMonth ? 'Đang chọn...' : 'Chọn tất cả tháng này'}
                  </Checkbox>
                  <Badge count={totalSelectedSlotCount} showZero>
                    <Tag color="blue">Đã chọn slot</Tag>
                  </Badge>
                </Space>
              </Col>
            </Row>

            {roomCalendarData && roomCalendarData?.shiftOverview && Object.keys(roomCalendarData.shiftOverview).length > 0 && selectedShiftFilters.length === 0 && availableShiftKeys.length > 0 && (
              <Alert
                message="Vui lòng chọn ca làm việc"
                description="Bạn cần chọn ít nhất một ca làm việc (Ca Sáng, Ca Chiều, Ca Tối) để có thể phân công nhân sự."
                type="info"
                showIcon
              />
            )}

            {roomCalendarData && selectableSlotStats.total === 0 && selectedShiftFilters.length > 0 && roomCalendarData?.shiftOverview && Object.keys(roomCalendarData.shiftOverview).length > 0 && (
              <Alert
                message="Không có slot khả dụng để phân công"
                description="Tất cả các slot trong tháng này đã qua hoặc không thuộc ca làm việc đã chọn. Vui lòng kiểm tra bộ lọc ca làm việc hoặc chọn tháng khác."
                type="info"
                showIcon
              />
            )}

            {/* Calendar Grid */}
            <div style={{ overflowX: 'auto' }}>
              {!roomCalendarData?.shiftOverview || Object.keys(roomCalendarData.shiftOverview).length === 0 ? (
                <Alert
                  message="Không có dữ liệu lịch"
                  description={
                    <div>
                      <p>Phòng <strong>{selectedSubRoom ? selectedSubRoom.name : selectedRoom?.name}</strong> chưa có lịch được tạo cho tháng này.</p>
                      <p>Vui lòng:</p>
                      <ul style={{ marginBottom: 0 }}>
                        <li>Kiểm tra tại <strong>/schedules/calendar</strong> xem phòng đã có lịch chưa</li>
                        <li>Tạo lịch tại trang <strong>Quản lý lịch</strong> nếu chưa có</li>
                        <li>Hoặc thử chọn tháng khác</li>
                      </ul>
                    </div>
                  }
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              ) : (
                <>
                  {/* Month Calendar View - Organized by weeks */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 16 }}>Lịch theo tháng</Text>
                  </div>
                  {(() => {
                    const monthDays = getMonthDaysForRoom();
                    const weeks = [];
                    let currentWeek = [];
                    
                    // Group days into weeks (starting Monday)
                    monthDays.forEach((date, index) => {
                      if (date.day() === 1 && currentWeek.length > 0) {
                        weeks.push(currentWeek);
                        currentWeek = [];
                      }
                      currentWeek.push(date);
                      
                      if (index === monthDays.length - 1) {
                        weeks.push(currentWeek);
                      }
                    });
                    
                    return weeks.map((week, weekIndex) => (
                      <div key={weekIndex} style={{ marginBottom: 24 }}>
                        <div style={{ 
                          backgroundColor: '#f0f0f0', 
                          padding: '8px 12px', 
                          marginBottom: 8,
                          borderRadius: 4,
                          fontWeight: 'bold'
                        }}>
                          Tuần {weekIndex + 1} ({week[0].format('DD/MM')} - {week[week.length - 1].format('DD/MM')})
                        </div>
                        
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d9d9d9', marginBottom: 16 }}>
                          <thead>
                            <tr style={{ backgroundColor: '#fafafa' }}>
                              <th style={{ padding: '12px', border: '1px solid #d9d9d9', minWidth: '120px' }}>
                                Ca làm việc / Ngày
                              </th>
                              {week.map(date => {
                                const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                                const dayName = dayNames[date.day()];
                                
                                return (
                                  <th key={date.format('YYYY-MM-DD')} style={{ padding: '12px', border: '1px solid #d9d9d9', minWidth: '140px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{date.format('DD/MM')}</div>
                                      <div style={{ fontSize: '12px', color: '#999' }}>
                                        {dayName}
                                      </div>
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.values(roomCalendarData.shiftOverview).map(shift => (
                              <tr key={shift.name}>
                                <td style={{ 
                                  padding: '12px', 
                                  border: '1px solid #d9d9d9', 
                                  backgroundColor: '#fafafa', 
                                  fontWeight: 'bold',
                                  verticalAlign: 'middle'
                                }}>
                                  <div>
                                    <div>{shift.name}</div>
                                    <div style={{ fontSize: '11px', color: '#999', fontWeight: 'normal' }}>
                                      {shift.startTime} - {shift.endTime}
                                    </div>
                                  </div>
                                </td>
                                {week.map(date => {
                                  const dayData = getRoomDayData(date);
                                  const shiftData = dayData?.shifts?.[shift.name];
                                  const dateStr = date.format('YYYY-MM-DD');
                                  
                                  // Check if any individual slots from this shift are selected
                                  const shiftSelection = getShiftSelectionEntry(dateStr, shift.name);
                                  const selectedSlotIds = shiftSelection?.slotIds || [];
                                  const selectedSlotCount = selectedSlotIds.length;
                                  const hasSelectedSlots = selectedSlotCount > 0;
                                  const hasSlots = (shiftData?.slots?.length > 0) || (shiftData?.totalSlots > 0);
                                  
                                  const dentistAssigned = shiftData?.staffStats?.mostFrequentDentist;
                                  const nurseAssigned = shiftData?.staffStats?.mostFrequentNurse;
                                  
                                  // Backend already filters out past slots, no need to check here
                                  let bgColor = '#f5f5f5';
                                  if (hasSlots) {
                                    if (hasSelectedSlots) {
                                      bgColor = '#e6f7ff'; // Highlight if has selected slots
                                    } else {
                                      bgColor = '#fff';
                                    }
                                  }
                                  
                                  const slotCount = shiftData?.slots?.length || shiftData?.totalSlots || 0;
                                  const cacheKey = createSlotKey(date.format('YYYY-MM-DD'), shift.name);
                                  const cachedSlots = slotDetailsCache[cacheKey] || [];
                                  const slotsForInfo = shiftSelection?.slots?.length ? shiftSelection.slots : (cachedSlots.length ? cachedSlots : shiftData?.slots || []);
                                  const totalSlotsInShift = shiftSelection?.totalSlots || slotCount || slotsForInfo.length || 0;
                                  const isEntireShiftSelected = hasSelectedSlots && totalSlotsInShift > 0 && selectedSlotCount >= totalSlotsInShift;
                                  const hasPartialSelection = hasSelectedSlots && !isEntireShiftSelected;
                                  const fullyAssignedCount = Array.isArray(slotsForInfo)
                                    ? slotsForInfo.filter(slot => isSlotFullyAssigned(slot)).length
                                    : 0;
                                  const coverageNumerator = fullyAssignedCount;
                                  const coverageDenominator = totalSlotsInShift || slotCount || slotsForInfo.length || 0;
                                  const slotDetailsForPopover = shiftSelection?.slots?.length ? shiftSelection.slots : cachedSlots;
                                  const isQuickSelectLoading = quickSelectLoadingKey === cacheKey;
                                  
                                  return (
                                    <td 
                                      key={date.format('YYYY-MM-DD')} 
                                      style={{ 
                                        padding: '8px', 
                                        border: '1px solid #d9d9d9',
                                        backgroundColor: bgColor,
                                        cursor: hasSlots ? 'pointer' : 'not-allowed',
                                        verticalAlign: 'top'
                                      }}
                                      onClick={(e) => {
                                        // Don't trigger if clicking on checkbox
                                        if (e.target.type === 'checkbox' || e.target.closest('.ant-checkbox-wrapper')) {
                                          return;
                                        }
                                        if (hasSlots) {
                                          handleSlotSelectionForAssignment(date, shift.name, shiftData, shift.endTime);
                                        }
                                      }}
                                    >
                                      {hasSlots ? (
                                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                          <Checkbox 
                                            checked={isEntireShiftSelected}
                                            indeterminate={hasPartialSelection}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => handleToggleEntireShift(date, shift.name, shiftData, shift.endTime)}
                                          />
                                          
                                          <Popover
                                            trigger={['hover', 'click']}
                                            placement="right"
                                            overlayStyle={{ maxWidth: 360 }}
                                            content={(
                                              <SlotQuickSelect
                                                slots={slotDetailsForPopover}
                                                selectedSlotIds={selectedSlotIds}
                                                loading={isQuickSelectLoading && slotDetailsForPopover.length === 0}
                                                onToggleSlot={(slotId) => toggleSingleSlotSelection(date, shift.name, slotDetailsForPopover, slotId)}
                                                onToggleFiltered={(checked, slotIds) => toggleFilteredSlotSelection(date, shift.name, slotDetailsForPopover, slotIds, checked)}
                                                onOpenModal={() => handleSlotSelectionForAssignment(date, shift.name, shiftData, shift.endTime)}
                                              />
                                            )}
                                            onOpenChange={async (visible) => {
                                              if (visible && hasSlots && slotDetailsForPopover.length === 0) {
                                                setQuickSelectLoadingKey(cacheKey);
                                                await fetchSlotDetails(date, shift.name, shiftData);
                                                setQuickSelectLoadingKey(prev => (prev === cacheKey ? null : prev));
                                              }
                                              if (!visible && quickSelectLoadingKey === cacheKey) {
                                                setQuickSelectLoadingKey(null);
                                              }
                                            }}
                                          >
                                            <div style={{ cursor: 'pointer' }}>
                                              <Tag color="cyan" size="small">
                                                {totalSlotsInShift || slotCount} slot
                                              </Tag>
                                              <div style={{ fontSize: '10px', marginTop: 2 }}>
                                                <Text style={{
                                                  color: hasSelectedSlots
                                                    ? (selectedSlotCount === coverageDenominator ? '#1890ff' : '#0958d9')
                                                    : '#595959'
                                                }}>
                                                  Đã chọn: {selectedSlotCount}/{coverageDenominator}
                                                </Text>
                                              </div>
                                              <div style={{ fontSize: '10px', marginTop: 2 }}>
                                                <Text style={{
                                                  color:
                                                    coverageNumerator === coverageDenominator && coverageDenominator > 0
                                                      ? '#52c41a'
                                                      : coverageNumerator > 0
                                                        ? '#faad14'
                                                        : '#ff4d4f'
                                                }}>
                                                  PC: {coverageNumerator}/{coverageDenominator || totalSlotsInShift || slotCount}
                                                </Text>
                                              </div>
                                              <div style={{ fontSize: '10px', color: '#1890ff', marginTop: 4 }}>
                                                Hover hoặc click để chọn slot
                                              </div>
                                            </div>
                                          </Popover>
                                          
                                          
                                        </Space>
                                      ) : (
                                        <Text type="secondary" style={{ fontSize: '11px' }}>Không có lịch</Text>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ));
                  })()}
                </>
              )}
            </div>

            {/* Action Buttons - REMOVED: Nút "Tiếp tục phân công" không cần nữa vì auto-load */}
            {totalSelectedSlotCount > 0 && (
              <>
                {/* Staff Selection Section - Auto-shown when slots selected */}
                {loadingStaff ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" tip="Đang tải danh sách nhân sự..." />
                  </div>
                ) : staffList.length > 0 ? (
                  <>
                    <Divider>Chọn nhân sự</Divider>
                    
                    {/* Selected Slots Info */}
                    <Alert
                      message="Thông tin các ca đã chọn (tất cả các tháng)"
                      description={
                        <div>
                          <Space size={[8, 8]} wrap style={{ marginBottom: 8 }}>
                            <Tag color="blue">Đã chọn: {totalSelectedSlotCount}/{totalAvailableSlotCount || totalSelectedSlotCount}</Tag>
                            <Tag color={fullyAssignedSlotCount >= totalSelectedSlotCount && totalSelectedSlotCount > 0 ? 'green' : 'orange'}>
                              PC: {fullyAssignedSlotCount}/{totalSelectedSlotCount || 0}
                            </Tag>
                          </Space>
                          <Text strong>Tổng slot: {totalSelectedSlotCount}</Text>
                          <div style={{ fontSize: 12, color: '#999', margin: '4px 0 8px' }}>
                            Bao gồm {selectedSlotsForAssignment.length} ca trong tháng này. Tổng từ tất cả các tháng: {totalSelectedSlotCount} slot
                          </div>
                          <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                            {selectedSlotsForAssignment.map((slot, index) => {
                              // ⭐ Use cached slots if available (they have populated dentist/nurse with fullName+employeeCode)
                              const cachedSlots = slotDetailsCache[slot.slotKey] || [];
                              const effectiveSlots = cachedSlots.length > 0 ? cachedSlots : (slot?.slots || []);
                              
                              const assignedInSelection = effectiveSlots.length > 0
                                ? effectiveSlots.filter(item => {
                                    const itemId = resolveSlotId(item);
                                    return itemId && slot.slotIds.includes(itemId) && isSlotFullyAssigned(item);
                                  }).length
                                : 0;
                              
                              // ⭐ Collect all unique staff info (fullName + employeeCode) from selected slots
                              const dentistInfo = new Map(); // Map<id, {fullName, employeeCode}>
                              const nurseInfo = new Map();
                              
                              effectiveSlots.forEach(item => {
                                const itemId = resolveSlotId(item);
                                if (itemId && slot.slotIds.includes(itemId)) {
                                  // Get dentist info
                                  if (Array.isArray(item.dentist)) {
                                    item.dentist.forEach(d => {
                                      if (d?._id || d?.id) {
                                        const id = d._id || d.id;
                                        const fullName = d.fullName || d.name || 'N/A';
                                        const employeeCode = d.employeeCode || d.code || null;
                                        dentistInfo.set(id.toString(), { fullName, employeeCode });
                                      }
                                    });
                                  } else if (item.dentist) {
                                    const d = item.dentist;
                                    if (d._id || d.id) {
                                      const id = d._id || d.id;
                                      const fullName = d.fullName || d.name || 'N/A';
                                      const employeeCode = d.employeeCode || d.code || null;
                                      dentistInfo.set(id.toString(), { fullName, employeeCode });
                                    }
                                  }
                                  
                                  // Get nurse info
                                  if (Array.isArray(item.nurse)) {
                                    item.nurse.forEach(n => {
                                      if (n?._id || n?.id) {
                                        const id = n._id || n.id;
                                        const fullName = n.fullName || n.name || 'N/A';
                                        const employeeCode = n.employeeCode || n.code || null;
                                        nurseInfo.set(id.toString(), { fullName, employeeCode });
                                      }
                                    });
                                  } else if (item.nurse) {
                                    const n = item.nurse;
                                    if (n._id || n.id) {
                                      const id = n._id || n.id;
                                      const fullName = n.fullName || n.name || 'N/A';
                                      const employeeCode = n.employeeCode || n.code || null;
                                      nurseInfo.set(id.toString(), { fullName, employeeCode });
                                    }
                                  }
                                }
                              });
                              
                              // Format: "Tên (Mã)" or just "Tên"
                              const dentistList = Array.from(dentistInfo.values())
                                .map(info => info.employeeCode ? `${info.fullName} (${info.employeeCode})` : info.fullName)
                                .join(', ');
                              const nurseList = Array.from(nurseInfo.values())
                                .map(info => info.employeeCode ? `${info.fullName} (${info.employeeCode})` : info.fullName)
                                .join(', ');
                              
                              return (
                                <div key={slot.slotKey} style={{ fontSize: 12, color: '#666', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
                                  <div>
                                    <strong>{index + 1}. {dayjs(slot.date).format('DD/MM/YYYY')} - {slot.shiftName}</strong>
                                    <Text type="secondary">
                                      {' '}({slot.slotIds?.length || 0}/{slot.totalSlots || slot.slotIds?.length || 0} slot | PC: {assignedInSelection}/{slot.slotIds?.length || 0})
                                    </Text>
                                  </div>
                                  {(dentistList || nurseList) && (
                                    <div style={{ marginTop: 2, fontSize: 11, color: '#8c8c8c' }}>
                                      {dentistList && <div>• NS: {dentistList}</div>}
                                      {nurseList && <div>• YT: {nurseList}</div>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    
                    {/* Filter Controls */}
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={12}>
                        <Card size="small" title="nha sĩ" headStyle={{ backgroundColor: '#e6f7ff' }}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Radio.Group 
                              value={dentistConflictFilter} 
                              onChange={(e) => setDentistConflictFilter(e.target.value)}
                              size="small"
                              buttonStyle="solid"
                              disabled={maxDentists === 0} // 🔧 Disable khi không cho phép nha sĩ
                            >
                              <Radio.Button value="all">Tất cả</Radio.Button>
                              <Radio.Button value="no-conflict">
                                <CheckCircleOutlined /> Không trùng
                              </Radio.Button>
                              <Radio.Button value="has-conflict">
                                <WarningOutlined /> Trùng lịch
                              </Radio.Button>
                            </Radio.Group>
                            
                            {maxDentists === 0 ? (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Phòng này không yêu cầu nha sĩ
                              </Text>
                            ) : (
                              <Select
                                style={{ width: '100%' }}
                                placeholder={`Chọn nha sĩ (tối đa ${maxDentists})`}
                                mode={maxDentists > 1 ? 'multiple' : undefined}
                                value={maxDentists > 1 ? selectedDentists : (selectedDentists[0] || undefined)}
                                onChange={handleDentistSelectionChange}
                                showSearch
                                optionFilterProp="staffsearch"
                                filterOption={(input, option) =>
                                  option?.props?.staffsearch?.includes(normalizeLower(input))
                                }
                                maxTagCount="responsive"
                                allowClear
                              >
                              {staffList
                                .filter(staff => staffHasRole(staff, 'dentist'))
                                .filter(staff => !selectedNurses.includes(staff._id)) // 🔥 Mutual exclusion: exclude if already selected as nurse
                                .filter(staff => {
                                  // 🔥 Use role-specific conflicts for dentist
                                  const dentistConflicts = staff.conflictsByRole?.dentist || [];
                                  if (dentistConflictFilter === 'no-conflict') {
                                    return dentistConflicts.length === 0;
                                  }
                                  if (dentistConflictFilter === 'has-conflict') {
                                    return dentistConflicts.length > 0;
                                  }
                                  return true;
                                })
                                .map(staff => {
                                  // 🔥 Use role-specific conflicts for dentist display
                                  const dentistConflicts = staff.conflictsByRole?.dentist || [];
                                  const conflictCount = dentistConflicts.length;
                                  const summarizedConflicts = summarizeConflictRanges(dentistConflicts);
                                  const previewConflicts = summarizedConflicts.slice(0, 2);
                                  const employeeCode = staff.employeeCode;
                                  // 🔥 Show all roles for multi-role users
                                  const assignmentRoles = staff.assignmentRoles || [staff.assignmentRole || staff.role];
                                  return (
                                    <Option
                                      key={staff._id}
                                      value={staff._id}
                                      staffsearch={staff.searchKeywords}
                                      disabled={conflictCount > 0}
                                    >
                                      <Space direction="vertical" style={{ width: '100%' }} size={4}>
                                        <Space align="center" wrap>
                                          <Space size={6} align="center">
                                            {employeeCode && <Tag color="blue" bordered={false}>{employeeCode}</Tag>}
                                            <Text strong style={{ color: conflictCount > 0 ? '#d9d9d9' : 'inherit' }}>{staff.displayName}</Text>
                                            {/* 🔥 Display multiple role tags */}
                                            {assignmentRoles.map(role => (
                                              <Tag key={role} color={getRoleTagColor(role)} bordered={false}>
                                                {getRoleLabel(role)}
                                              </Tag>
                                            ))}
                                          </Space>
                                          {conflictCount === 0 ? (
                                            <Tag color="green" size="small">Không trùng</Tag>
                                          ) : (
                                            <Tag color="red" size="small">Trùng {conflictCount}</Tag>
                                          )}
                                        </Space>
                                        {conflictCount > 0 && (
                                          <div style={{ fontSize: 11, color: '#fa8c16' }}>
                                            {previewConflicts.map((conflict, index) => (
                                              <div key={`${staff._id}-dentist-conflict-${index}`}>
                                                {formatConflictDescription(conflict)}
                                              </div>
                                            ))}
                                            {summarizedConflicts.length > previewConflicts.length && (
                                              <Text type="secondary">+{summarizedConflicts.length - previewConflicts.length} lịch khác</Text>
                                            )}
                                          </div>
                                        )}
                                      </Space>
                                    </Option>
                                  );
                                })
                              }
                            </Select>
                            )}
                          </Space>
                        </Card>
                      </Col>
                      
                      <Col span={12}>
                        <Card size="small" title="Y tá" headStyle={{ backgroundColor: '#f6ffed' }}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Radio.Group 
                              value={nurseConflictFilter} 
                              onChange={(e) => setNurseConflictFilter(e.target.value)}
                              size="small"
                              buttonStyle="solid"
                              disabled={maxNurses === 0} // 🔧 Disable khi không cho phép y tá
                            >
                              <Radio.Button value="all">Tất cả</Radio.Button>
                              <Radio.Button value="no-conflict">
                                <CheckCircleOutlined /> Không trùng
                              </Radio.Button>
                              <Radio.Button value="has-conflict">
                                <WarningOutlined /> Trùng lịch
                              </Radio.Button>
                            </Radio.Group>
                            
                            {maxNurses === 0 ? (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Phòng này không yêu cầu y tá
                              </Text>
                            ) : (
                              <Select
                                style={{ width: '100%' }}
                                placeholder={`Chọn y tá (tối đa ${maxNurses})`}
                                mode={maxNurses > 1 ? 'multiple' : undefined}
                                value={maxNurses > 1 ? selectedNurses : (selectedNurses[0] || undefined)}
                                onChange={handleNurseSelectionChange}
                                showSearch
                                optionFilterProp="staffsearch"
                                filterOption={(input, option) =>
                                  option?.props?.staffsearch?.includes(normalizeLower(input))
                                }
                                maxTagCount="responsive"
                                allowClear
                              >
                              {staffList
                                .filter(staff => staffHasRole(staff, 'nurse'))
                                .filter(staff => !selectedDentists.includes(staff._id)) // 🔥 Mutual exclusion: exclude if already selected as dentist
                                .filter(staff => {
                                  // 🔥 Use role-specific conflicts for nurse
                                  const nurseConflicts = staff.conflictsByRole?.nurse || [];
                                  if (nurseConflictFilter === 'no-conflict') {
                                    return nurseConflicts.length === 0;
                                  }
                                  if (nurseConflictFilter === 'has-conflict') {
                                    return nurseConflicts.length > 0;
                                  }
                                  return true;
                                })
                                .map(staff => {
                                  // 🔥 Use role-specific conflicts for nurse display
                                  const nurseConflicts = staff.conflictsByRole?.nurse || [];
                                  const conflictCount = nurseConflicts.length;
                                  const summarizedConflicts = summarizeConflictRanges(nurseConflicts);
                                  const previewConflicts = summarizedConflicts.slice(0, 2);
                                  const employeeCode = staff.employeeCode;
                                  // 🔥 Show all roles for multi-role users
                                  const assignmentRoles = staff.assignmentRoles || [staff.assignmentRole || staff.role];
                                  return (
                                    <Option
                                      key={staff._id}
                                      value={staff._id}
                                      staffsearch={staff.searchKeywords}
                                      disabled={conflictCount > 0}
                                    >
                                      <Space direction="vertical" style={{ width: '100%' }} size={4}>
                                        <Space align="center" wrap>
                                          <Space size={6} align="center">
                                            {employeeCode && <Tag color="green" bordered={false}>{employeeCode}</Tag>}
                                            <Text strong style={{ color: conflictCount > 0 ? '#d9d9d9' : 'inherit' }}>{staff.displayName}</Text>
                                            {/* 🔥 Display multiple role tags */}
                                            {assignmentRoles.map(role => (
                                              <Tag key={role} color={getRoleTagColor(role)} bordered={false}>
                                                {getRoleLabel(role)}
                                              </Tag>
                                            ))}
                                          </Space>
                                          {conflictCount === 0 ? (
                                            <Tag color="green" size="small">Không trùng</Tag>
                                          ) : (
                                            <Tag color="red" size="small">Trùng {conflictCount}</Tag>
                                          )}
                                        </Space>
                                        {conflictCount > 0 && (
                                          <div style={{ fontSize: 11, color: '#fa8c16' }}>
                                            {previewConflicts.map((conflict, index) => (
                                              <div key={`${staff._id}-nurse-conflict-${index}`}>
                                                {formatConflictDescription(conflict)}
                                              </div>
                                            ))}
                                            {summarizedConflicts.length > previewConflicts.length && (
                                              <Text type="secondary">+{summarizedConflicts.length - previewConflicts.length} lịch khác</Text>
                                            )}
                                          </div>
                                        )}
                                      </Space>
                                    </Option>
                                  );
                                })
                              }
                            </Select>
                            )}
                          </Space>
                        </Card>
                      </Col>
                    </Row>
                    
                    {/* Action Buttons */}
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {/* Remove Staff Button */}
                      <Tooltip title={totalSelectedSlotCount === 0 ? 'Vui lòng chọn ít nhất 1 slot' : ''}>
                        <Button 
                          danger
                          size="large"
                          block
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            console.log('🔴 Remove Staff Button CLICKED!');
                            handleRemoveStaffFromSlots();
                          }}
                          disabled={totalSelectedSlotCount === 0}
                        >
                          Xóa nhân sự khỏi {totalSelectedSlotCount} slot đã chọn
                        </Button>
                      </Tooltip>

                      {/* Confirm Assignment Button */}
                      <Tooltip
                        title={
                          !canConfirmAssignment
                            ? allSlotsFullyAssigned
                              ? 'Vui lòng chọn ít nhất 1 nhân sự để cập nhật'
                              : (() => {
                                  const requiresDentist = maxDentists > 0;
                                  const requiresNurse = maxNurses > 0;
                                  if (requiresDentist && requiresNurse) {
                                    return 'Vui lòng chọn ít nhất 1 nha sĩ VÀ 1 y tá để phân công';
                                  } else if (requiresDentist) {
                                    return 'Vui lòng chọn ít nhất 1 nha sĩ để phân công';
                                  } else if (requiresNurse) {
                                    return 'Vui lòng chọn ít nhất 1 y tá để phân công';
                                  }
                                  return 'Vui lòng chọn nhân sự để phân công';
                                })()
                            : ''
                        }
                      >
                        <Button 
                          type="primary" 
                          size="large"
                          block
                          icon={<CheckCircleOutlined />}
                          onClick={() => {
                            console.log('🔘 Button clicked!');
                            console.log('Selected slots count:', selectedSlotsForAssignment.length);
                            console.log('Selected dentists count:', selectedDentists.length);
                            console.log('Selected nurses count:', selectedNurses.length);
                            console.log('All slots fully assigned:', allSlotsFullyAssigned);
                            handleConfirmAssignment();
                          }}
                          disabled={!canConfirmAssignment}
                          style={{ width: '100%' }}
                        >
                          {allSlotsFullyAssigned 
                            ? `Cập nhật phân công (${selectedDentists.length} NS + ${selectedNurses.length} YT) - ${selectedSlotsForAssignment.length} ca`
                            : `Xác nhận phân công (${selectedDentists.length} NS + ${selectedNurses.length} YT) - ${selectedSlotsForAssignment.length} ca`
                          }
                        </Button>
                      </Tooltip>
                    </Space>
                  </>
                ) : null}
              </>
            )}
          </Space>
        ) : (
          <Empty description="Không có dữ liệu lịch" />
        )}
      </Modal>

      {/* Slot Selection Modal - For selecting individual slots */}
      <Modal
        title={
          <Space direction="vertical" size={0}>
            <Text strong>
              Chọn slot - {slotModalData?.shiftName} ({slotModalData?.date?.format('DD/MM/YYYY')})
            </Text>
            {(() => {
              const stats = getSlotModalStats();
              if (selectedIndividualSlots.length > 0) {
                return (
                  <Text type="success" style={{ fontSize: '12px' }}>
                    Đã chọn: {stats.selectedCount} / {stats.totalSlots} slot
                  </Text>
                );
              } else {
                return (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Đã phân công: {stats.assignedSlots} / {stats.totalSlots} slot
                  </Text>
                );
              }
            })()}
          </Space>
        }
        open={showSlotSelectionModal}
        onCancel={() => {
          setShowSlotSelectionModal(false);
          setSelectedIndividualSlots([]);
          setSlotModalFilter('all');
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowSlotSelectionModal(false);
            setSelectedIndividualSlots([]);
            setSlotModalFilter('all');
          }}>
            Đóng
          </Button>,
          <Button 
            key="assign" 
            type="primary" 
            disabled={selectedIndividualSlots.length === 0}
            onClick={handleAddIndividualSlotsToAssignment}
          >
            Chọn để phân công ({selectedIndividualSlots.length} slot)
          </Button>
        ]}
      >
        {loadingSlotModal ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải danh sách slot...</div>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Filter and Select All Controls */}
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Radio.Group 
                value={slotModalFilter} 
                onChange={(e) => setSlotModalFilter(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="all">
                  Tất cả ({slotModalData?.slots?.length || 0})
                </Radio.Button>
                <Radio.Button value="assigned">
                  Đã phân công ({slotModalData?.slots?.filter(s => s.dentist || s.nurse).length || 0})
                </Radio.Button>
                <Radio.Button value="unassigned">
                  Chưa phân công ({slotModalData?.slots?.filter(s => !s.dentist && !s.nurse).length || 0})
                </Radio.Button>
              </Radio.Group>
              
              <Checkbox
                checked={getFilteredModalSlots().length > 0 && selectedIndividualSlots.length === getFilteredModalSlots().length}
                indeterminate={selectedIndividualSlots.length > 0 && selectedIndividualSlots.length < getFilteredModalSlots().length}
                onChange={(e) => handleSelectAllModalSlots(e.target.checked)}
              >
                Chọn tất cả
              </Checkbox>
            </Space>

            <Divider style={{ margin: '8px 0' }} />

            {/* Slot List */}
            <div style={{ maxHeight: '500px', overflow: 'auto' }}>
              {getFilteredModalSlots().length === 0 ? (
                <Empty description="Không có slot" />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {getFilteredModalSlots().map((slot, index) => {
                    const startTime = slot.startTimeVN || dayjs(slot.startTime).format('HH:mm');
                    const endTime = slot.endTimeVN || dayjs(slot.endTime).format('HH:mm');
                    
                    // ⭐ Lấy thông tin dentist với fullName + employeeCode (giống như hover)
                    let dentistDisplay = '';
                    if (Array.isArray(slot.dentist) && slot.dentist.length > 0) {
                      dentistDisplay = slot.dentist.map(d => {
                        const fullName = d?.fullName || d?.name || 'N/A';
                        const employeeCode = d?.employeeCode || d?.code;
                        return employeeCode ? `${fullName} (${employeeCode})` : fullName;
                      }).join(', ');
                    } else if (slot.dentist && typeof slot.dentist === 'object') {
                      const fullName = slot.dentist?.fullName || slot.dentist?.name || 'N/A';
                      const employeeCode = slot.dentist?.employeeCode || slot.dentist?.code;
                      dentistDisplay = employeeCode ? `${fullName} (${employeeCode})` : fullName;
                    }
                    
                    // ⭐ Lấy thông tin nurse với fullName + employeeCode (giống như hover)
                    let nurseDisplay = '';
                    if (Array.isArray(slot.nurse) && slot.nurse.length > 0) {
                      nurseDisplay = slot.nurse.map(n => {
                        const fullName = n?.fullName || n?.name || 'N/A';
                        const employeeCode = n?.employeeCode || n?.code;
                        return employeeCode ? `${fullName} (${employeeCode})` : fullName;
                      }).join(', ');
                    } else if (slot.nurse && typeof slot.nurse === 'object') {
                      const fullName = slot.nurse?.fullName || slot.nurse?.name || 'N/A';
                      const employeeCode = slot.nurse?.employeeCode || slot.nurse?.code;
                      nurseDisplay = employeeCode ? `${fullName} (${employeeCode})` : fullName;
                    }
                    
                    const slotId = resolveSlotId(slot);
                    const cardKey = slotId || `${startTime}-${endTime}-${index}`;
                    const isSelected = slotId ? selectedIndividualSlots.includes(slotId) : false;

                    return (
                      <Card
                        key={cardKey}
                        size="small"
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#e6f7ff' : 'white',
                          borderColor: isSelected ? '#1890ff' : '#d9d9d9'
                        }}
                        onClick={() => slotId && handleToggleSlot(slotId)}
                      >
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            <Checkbox 
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => slotId && handleToggleSlot(slotId)}
                            />
                            <div>
                              <Text strong style={{ fontSize: '14px' }}>
                                {startTime} - {endTime}
                              </Text>
                              {slot.subRoom?.name && (
                                <Tag color="blue" size="small" style={{ marginLeft: 8 }}>
                                  {slot.subRoom.name}
                                </Tag>
                              )}
                            </div>
                          </Space>
                          
                          <Space direction="vertical" size={0} align="end">
                            {dentistDisplay ? (
                              <Tag color="blue" size="small">
                                NS: {dentistDisplay}
                              </Tag>
                            ) : (
                              <Tag color="orange" size="small">
                                NS: Chưa phân công
                              </Tag>
                            )}
                            {nurseDisplay ? (
                              <Tag color="green" size="small">
                                YT: {nurseDisplay}
                              </Tag>
                            ) : (
                              <Tag color="orange" size="small">
                                YT: Chưa phân công
                              </Tag>
                            )}
                          </Space>
                        </Space>
                      </Card>
                    );
                  })}
                </Space>
              )}
            </div>
          </Space>
        )}
      </Modal>

      {/* ⭐ Slot Selection Modal for Staff-based Replacement - Simple version without staff info */}
      <Modal
        title={
          <Space direction="vertical" size={0}>
            <Text strong>
              Chọn slot - {slotModalDataStaff?.shiftName} ({slotModalDataStaff?.date?.format('DD/MM/YYYY')})
            </Text>
            {(() => {
              const stats = getSlotModalStatsForStaff();
              if (selectedIndividualSlotsStaff.length > 0) {
                return (
                  <Text type="success" style={{ fontSize: '12px' }}>
                    Đã chọn: {stats.selectedCount} / {stats.totalSlots} slot
                  </Text>
                );
              } else {
                return (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Tổng số: {stats.totalSlots} slot
                  </Text>
                );
              }
            })()}
          </Space>
        }
        open={showSlotSelectionModalStaff}
        onCancel={() => {
          setShowSlotSelectionModalStaff(false);
          setSelectedIndividualSlotsStaff([]);
        }}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowSlotSelectionModalStaff(false);
            setSelectedIndividualSlotsStaff([]);
          }}>
            Đóng
          </Button>,
          <Button 
            key="assign" 
            type="primary" 
            disabled={selectedIndividualSlotsStaff.length === 0}
            onClick={handleAddIndividualSlotsToReplacementForStaff}
          >
            Chọn để thay thế ({selectedIndividualSlotsStaff.length} slot)
          </Button>
        ]}
      >
        {loadingSlotModalStaff ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải danh sách slot...</div>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Select All Control - Bỏ filter tabs cho Staff-based */}
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Checkbox
                checked={slotModalDataStaff?.slots?.length > 0 && selectedIndividualSlotsStaff.length === slotModalDataStaff.slots.length}
                indeterminate={selectedIndividualSlotsStaff.length > 0 && selectedIndividualSlotsStaff.length < (slotModalDataStaff?.slots?.length || 0)}
                onChange={(e) => handleSelectAllModalSlotsForStaff(e.target.checked)}
                disabled={!slotModalDataStaff?.slots || slotModalDataStaff.slots.length === 0}
              >
                Chọn tất cả ({slotModalDataStaff?.slots?.length || 0})
              </Checkbox>
            </Space>

            {/* Slot List - Simple display without staff info */}
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {!slotModalDataStaff?.slots || slotModalDataStaff.slots.length === 0 ? (
                <Empty description="Không có slot nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {slotModalDataStaff.slots.map((slot) => {
                    const slotId = resolveSlotId(slot);
                    const isSelected = selectedIndividualSlotsStaff.includes(slotId);
                    const startTime = slot?.startTimeVN || (slot?.startTime ? dayjs(slot.startTime).format('HH:mm') : '--:--');
                    const endTime = slot?.endTimeVN || (slot?.endTime ? dayjs(slot.endTime).format('HH:mm') : '--:--');

                    return (
                      <Card
                        key={slotId}
                        size="small"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                          borderColor: isSelected ? '#1890ff' : '#f0f0f0'
                        }}
                        onClick={() => handleToggleSlotForStaff(slotId)}
                      >
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Checkbox
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => handleToggleSlotForStaff(slotId)}
                          />
                          <Space direction="vertical" size={0} style={{ flex: 1, marginLeft: 8 }}>
                            <Text strong>{startTime} - {endTime}</Text>
                            {slot?.room?.name && slot.room.name !== 'Phòng không xác định' && (
                              <Space size={4}>
                                <HomeOutlined style={{ fontSize: 12, color: '#666' }} />
                                <Text style={{ fontSize: 12, color: '#666' }}>
                                  {slot.room.name}
                                  {slot?.room?.subRoom?.name && ` - ${slot.room.subRoom.name}`}
                                </Text>
                              </Space>
                            )}
                          </Space>
                        </Space>
                      </Card>
                    );
                  })}
                </Space>
              )}
            </div>
          </Space>
        )}
      </Modal>
              </>
            )
          },
          {
            key: 'staff-based',
            label: (
              <span>
                <SwapOutlined />
                {' '}Thay thế theo Nhân sự
              </span>
            ),
            children: (
              <>
                {/* Filters */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col flex="320px">
                    <Input
                      allowClear
                      value={staffSearchValue}
                      placeholder="Tìm nhân sự..."
                      prefix={<SearchOutlined />}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStaffSearchValue(value);
                        if (!value) {
                          setStaffSearchTerm('');
                        } else {
                          debouncedStaffSearch(value);
                        }
                      }}
                    />
                  </Col>
                  <Col flex="auto">
                    <Space style={{ float: 'right' }}>
                      <Select
                        value={staffRoleFilter}
                        onChange={setStaffRoleFilter}
                        style={{ width: 150 }}
                      >
                        <Option value="all">Tất cả vai trò</Option>
                        <Option value="dentist">Nha sĩ</Option>
                        <Option value="nurse">Y tá</Option>
                      </Select>
                      
                      <Radio.Group 
                        value={staffAssignmentFilter} 
                        onChange={(e) => setStaffAssignmentFilter(e.target.value)}
                        buttonStyle="solid"
                      >
                        <Radio.Button value="all">Tất cả</Radio.Button>
                        <Radio.Button value="has-schedule">Có lịch</Radio.Button>
                        <Radio.Button value="no-schedule">Không có lịch</Radio.Button>
                      </Radio.Group>
                      
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchAllStaff}
                        loading={loadingAllStaff}
                      >
                        Làm mới
                      </Button>
                    </Space>
                  </Col>
                </Row>

                {/* Staff Table */}
                <Card>
                  <Table
                    columns={[
                      {
                        title: 'Nhân sự',
                        key: 'staff',
                        render: (_, record) => (
                          <Space>
                            <UserOutlined style={{ fontSize: 20 }} />
                            <div>
                              <Space size={6} align="center" wrap>
                                {record.employeeCode && (
                                  <Tag color="blue" bordered={false}>{record.employeeCode}</Tag>
                                )}
                                <Text strong>{record.displayName || buildStaffDisplayName(record)}</Text>
                              </Space>
                              {(record.email || record.phoneNumber) && (
                                <>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {[record.email, record.phoneNumber].filter(Boolean).join(' • ')}
                                  </Text>
                                </>
                              )}
                            </div>
                          </Space>
                        )
                      },
                      {
                        title: 'Vai trò',
                        dataIndex: 'role',
                        key: 'role',
                        render: (_, record) => {
                          // 🔥 Show all assignment roles for multi-role users
                          const roles = record.assignmentRoles || [record.assignmentRole || record.role];
                          return (
                            <Space size={4} wrap>
                              {roles.map(role => (
                                <Tag key={role} color={getRoleTagColor(role)}>
                                  {getRoleLabel(role)}
                                </Tag>
                              ))}
                            </Space>
                          );
                        }
                      },
                      {
                        title: 'Hành động',
                        key: 'action',
                        render: (_, record) => {
                          const hasSchedule = staffScheduleMap[record._id];
                          const hasNoSchedule = hasSchedule === false;
                          
                          return (
                            <Tooltip title={hasNoSchedule ? 'Nhân sự chưa có lịch làm việc' : ''}>
                              <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={() => handleSelectStaffForReplacement(record)}
                                disabled={hasNoSchedule}
                              >
                                Xem lịch
                              </Button>
                            </Tooltip>
                          );
                        }
                      }
                    ]}
                    dataSource={filteredAllStaff}
                    loading={loadingAllStaff}
                    rowKey="_id"
                    pagination={staffSearchTerm ? false : {
                      showSizeChanger: true,
                      showTotal: (total) => `Tổng ${total} nhân sự`
                    }}
                  />
                </Card>

                {/* Staff Schedule Modal */}
                <Modal
                  title={
                    <Space>
                      <CalendarOutlined style={{ color: '#1890ff' }} />
                      <span style={{ color: '#000' }}>
                        <strong>Lịch làm việc của:</strong> {selectedStaffForReplacement ? (selectedStaffForReplacement.displayName || buildStaffDisplayName(selectedStaffForReplacement)) : 'Chưa chọn nhân sự'}
                        {selectedRoleForViewing && (
                          <Tag color={getRoleTagColor(selectedRoleForViewing)} style={{ marginLeft: 8 }}>
                            {getRoleLabel(selectedRoleForViewing)}
                          </Tag>
                        )}
                      </span>
                    </Space>
                  }
                  open={showStaffScheduleModal}
                  onCancel={() => {
                    setShowStaffScheduleModal(false);
                    setStaffCalendarData(null);
                    setSelectedSlotsForReplacement([]);
                    setReplacementStaffList([]);
                    setSelectedReplacementStaff(null);
                    setSelectedShiftFiltersStaff([]);
                    setSlotDetailsCacheStaff({});
                  }}
                  footer={null}
                  width={1400}
                  style={{ top: 20 }}
                >
                  {loadingStaffSchedule ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>Đang tải lịch nhân sự...</div>
                    </div>
                  ) : !staffCalendarData ? (
                    <Empty description="Không có dữ liệu lịch" />
                  ) : (
                    <>
                      {/* ⭐ Loading overlay when selecting all slots */}
                      {selectingAllMonthStaff && (
                        <div
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(2px)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 99999,
                            pointerEvents: 'all'
                          }}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <Spin size="large" />
                            <div style={{ marginTop: 16, fontSize: 16, fontWeight: 500, color: '#1890ff' }}>
                              Đang chọn tất cả slot trong tháng...
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {/* Staff Info Card */}
                      <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
                        <Space direction="vertical" size={0}>
                          <Text><strong>Nhân sự:</strong> {selectedStaffForReplacement?.displayName || 'Chưa cập nhật'}</Text>
                          <Text><strong>Vai trò:</strong> {getRoleLabel(selectedStaffForReplacement?.assignmentRole || selectedStaffForReplacement?.role)}</Text>
                          {selectedStaffForReplacement?.employeeCode && (
                            <Text><strong>Mã NV:</strong> {selectedStaffForReplacement.employeeCode}</Text>
                          )}
                        </Space>
                      </Card>

                      {/* Calendar Navigation */}
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space>
                            <DatePicker
                              picker="month"
                              value={dayjs().add(currentPageForStaff, 'month')}
                              onChange={goToSpecificMonthForStaff}
                              format="MM/YYYY"
                              placeholder="Chọn tháng"
                              disabledDate={(current) => {
                                return current && current < dayjs().startOf('month');
                              }}
                              style={{ width: 150 }}
                            />
                            <Button
                              icon={<LeftOutlined />}
                              onClick={goToPreviousMonthForStaff}
                              disabled={currentPageForStaff === 0}
                            >
                              Tháng trước
                            </Button>
                            <Button
                              icon={<RightOutlined />}
                              onClick={goToNextMonthForStaff}
                            >
                              Tháng sau
                            </Button>
                            <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                              Tháng {dayjs().add(currentPageForStaff, 'month').format('MM/YYYY')}
                            </Tag>
                          </Space>
                        </Col>
                        <Col>
                          <Space size="middle" wrap align="center">
                            <Space size={8} align="center">
                              <Text strong>Chọn ca:</Text>
                              <Checkbox.Group
                                options={availableShiftKeysStaff.map(name => ({ label: name, value: name }))}
                                value={selectedShiftFiltersStaff}
                                onChange={handleShiftFilterChangeForStaff}
                                disabled={availableShiftKeysStaff.length === 0}
                              />
                            </Space>
                            <Checkbox
                              checked={selectableSlotStatsForStaff.total > 0 && selectableSlotStatsForStaff.fullySelected === selectableSlotStatsForStaff.total}
                              indeterminate={selectableSlotStatsForStaff.total > 0 && (selectableSlotStatsForStaff.fullySelected + selectableSlotStatsForStaff.partiallySelected > 0) && selectableSlotStatsForStaff.fullySelected < selectableSlotStatsForStaff.total}
                              onChange={() => handleSelectAllSlotsForStaff()}
                              disabled={selectableSlotStatsForStaff.total === 0}
                            >
                              Chọn tất cả tháng này
                            </Checkbox>
                            <Badge count={totalSelectedSlotCountForStaff} showZero>
                              <Tag color="blue">Đã chọn slot</Tag>
                            </Badge>
                          </Space>
                        </Col>
                      </Row>

                      {staffCalendarData && availableShiftKeysStaff.length > 0 && selectedShiftFiltersStaff.length === 0 && (
                        <Alert
                          message="Vui lòng chọn ca làm việc"
                          description="Bạn cần chọn ít nhất một ca làm việc để xem và chọn slot cần thay thế."
                          type="info"
                          showIcon
                        />
                      )}

                      {staffCalendarData && selectableSlotStatsForStaff.total === 0 && selectedShiftFiltersStaff.length > 0 && availableShiftKeysStaff.length > 0 && (
                        <Alert
                          message="Không có slot khả dụng"
                          description="Tất cả các slot trong tháng này đã qua hoặc không thuộc ca làm việc đã chọn."
                          type="info"
                          showIcon
                        />
                      )}

                      {/* Calendar Grid (Giống Room Calendar) */}
                      <div style={{ overflowX: 'auto' }}>
                        {availableShiftKeysStaff.length === 0 ? (
                          <Alert
                            message="Không có dữ liệu lịch"
                            description="Nhân sự này chưa có lịch làm việc được tạo cho tháng này."
                            type="warning"
                            showIcon
                          />
                        ) : (
                          <>
                            {/* Month Calendar View - Organized by weeks */}
                            <div style={{ marginBottom: 16 }}>
                              <Text strong style={{ fontSize: 16 }}>Lịch theo tháng</Text>
                            </div>
                            {(() => {
                              const monthDays = getMonthDaysForStaff();
                              const weeks = [];
                              let currentWeek = [];
                              
                              monthDays.forEach((date, index) => {
                                if (date.day() === 1 && currentWeek.length > 0) {
                                  weeks.push(currentWeek);
                                  currentWeek = [];
                                }
                                currentWeek.push(date);
                                
                                if (index === monthDays.length - 1) {
                                  weeks.push(currentWeek);
                                }
                              });
                              
                              // Use availableShiftKeysStaff instead of shiftOverview
                              const shifts = availableShiftKeysStaff.map(name => ({
                                name,
                                startTime: null, // Backend doesn't provide this in period response
                                endTime: null
                              }));
                              
                              return weeks.map((week, weekIndex) => (
                                <div key={weekIndex} style={{ marginBottom: 24 }}>
                                  <div style={{ 
                                    backgroundColor: '#f0f0f0', 
                                    padding: '8px 12px', 
                                    marginBottom: 8,
                                    borderRadius: 4,
                                    fontWeight: 'bold'
                                  }}>
                                    Tuần {weekIndex + 1} ({week[0].format('DD/MM')} - {week[week.length - 1].format('DD/MM')})
                                  </div>
                                  
                                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d9d9d9', marginBottom: 16 }}>
                                    <thead>
                                      <tr style={{ backgroundColor: '#fafafa' }}>
                                        <th style={{ padding: '12px', border: '1px solid #d9d9d9', minWidth: '120px' }}>
                                          Ca làm việc / Ngày
                                        </th>
                                        {week.map(date => {
                                          const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                                          const dayName = dayNames[date.day()];
                                          
                                          return (
                                            <th 
                                              key={date.format('YYYY-MM-DD')} 
                                              style={{ 
                                                padding: '12px', 
                                                border: '1px solid #d9d9d9',
                                                minWidth: '150px'
                                              }}
                                            >
                                              <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontWeight: 'bold' }}>{date.format('DD/MM')}</div>
                                                <div style={{ fontSize: '11px', color: '#666' }}>{dayName}</div>
                                              </div>
                                            </th>
                                          );
                                        })}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {shifts.map(shift => (
                                        <tr key={shift.name}>
                                          <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #d9d9d9',
                                            backgroundColor: '#fafafa', 
                                            fontWeight: 'bold',
                                            verticalAlign: 'middle'
                                          }}>
                                            <div>
                                              <div>{shift.name}</div>
                                              {shift.startTime && shift.endTime && (
                                                <div style={{ fontSize: '11px', color: '#999', fontWeight: 'normal' }}>
                                                  {shift.startTime} - {shift.endTime}
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          {week.map(date => {
                                            const dayData = getStaffDayData(date);
                                            const shiftData = dayData?.shifts?.[shift.name];
                                            const dateStr = date.format('YYYY-MM-DD');
                                            
                                            const shiftSelection = getShiftSelectionEntryForStaff(dateStr, shift.name);
                                            const selectedSlotIds = shiftSelection?.slotIds || [];
                                            const selectedSlotCount = selectedSlotIds.length;
                                            const hasSelectedSlots = selectedSlotCount > 0;
                                            // Backend returns totalSlots, not slots array
                                            const hasSlots = (shiftData?.totalSlots > 0);
                                            
                                            // Backend already filters out past slots, no need to check here
                                            let bgColor = '#f5f5f5';
                                            if (hasSlots) {
                                              if (hasSelectedSlots) {
                                                bgColor = '#e6f7ff';
                                              } else {
                                                bgColor = '#fff';
                                              }
                                            }
                                            
                                            const slotCount = shiftData?.totalSlots || 0;
                                            const cacheKey = createSlotKeyForStaff(dateStr, shift.name);
                                            const cachedSlots = slotDetailsCacheStaff[cacheKey] || [];
                                            // Backend summary doesn't have slots array, need to fetch details
                                            const slotsForInfo = cachedSlots.length ? cachedSlots : [];
                                            const totalSlotsInShift = slotCount;
                                            const isEntireShiftSelected = hasSelectedSlots && totalSlotsInShift > 0 && selectedSlotCount >= totalSlotsInShift;
                                            const hasPartialSelection = hasSelectedSlots && !isEntireShiftSelected;
                                            const isQuickSelectLoading = quickSelectLoadingKeyStaff === cacheKey;
                                            
                                            return (
                                              <td 
                                                key={date.format('YYYY-MM-DD')} 
                                                style={{ 
                                                  padding: '8px', 
                                                  border: '1px solid #d9d9d9',
                                                  backgroundColor: bgColor,
                                                  cursor: hasSlots ? 'pointer' : 'not-allowed',
                                                  verticalAlign: 'top'
                                                }}
                                                onClick={(e) => {
                                                  // Don't trigger if clicking on checkbox or inside Popover
                                                  if (e.target.type === 'checkbox' || 
                                                      e.target.closest('.ant-checkbox-wrapper') ||
                                                      e.target.closest('.ant-popover')) {
                                                    return;
                                                  }
                                                  // Click to open modal for slot selection
                                                  if (hasSlots) {
                                                    handleOpenSlotModalForStaff(date, shift.name, shiftData, shift.endTime);
                                                  }
                                                }}
                                              >
                                                {hasSlots ? (
                                                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                                    <Checkbox 
                                                      checked={isEntireShiftSelected}
                                                      indeterminate={hasPartialSelection}
                                                      onClick={(e) => e.stopPropagation()}
                                                      onChange={() => handleToggleEntireShiftForStaff(date, shift.name, shiftData, shift.endTime)}
                                                    />
                                                    
                                                    <Popover
                                                      trigger={['hover', 'click']}
                                                      placement="right"
                                                      overlayStyle={{ maxWidth: 360 }}
                                                      content={(
                                                        <SlotQuickSelect
                                                          slots={slotsForInfo}
                                                          selectedSlotIds={selectedSlotIds}
                                                          loading={isQuickSelectLoading && slotsForInfo.length === 0}
                                                          onToggleSlot={(slotId) => toggleSingleSlotSelectionForStaff(date, shift.name, slotsForInfo, slotId)}
                                                          onToggleFiltered={(checked, slotIds) => toggleFilteredSlotSelectionForStaff(date, shift.name, slotsForInfo, slotIds, checked)}
                                                          onOpenModal={() => handleOpenSlotModalForStaff(date, shift.name, shiftData, shift.endTime)}
                                                        />
                                                      )}
                                                      onOpenChange={async (visible) => {
                                                        if (visible && hasSlots && slotsForInfo.length === 0) {
                                                          setQuickSelectLoadingKeyStaff(cacheKey);
                                                          await fetchSlotDetailsForStaff(date, shift.name, shiftData);
                                                          setQuickSelectLoadingKeyStaff(prev => (prev === cacheKey ? null : prev));
                                                        }
                                                        if (!visible && quickSelectLoadingKeyStaff === cacheKey) {
                                                          setQuickSelectLoadingKeyStaff(null);
                                                        }
                                                      }}
                                                    >
                                                      <div style={{ cursor: 'pointer' }}>
                                                        <Tag color="cyan" size="small">
                                                          {totalSlotsInShift || slotCount} slot
                                                        </Tag>
                                                        <div style={{ fontSize: '10px', marginTop: 2 }}>
                                                          <Text style={{
                                                            color: hasSelectedSlots
                                                              ? (selectedSlotCount === totalSlotsInShift ? '#1890ff' : '#0958d9')
                                                              : '#595959'
                                                          }}>
                                                            Đã chọn: {selectedSlotCount}/{totalSlotsInShift}
                                                          </Text>
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: '#1890ff', marginTop: 4 }}>
                                                          Hover hoặc click để chọn slot
                                                        </div>
                                                      </div>
                                                    </Popover>
                                                    
                                                    
                                                    {shiftData?.mostFrequentRoom && (
                                                      <div style={{ fontSize: '10px', color: '#666', marginTop: 4 }}>
                                                        <HomeOutlined /> {shiftData.mostFrequentRoom.name}
                                                        {shiftData.mostFrequentRoom.subRoom && (
                                                          <span> - {shiftData.mostFrequentRoom.subRoom.name}</span>
                                                        )}
                                                      </div>
                                                    )}
                                                  </Space>
                                                ) : (
                                                  <Text type="secondary" style={{ fontSize: '11px' }}>Không có lịch</Text>
                                                )}
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ));
                            })()}
                          </>
                        )}
                      </div>

                      {/* Replacement Section */}
                      {totalSelectedSlotCountForStaff > 0 && (
                        <>
                          {loadingReplacementStaff ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                              <Spin size="large" tip="Đang tải danh sách nhân sự..." />
                            </div>
                          ) : replacementStaffList.length > 0 ? (
                            <>
                              <Divider>Chọn nhân sự thay thế</Divider>
                              
                              <Row gutter={16}>
                                <Col span={12}>
                                  <Card size="small" title="Thông tin thay thế (tất cả các tháng)">
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                      <Text><strong>Số slot đã chọn:</strong> {totalSelectedSlotCountForStaff} <Text type="secondary">(từ tất cả các tháng)</Text></Text>
                                      <Text><strong>Nhân sự hiện tại:</strong> {selectedStaffForReplacement ? (selectedStaffForReplacement.displayName || buildStaffDisplayName(selectedStaffForReplacement)) : 'Chưa chọn'}</Text>
                                      <Text><strong>Vai trò:</strong> <Tag color={getRoleTagColor(selectedStaffForReplacement?.assignmentRole || selectedStaffForReplacement?.role)}>
                                        {getRoleLabel(selectedStaffForReplacement?.assignmentRole || selectedStaffForReplacement?.role)}
                                      </Tag></Text>
                                    </Space>
                                  </Card>
                                </Col>
                                
                                <Col span={12}>
                                  <Card size="small" title="Chọn nhân sự mới">
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                      {/* <Input
                                        prefix={<SearchOutlined />}
                                        placeholder="Tìm nhân sự..."
                                        value={replacementStaffSearchValue}
                                        onChange={(e) => {
                                          setReplacementStaffSearchValue(e.target.value);
                                          debouncedReplacementStaffSearch(e.target.value);
                                        }}
                                        allowClear
                                      /> */}
                                      
                                      <Radio.Group 
                                        value={replacementStaffFilter} 
                                        onChange={(e) => setReplacementStaffFilter(e.target.value)}
                                        size="small"
                                        buttonStyle="solid"
                                        style={{ width: '100%' }}
                                      >
                                        <Radio.Button value="all" style={{ flex: 1, textAlign: 'center' }}>Tất cả</Radio.Button>
                                        <Radio.Button value="no-conflict" style={{ flex: 1, textAlign: 'center' }}>
                                          <CheckCircleOutlined /> Không trùng
                                        </Radio.Button>
                                        <Radio.Button value="has-conflict" style={{ flex: 1, textAlign: 'center' }}>
                                          <WarningOutlined /> Trùng lịch
                                        </Radio.Button>
                                      </Radio.Group>
                                      
                                      <Select
                                        style={{ width: '100%' }}
                                        placeholder="Chọn nhân sự thay thế"
                                        value={selectedReplacementStaff?._id}
                                        onChange={(staffId) => {
                                          const staff = replacementStaffList.find(s => s._id === staffId);
                                          setSelectedReplacementStaff(staff);
                                        }}
                                        showSearch
                                        optionFilterProp="staffsearch"
                                        filterOption={(input, option) =>
                                          option?.props?.staffsearch?.includes(normalizeLower(input))
                                        }
                                      >
                                        {replacementStaffList
                                          .filter(staff => {
                                            if (replacementStaffFilter === 'no-conflict') {
                                              return !staff.conflicts || staff.conflicts.length === 0;
                                            }
                                            if (replacementStaffFilter === 'has-conflict') {
                                              return staff.conflicts && staff.conflicts.length > 0;
                                            }
                                            return true;
                                          })
                                          .filter(staff => {
                                            if (!replacementStaffSearchTerm) return true;
                                            return staff.searchKeywords?.includes(replacementStaffSearchTerm);
                                          })
                                          .map(staff => {
                                            const conflictCount = staff.conflicts?.length || 0;
                                            const summarizedConflicts = summarizeConflictRanges(staff.conflicts || []);
                                            const previewConflicts = summarizedConflicts.slice(0, 2);
                                            // 🔥 Show all roles for multi-role users
                                            const assignmentRoles = staff.assignmentRoles || [staff.assignmentRole || staff.role];
                                            return (
                                              <Option
                                                key={staff._id}
                                                value={staff._id}
                                                staffsearch={staff.searchKeywords}
                                                disabled={conflictCount > 0}
                                              >
                                                <Space direction="vertical" style={{ width: '100%' }} size={4}>
                                                  <Space align="center" wrap>
                                                    <Space size={6} align="center">
                                                      {staff.employeeCode && (
                                                        <Tag color="blue" bordered={false}>{staff.employeeCode}</Tag>
                                                      )}
                                                      <Text strong style={{ color: conflictCount > 0 ? '#d9d9d9' : 'inherit' }}>{staff.displayName}</Text>
                                                      {/* 🔥 Display multiple role tags */}
                                                      {assignmentRoles.map(role => (
                                                        <Tag key={role} color={getRoleTagColor(role)} bordered={false}>
                                                          {getRoleLabel(role)}
                                                        </Tag>
                                                      ))}
                                                    </Space>
                                                    {conflictCount === 0 ? (
                                                      <Tag color="green" size="small">Không trùng</Tag>
                                                    ) : (
                                                      <Tag color="red" size="small">Trùng {conflictCount}</Tag>
                                                    )}
                                                  </Space>
                                                  {conflictCount > 0 && (
                                                    <div style={{ fontSize: 11, color: '#fa8c16' }}>
                                                      {previewConflicts.map((conflict, index) => (
                                                        <div key={`${staff._id}-replacement-conflict-${index}`}>
                                                          {formatConflictDescription(conflict)}
                                                        </div>
                                                      ))}
                                                      {summarizedConflicts.length > previewConflicts.length && (
                                                        <Text type="secondary">+{summarizedConflicts.length - previewConflicts.length} lịch khác</Text>
                                                      )}
                                                    </div>
                                                  )}
                                                </Space>
                                              </Option>
                                            );
                                          })
                                        }
                                      </Select>
                                      
                                      {/* Remove Staff Button */}
                                      <Button 
                                        danger
                                        block 
                                        onClick={() => {
                                          console.log('🔴 Remove Staff Button (Tab 2) CLICKED!');
                                          handleRemoveStaffFromReplacementSlots();
                                        }}
                                        disabled={totalSelectedSlotCountForStaff === 0}
                                        icon={<DeleteOutlined />}
                                      >
                                        Xóa nhân sự khỏi {totalSelectedSlotCountForStaff} slot đã chọn
                                      </Button>

                                      {/* Confirm Replacement Button */}
                                      <Button 
                                        type="primary" 
                                        block 
                                        onClick={handleConfirmReplacement}
                                        disabled={!selectedReplacementStaff}
                                        icon={<SwapOutlined />}
                                      >
                                        Xác nhận thay thế
                                      </Button>
                                    </Space>
                                  </Card>
                                </Col>
                              </Row>
                            </>
                          ) : null}
                        </>
                      )}
                    </Space>
                    </>
                  )}
                </Modal>
                
                {/* 🆕 Role Selection Modal for Multi-Role Users */}
                <Modal
                  title="Chọn vai trò để xem lịch"
                  open={showRoleSelectionModal}
                  onCancel={() => {
                    setShowRoleSelectionModal(false);
                    setPendingStaffForRoleSelection(null);
                  }}
                  footer={null}
                  width={500}
                >
                  {pendingStaffForRoleSelection && (
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      <div>
                        <Text strong>Nhân sự: </Text>
                        <Text>{pendingStaffForRoleSelection.displayName || pendingStaffForRoleSelection.fullName}</Text>
                      </div>
                      
                      <div>
                        <Text strong>Nhân sự này có nhiều vai trò. Vui lòng chọn vai trò để xem lịch làm việc:</Text>
                      </div>
                      
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {(pendingStaffForRoleSelection.assignmentRoles || [pendingStaffForRoleSelection.assignmentRole || pendingStaffForRoleSelection.role])
                          .filter(r => r === 'dentist' || r === 'nurse')
                          .map(role => (
                            <Button
                              key={role}
                              type="primary"
                              size="large"
                              block
                              icon={role === 'dentist' ? <UserOutlined /> : <MedicineBoxOutlined />}
                              onClick={async () => {
                                setShowRoleSelectionModal(false);
                                await openStaffScheduleModal(pendingStaffForRoleSelection, role);
                                setPendingStaffForRoleSelection(null);
                              }}
                            >
                              Xem lịch làm việc với vai trò: {getRoleLabel(role)}
                            </Button>
                          ))
                        }
                      </Space>
                    </Space>
                  )}
                </Modal>
              </>
            )
          }
        ]}
      />
    </div>
    </>
  );
};

export default StaffAssignmentUnified;
