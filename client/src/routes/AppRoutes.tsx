import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import InventoryPage from "../screens/Inventory/InventoryPage";
import DepartmentPage from "../screens/Departments/DepartmentPage";
import AccessoryDetailsPage from "../screens/AccessoryDetails/AccessoryDetailsPage";
import LaptopRentalPage from "../screens/LaptopRental/LaptopRentalpage";
import LoginPage from "../screens/Login/LoginPage";
import OtpVerificationPage from "../screens/Login/OtpVerificationPage";
import SettingsPage from "../screens/Settings/SettingsPage";
import DashboardPage from "../screens/Dashboard/DashboardPage";
import UsersPage from "../screens/Users/UsersPage";
import { ForbiddenPage, ProtectedRoute, RoleDefaultRedirect } from "./ProtectedRoute";
import { rolesFor } from "./routePermissions";

export default function AppRoutes() { return <Routes>
  <Route path="login" element={<LoginPage />} /><Route path="verify-otp" element={<OtpVerificationPage />} /><Route path="forbidden" element={<ForbiddenPage />} />
  <Route element={<ProtectedRoute />}><Route path="/" element={<MainLayout />}>
    <Route index element={<RoleDefaultRedirect />} />
    <Route element={<ProtectedRoute roles={rolesFor("/")} />}><Route path="dashboard" element={<DashboardPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/inventory")} />}><Route path="inventory" element={<InventoryPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/accessories")} />}><Route path="accessories" element={<AccessoryDetailsPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/laptop-rental")} />}><Route path="laptop-rental" element={<LaptopRentalPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/rental-dashboard")} />}><Route path="rental-dashboard" element={<Navigate to="/laptop-rental" replace />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/departments")} />}><Route path="departments" element={<DepartmentPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/settings")} />}><Route path="settings" element={<SettingsPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/users")} />}><Route path="users" element={<UsersPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/students")} />}><Route path="students" element={<Navigate to="/laptop-rental" replace />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/teachers")} />}><Route path="teachers" element={<Navigate to="/laptop-rental" replace />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/returns")} />}><Route path="returns" element={<Navigate to="/laptop-rental" replace />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/transfers")} />}><Route path="transfers" element={<Navigate to="/inventory" replace />} /></Route>
  </Route></Route>
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>; }
