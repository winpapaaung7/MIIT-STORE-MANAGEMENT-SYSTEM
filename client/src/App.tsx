import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./auth/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";

function ThemeController() {
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      localStorage.getItem("theme") === "dark",
    );
  }, []);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <LanguageProvider>
          <ThemeController />
          <AppRoutes />
        </LanguageProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
