
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

  const getTodayLabel = () => {
    const now = new Date();
    return now.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow border border-neutral-200 mt-8">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Today Attendance</h2>
            <p className="text-sm text-neutral-500 mt-1">{getTodayLabel()}</p>
          </div>

          <div className={`text-xs font-semibold px-3 py-1 rounded-full ${loginTime && logoutTime
            ? 'bg-blue-100 text-blue-700'
            : loginTime
              ? 'bg-amber-100 text-amber-700'
              : 'bg-neutral-100 text-neutral-600'
            }`}>
            {loginTime && logoutTime ? 'Completed' : loginTime ? 'In Progress' : 'Not Started'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            type="button"
            onClick={handleLogin}
            disabled={!!loginTime || loading}
          >
            {loading && !loginTime ? 'Please wait...' : 'Punch In'}
          </button>
          <button
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
            type="button"
            onClick={handleLogout}
            disabled={!loginTime || !!logoutTime || loading}
          >
            {loading && loginTime && !logoutTime ? 'Please wait...' : 'Punch Out'}
          </button>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-neutral-300" />

            <div className="relative mb-5">
              <span className="absolute -left-[1.05rem] top-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white" />
              <p className="text-sm font-semibold text-neutral-800">Punch In</p>
              <p className="text-sm text-neutral-600 mt-1">
                {loginTime ? formatDate(loginTime) : 'Not punched in yet'}
              </p>
            </div>

            <div className="relative">
              <span className="absolute -left-[1.05rem] top-1 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white" />
              <p className="text-sm font-semibold text-neutral-800">Punch Out</p>
              <p className="text-sm text-neutral-600 mt-1">
                {logoutTime ? formatDate(logoutTime) : 'Not punched out yet'}
              </p>
            </div>
          </div>
        </div>

        {loginTime && logoutTime && (
          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-blue-800">
              Total Working Hours: <span className="font-semibold">{getWorkingHours()}</span>
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Attendance;