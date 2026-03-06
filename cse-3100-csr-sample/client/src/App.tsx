import { Outlet, Route, Routes } from "react-router-dom";
import BaseLayout from "./views/BaseLayout";

import Sessions from "./views/Sessions";
import Home from "./components/pages/Home";
import { Login } from "./components/pages/Login";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Routes>
        <Route element={<BaseLayout><Outlet /></BaseLayout>}>
          <Route path="/" element={<Home />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/login" element={<Login />} />
        </Route>
      </Routes>

      <Toaster position="top-center" />
    </>
  );
}

export default App;