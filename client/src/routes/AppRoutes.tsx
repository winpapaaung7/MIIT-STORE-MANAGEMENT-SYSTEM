import { Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import InventoryPage from "../screens/Inventory/InventoryPage";
import DepartmentPage from "../screens/Departments/DepartmentPage";
import AccessoryDetailsPage from "../screens/AccessoryDetails/AccessoryDetailsPage";
import LaptopRentalPage from "../screens/LaptopRental/LaptopRentalpage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Layout wrapper */}
      <Route path="/" element={<MainLayout />}>
        {/* if we have a dashboard page, we will add the following route */}
        {/* <Route index element={<div>Dashboard</div>} /> */}
        {/* this is the default route, when the user navigates to the root path, they will be redirected to the inventory page */}

        <Route index element={<InventoryPage />} />

        {/* our pages */}
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="departments" element={<DepartmentPage />} />
        <Route path="accessories" element={<AccessoryDetailsPage />} />
        <Route path="laptop-rental" element={<LaptopRentalPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
