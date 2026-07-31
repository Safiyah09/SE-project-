import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import LoginPage    from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage  from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import BillingPage   from './pages/BillingPage';
import SalesPage     from './pages/SalesPage';
import SuppliersPage from './pages/SuppliersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          gutter={12}
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '20px',
              padding: '16px 24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
              border: '1px solid #f3f4f6',
              background: '#ffffff',
              color: '#111827',
            },
            success: {
              iconTheme: { primary: '#2f8d46', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#e11d48', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — wrapped in Layout (sidebar + navbar) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products"  element={<ProductsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/billing"   element={<BillingPage />} />
              <Route path="/sales"     element={<SalesPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
