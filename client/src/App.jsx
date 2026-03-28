import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './components/pages/Home';
import Courses from './components/pages/Courses';
import Detail from './components/pages/Detail';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import MyLearning from './components/pages/account/MyLearning';
import MyCourses from './components/pages/account/MyCourses';
import ChangePassword from './components/pages/account/ChangePassword';
import WatchCourse from './components/pages/account/WatchCourse';
import Dashboard from './components/pages/account/Dashboard';
import { RequireAuth } from './components/common/RequireAuth';
import { AuthProvider } from './components/context/Auth';
import { Toaster } from 'react-hot-toast';
import CreateCourse from './components/pages/account/courses/CreateCourse';
import EditCourse from './components/pages/account/courses/EditCourse';

function App() {
  

  return (
    <>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/detail" element={<Detail />} />
            <Route path="/account/login" element={<Login />} />
            <Route path="/account/register" element={<Register />} />
            <Route path="/account/my-courses" element={<MyCourses />} />
            <Route path="/account/courses-enrolled" element={<MyLearning />} />
            <Route path="/account/watch-course" element={<WatchCourse />} />
            <Route path="/account/change-password" element={<ChangePassword />} />
            <Route
              path="/account/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/account/courses/create"
              element={
                <RequireAuth>
                  <CreateCourse />
                </RequireAuth>
              }
            />
            <Route
              path="/account/courses/edit/:id"
              element={
                <RequireAuth>
                  <EditCourse />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;
