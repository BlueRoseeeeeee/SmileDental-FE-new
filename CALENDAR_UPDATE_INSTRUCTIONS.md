# Instructions to Update ScheduleCalendar.jsx

## Changes needed:

### 1. Update `loadScheduleData` function (around line 91-125):

Replace the function with:

```javascript
  const loadScheduleData = useCallback(async () => {
    if (viewMode === 'room' && !selectedRoom) {
      return;
    }
    if (viewMode === 'dentist' && !selectedDentist) {
      return;
    }
    if (viewMode === 'nurse' && !selectedNurse) {
      return;
    }

    setLoading(true);
    try {
      if (viewMode === 'room') {
        const params = {
          viewType: 'week',
          page: currentPage,
          startDate: currentWeek.format('YYYY-MM-DD')
        };
        
        if (selectedSubRoom) {
          params.subRoomId = selectedSubRoom.id;
        }

        const response = await slotService.getRoomCalendar(selectedRoom.id, params);
        
        if (response?.success) {
          setCalendarData(response.data);
        } else {
          console.error('API returned error:', response);
          toast.error('API trả về lỗi');
          setCalendarData(null);
        }
      } else if (viewMode === 'dentist') {
        const response = await slotService.getDentistCalendar(
          selectedDentist.id,
          'week',
          currentWeek.format('YYYY-MM-DD'),
          undefined,
          currentPage,
          1
        );
        
        if (response?.success) {
          setCalendarData(response.data);
        } else {
          toast.error('Không thể tải lịch nha sĩ');
          setCalendarData(null);
        }
      } else if (viewMode === 'nurse') {
        const response = await slotService.getNurseCalendar(
          selectedNurse.id,
          'week',
          currentWeek.format('YYYY-MM-DD'),
          undefined,
          currentPage,
          1
        );
        
        if (response?.success) {
          setCalendarData(response.data);
        } else {
          toast.error('Không thể tải lịch y tá');
          setCalendarData(null);
        }
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
      toast.error(`Không thể tải dữ liệu lịch: ${error.message}`);
      setCalendarData(null);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedRoom, selectedSubRoom, selectedDentist, selectedNurse, currentWeek, currentPage]);
```

### 2. Add NurseSelector function (after DentistSelector, around line 240):

```javascript
  // Render nurse selector
  const NurseSelector = () => (
    <Select
      style={{ width: 300 }}
      placeholder="Chọn y tá"
      value={selectedNurse?.id}
      onChange={(nurseId) => {
        const nurse = nurses.find(n => n._id === nurseId);
        setSelectedNurse({ id: nurseId, ...nurse });
      }}
    >
      {nurses.map(nurse => (
        <Option key={nurse._id} value={nurse._id}>
          <MedicineBoxOutlined style={{ marginRight: 8 }} />
          {nurse.fullName}
        </Option>
      ))}
    </Select>
  );
```

### 3. Replace the view mode switch with Tabs (around line 359-368):

Replace:
```javascript
        {/* View Mode Selector */}
        <div className="view-mode-selector">
          <Switch
            checkedChildren="Theo nha sĩ"
            unCheckedChildren="Theo phòng"
            checked={viewMode === 'dentist'}
            onChange={(checked) => setViewMode(checked ? 'dentist' : 'room')}
          />
        </div>
```

With:
```javascript
        {/* View Mode Tabs */}
        <Tabs
          activeKey={viewMode}
          onChange={(key) => setViewMode(key)}
          items={[
            {
              key: 'room',
              label: (
                <span>
                  <HomeOutlined />
                  Theo Phòng
                </span>
              ),
            },
            {
              key: 'dentist',
              label: (
                <span>
                  <UserOutlined />
                  Theo Nha Sĩ
                </span>
              ),
            },
            {
              key: 'nurse',
              label: (
                <span>
                  <MedicineBoxOutlined />
                  Theo Y Tá
                </span>
              ),
            },
          ]}
        />
```

### 4. Update selector rendering (around line 395):

Replace:
```javascript
                {viewMode === 'room' ? <RoomSelector /> : <DentistSelector />}
```

With:
```javascript
                {viewMode === 'room' && <RoomSelector />}
                {viewMode === 'dentist' && <DentistSelector />}
                {viewMode === 'nurse' && <NurseSelector />}
```

### 5. Update condition checks (around line 399):

Replace:
```javascript
                {(viewMode === 'room' && selectedRoom) || (viewMode === 'dentist' && selectedDentist) ? (
```

With:
```javascript
                {(viewMode === 'room' && selectedRoom) || (viewMode === 'dentist' && selectedDentist) || (viewMode === 'nurse' && selectedNurse) ? (
```

### 6. Update placeholder text (around line 419):

Replace:
```javascript
                    Vui lòng chọn {viewMode === 'room' ? 'phòng' : 'nha sĩ'} để xem lịch
```

With:
```javascript
                    Vui lòng chọn {viewMode === 'room' ? 'phòng' : viewMode === 'dentist' ? 'nha sĩ' : 'y tá'} để xem lịch
```

These changes will add full support for viewing schedules by Room, Dentist, or Nurse with a tabbed interface.
