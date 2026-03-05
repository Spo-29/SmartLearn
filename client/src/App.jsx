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

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
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
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
