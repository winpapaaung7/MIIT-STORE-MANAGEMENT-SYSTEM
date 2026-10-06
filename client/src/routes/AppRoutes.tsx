import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
const InventoryPage = lazy(() => import("../screens/Inventory/InventoryPage"));
const DepartmentPage = lazy(() => import("../screens/Departments/DepartmentPage"));
const DepartmentRoomsPage = lazy(() => import("../screens/Departments/DepartmentRoomsPage"));
const AccessoryDetailsPage = lazy(() => import("../screens/AccessoryDetails/AccessoryDetailsPage"));
const PublicAccessoryScanPage = lazy(() => import("../screens/AccessoryDetails/PublicAccessoryScanPage"));
const LaptopRentalPage = lazy(() => import("../screens/LaptopRental/LaptopRentalpage"));
const LoginPage = lazy(() => import("../screens/Login/LoginPage"));
const OtpVerificationPage = lazy(() => import("../screens/Login/OtpVerificationPage"));
const SettingsPage = lazy(() => import("../screens/Settings/SettingsPage"));
const DashboardPage = lazy(() => import("../screens/Dashboard/DashboardPage"));
const UsersPage = lazy(() => import("../screens/Users/UsersPage"));
import { ForbiddenPage, ProtectedRoute, RoleDefaultRedirect } from "./ProtectedRoute";
import { rolesFor } from "./routePermissions";

export default function AppRoutes() { return <Suspense fallback={<div role="status" className="p-6 text-sm text-slate-500">Loading page...</div>}><Routes>
  <Route path="scan/:code" element={<PublicAccessoryScanPage />} />
  <Route path="login" element={<LoginPage />} /><Route path="verify-otp" element={<OtpVerificationPage />} /><Route path="forbidden" element={<ForbiddenPage />} />
  <Route element={<ProtectedRoute />}><Route path="/" element={<MainLayout />}>
    <Route index element={<RoleDefaultRedirect />} />
    <Route element={<ProtectedRoute roles={rolesFor("/")} />}><Route path="dashboard" element={<DashboardPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/inventory")} />}><Route path="inventory" element={<InventoryPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/accessories")} />}><Route path="accessories" element={<AccessoryDetailsPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/my-department")} />}><Route path="my-department" element={<DashboardPage scope="mine" />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/laptop-rental")} />}><Route path="laptop-rental" element={<LaptopRentalPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/rental-dashboard")} />}><Route path="rental-dashboard" element={<Navigate to="/laptop-rental" replace />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/departments")} />}><Route path="departments" element={<DepartmentPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/departments")} />}><Route path="departments/:departmentId" element={<DepartmentRoomsPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/departments")} />}><Route path="departments/:departmentId/dashboard" element={<DashboardPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/settings")} />}><Route path="settings" element={<SettingsPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/users")} />}><Route path="users" element={<UsersPage />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/students")} />}><Route path="students" element={<Navigate to="/laptop-rental" replace />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/teachers")} />}><Route path="teachers" element={<Navigate to="/laptop-rental" replace />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/returns")} />}><Route path="returns" element={<Navigate to="/laptop-rental" replace />} /></Route>
    <Route element={<ProtectedRoute roles={rolesFor("/transfers")} />}><Route path="transfers" element={<Navigate to="/inventory" replace />} /></Route>
  </Route></Route>
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes></Suspense>; }
