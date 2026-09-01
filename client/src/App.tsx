import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./auth/AuthContext";

function App() {
  return (
    <AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>
  );
}

export default App;
