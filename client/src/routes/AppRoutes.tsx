import { Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import InventoryPage from "../screens/Inventory/InventoryPage";
import DepartmentPage from "../screens/Departments/DepartmentPage";
import AccessoryDetailsPage from "../screens/AccessoryDetails/AccessoryDetailsPage";
import LaptopRentalPage from "../screens/LaptopRental/LaptopRentalPage";
// import LoginPage from "../screens/Login/LoginPage";
import SettingsPage from "../screens/Settings/SettingsPage";
import DashboardPage from "../screens/Dashboard/DashboardPage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* <Route path="login" element={<LoginPage />} /> */}

      {/* Layout wrapper */}
      <Route path="/" element={<MainLayout />}>
        {/* if we have a dashboard page, we will add the following route */}
        {/* <Route index element={<div>Dashboard</div>} /> */}
        {/* this is the default route, when the user navigates to the root path, they will be redirected to the inventory page */}

        <Route index element={<DashboardPage />} />

        {/* our pages */}
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="departments" element={<DepartmentPage />} />
        <Route path="accessories" element={<AccessoryDetailsPage />} />
        <Route path="laptop-rental" element={<LaptopRentalPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
