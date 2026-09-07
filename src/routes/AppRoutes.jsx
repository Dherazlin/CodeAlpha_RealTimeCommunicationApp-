import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import CreateMeeting from '../pages/CreateMeeting';
import JoinMeeting from '../pages/JoinMeeting';
import MeetingRoom from '../pages/MeetingRoom';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/meeting/new" element={<CreateMeeting />} />
      <Route path="/meeting/join" element={<JoinMeeting />} />
      <Route path="/meeting/:roomId" element={<MeetingRoom />} />
      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
