import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { LanguageProvider } from "./context/LanguageContext";

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppRoutes />
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
