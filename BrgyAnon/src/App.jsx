import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Officials from "./pages/Officials.jsx";
import Home from "./pages/Home.jsx";
import NewReport from "./components/NewReport.jsx";
import Profile from "./pages/Profile.jsx";
import Reportfeed from "./pages/Reportfeed.jsx";
import Register from "./pages/Register.jsx"; 
import Admin from "./pages/Admin.jsx";
import Archive from "./pages/Archive.jsx"


export default function App() {
  return (

    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/officials" element={<Officials />} />
      <Route path="/home" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard/newreport" element={<NewReport />} />
      <Route path="/dashboard/profile" element={<Profile />} />
      <Route path="/dashboard/reportfeed" element={<Reportfeed />} />
      <Route path="/admin" element={<Admin/>}/>
      <Route path= "/archive" element={<Archive/>}/>
    </Routes>
  );
}
