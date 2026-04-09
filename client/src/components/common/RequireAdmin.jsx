import React from 'react';
import { Navigate } from 'react-router-dom';

export const RequireAdmin = ({ children }) => {
  const rawUserInfo = localStorage.getItem('userInfoLms');

  if (!rawUserInfo) {
    return <Navigate to="/account/login" replace />;
  }

  try {
    const userInfo = JSON.parse(rawUserInfo);
    const email = String(userInfo?.email || '').toLowerCase();
    const isAdmin = Boolean(userInfo?.isAdmin) || email === 'waliza@gmail.com';

    if (!userInfo?.token) {
      return <Navigate to="/account/login" replace />;
    }

    if (!isAdmin) {
      return <Navigate to="/account/dashboard" replace />;
    }
  } catch {
    return <Navigate to="/account/login" replace />;
  }

  return children;
};
