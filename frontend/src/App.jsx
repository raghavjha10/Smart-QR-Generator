import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import MobileNav from "./components/MobileNav.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateQR from "./pages/CreateQR.jsx";
import QRDetails from "./pages/QRDetails.jsx";
import Analytics from "./pages/Analytics.jsx";
import History from "./pages/History.jsx";

function App() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateQR />} />
          <Route path="/qr/:id" element={<QRDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
      <MobileNav />
    </div>
  );
}

export default App;
