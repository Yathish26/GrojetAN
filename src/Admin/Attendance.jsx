
import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';


const Attendance = () => {
  const [loginTime, setLoginTime] = useState(null);
  const [logoutTime, setLogoutTime] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get adminId from localStorage (set by Layout)
  let adminId = null;
  try {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      adminId = JSON.parse(adminUser)._id;
    }
  } catch {}

  // On mount, fetch today's attendance
  useEffect(() => {
    if (!adminId) return;
    const fetchTodayAttendance = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SERVER}/attendance/${adminId}`);
        if (res.ok) {
          const records = await res.json();
          // Find today's record
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayRecord = records.find(r => {
            const punchIn = new Date(r.punchIn);
            punchIn.setHours(0, 0, 0, 0);
            return punchIn.getTime() === today.getTime();
          });
          if (todayRecord) {
            setLoginTime(todayRecord.punchIn ? new Date(todayRecord.punchIn) : null);
            setLogoutTime(todayRecord.punchOut ? new Date(todayRecord.punchOut) : null);
          } else {
            setLoginTime(null);
            setLogoutTime(null);
          }
        }
      } catch {}
    };
    fetchTodayAttendance();
    // eslint-disable-next-line
  }, [adminId]);

  // Format date as dd/mm/yy hh:mm:ss AM/PM
  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(-2);
    let hours = dateObj.getHours();
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    const ss = String(dateObj.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hh = String(hours).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${hh}:${min}:${ss} ${ampm}`;
  };

  // Calculate working hours in HH:MM:SS
  const getWorkingHours = () => {
    if (!loginTime || !logoutTime) return '';
    const diffMs = logoutTime - loginTime;
    if (diffMs < 0) return '';
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };


  const handleLogin = async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/attendance/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      if (res.ok) {
        const data = await res.json();
        // Use punchIn field from backend
        const now = new Date(data.attendance.punchIn || data.attendance.loginTime);
        setLoginTime(now);
        setLogoutTime(null);
        setPunchInTimes(prev => [now, ...prev]);
      }
    } catch (e) {
      // handle error
    }
    setLoading(false);
  };


  const handleLogout = async () => {
    if (!adminId || !loginTime) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/attendance/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      if (res.ok) {
        const data = await res.json();
        setLogoutTime(new Date(data.attendance.punchOut || data.attendance.logoutTime));
      }
    } catch (e) {
      // handle error
    }
    setLoading(false);
  };


  return (
    <Layout title="Attendance">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow border border-neutral-200 mt-8">
        {/* Working Hours Display */}
        {(loginTime && logoutTime) && (
          <div className="mb-4 text-blue-700 font-medium">
            Working Hours: {getWorkingHours()}
          </div>
        )}
        <div className="flex gap-4 mb-4">
          <button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            type="button"
            onClick={handleLogin}
            disabled={!!loginTime}
          >
            Punch In
          </button>
          <button
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            type="button"
            onClick={handleLogout}
            disabled={!loginTime || !!logoutTime}
          >
            Punch Out
          </button>
        </div>
        {loginTime && (
          <div className="mb-2 text-green-700 font-medium">Punch In Time: {formatDate(loginTime)}</div>
        )}
        {logoutTime && (
          <div className="mb-2 text-red-600 font-medium">Punch Out Time: {formatDate(logoutTime)}</div>
        )}
      </div>
    </Layout>
  );
};

export default Attendance;