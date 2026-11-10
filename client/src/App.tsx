import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Habits from "./pages/Habits";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Manage from "./pages/Manage";
import NewHabit from "./pages/NewHabit";
import Register from "./pages/Register";
import Statistics from "./pages/Statistics";
import VerifyOtp from "./pages/VerifyOtp";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/newhabit" element={<NewHabit />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/manage" element={<Manage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
