import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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
import MyAccount from './components/pages/account/MyAccount';
import { RequireAuth } from './components/common/RequireAuth';
import { AuthProvider } from './components/context/Auth';
import { Toaster } from 'react-hot-toast';
import CreateCourse from './components/pages/account/courses/CreateCourse';
import EditCourse from './components/pages/account/courses/EditCourse';
import EditLesson from './components/pages/account/courses/EditLesson';
import LessonBasicInfo from './components/pages/account/courses/LessonBasicInfo';
import CourseDetails from './components/pages/account/courses/CourseDetails';

function App() {
  return (
    <>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/account/register" replace />} />
            <Route
              path="/home"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
            <Route
              path="/courses"
              element={
                <RequireAuth>
                  <Courses />
                </RequireAuth>
              }
            />
            <Route
              path="/detail"
              element={
                <RequireAuth>
                  <Detail />
                </RequireAuth>
              }
            />
            <Route path="/account/login" element={<Login />} />
            <Route path="/account/register" element={<Register />} />
            <Route
              path="/account/profile"
              element={
                <RequireAuth>
                  <MyAccount />
                </RequireAuth>
              }
            />
            <Route
              path="/account/my-courses"
              element={
                <RequireAuth>
                  <MyCourses />
                </RequireAuth>
              }
            />
            <Route
              path="/account/my-learning"
              element={
                <RequireAuth>
                  <MyLearning />
                </RequireAuth>
              }
            />
            <Route
              path="/account/courses-enrolled"
              element={<Navigate to="/account/my-learning" replace />}
            />
            <Route
              path="/account/watch-course"
              element={
                <RequireAuth>
                  <WatchCourse />
                </RequireAuth>
              }
            />
            <Route
              path="/account/change-password"
              element={
                <RequireAuth>
                  <ChangePassword />
                </RequireAuth>
              }
            />
            <Route
              path="/account/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/account/my-courses/create"
              element={
                <RequireAuth>
                  <CreateCourse />
                </RequireAuth>
              }
            />
            <Route path="/account/courses/create" element={<Navigate to="/account/my-courses/create" replace />} />
            <Route
              path="/account/courses/:id"
              element={
                <RequireAuth>
                  <CourseDetails />
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
            <Route
              path="/account/courses/:courseId/lessons/:lessonId/edit"
              element={
                <RequireAuth>
                  <EditLesson />
                </RequireAuth>
              }
            />
            <Route
              path="/account/courses/:courseId/lessons/:lessonId"
              element={
                <RequireAuth>
                  <LessonBasicInfo />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/account/register" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;
