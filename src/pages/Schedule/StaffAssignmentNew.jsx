/**
 * @author: TrungNghia & HoTram  
 * Component: Staff Assignment - Simplified version using StaffAssignmentUnified
 * This component redirects to the unified interface
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StaffAssignment = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to unified staff assignment interface
    navigate('/dashboard/schedules/staff-assignment-unified', { replace: true });
  }, [navigate]);

  return null; // Component redirects immediately
};

export default StaffAssignment;

