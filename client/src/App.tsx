import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./auth/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
