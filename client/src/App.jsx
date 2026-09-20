import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import PredictPage from "./pages/Predict.jsx";
import HistoryPage from "./pages/History.jsx";
import SettingsPage from "./pages/Settings.jsx";
import { useBrand } from "./BrandContext.jsx";

export default function App() {
  const { error } = useBrand();

  return (
    <div className="app-shell">
      <Header />
      {error ? (
        <div className="banner error">
          Could not load settings from MySQL: {error}. Import schema.sql and
          check server/.env.
        </div>
      ) : null}
      <main>
        <Routes>
          <Route path="/" element={<PredictPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
