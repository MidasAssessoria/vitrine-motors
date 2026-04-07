import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { useListingsStore } from './stores/listingsStore';
import { Loader2 } from 'lucide-react';

// ─── Eager: critical path (Home + Listings always needed) ───
import { Home } from './pages/Home';
import { Listings } from './pages/Listings';

// ─── Lazy: loaded on demand ───
const ListingDetail = lazy(() => import('./pages/ListingDetail').then(m => ({ default: m.ListingDetail })));
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then(m => ({ default: m.ResetPassword })));
const PublishListing = lazy(() => import('./pages/publish/PublishListing').then(m => ({ default: m.PublishListing })));
const SellerDashboard = lazy(() => import('./pages/dashboard/SellerDashboard').then(m => ({ default: m.SellerDashboard })));
const SubscriptionManager = lazy(() => import('./pages/dashboard/SubscriptionManager'));
const Favorites = lazy(() => import('./pages/Favorites').then(m => ({ default: m.Favorites })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const PublicProfile = lazy(() => import('./pages/PublicProfile').then(m => ({ default: m.PublicProfile })));
const EditProfile = lazy(() => import('./pages/EditProfile').then(m => ({ default: m.EditProfile })));
const MyProfile = lazy(() => import('./pages/MyProfile').then(m => ({ default: m.MyProfile })));
const ChatsPage = lazy(() => import('./pages/chat/ChatsPage').then(m => ({ default: m.ChatsPage })));
const ChatPage = lazy(() => import('./pages/chat/ChatPage').then(m => ({ default: m.ChatPage })));

// Tools
const PricingPage = lazy(() => import('./pages/pricing/PricingPage').then(m => ({ default: m.PricingPage })));
const FinancingCalculator = lazy(() => import('./pages/tools/FinancingCalculator').then(m => ({ default: m.FinancingCalculator })));
const VehicleComparator = lazy(() => import('./pages/tools/VehicleComparator').then(m => ({ default: m.VehicleComparator })));

// Legal
const TerminosServicio = lazy(() => import('./pages/legal/TerminosServicio').then(m => ({ default: m.TerminosServicio })));
const PoliticaPrivacidad = lazy(() => import('./pages/legal/PoliticaPrivacidad').then(m => ({ default: m.PoliticaPrivacidad })));

// Boost
const BoostSuccess = lazy(() => import('./pages/boost/BoostSuccess').then(m => ({ default: m.BoostSuccess })));
const BoostCancel = lazy(() => import('./pages/boost/BoostCancel').then(m => ({ default: m.BoostCancel })));

// Super Admin
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminListings = lazy(() => import('./pages/admin/AdminListings').then(m => ({ default: m.AdminListings })));
const AdminDealerships = lazy(() => import('./pages/admin/AdminDealerships').then(m => ({ default: m.AdminDealerships })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminImpersonate = lazy(() => import('./pages/admin/AdminImpersonate').then(m => ({ default: m.AdminImpersonate })));
const AdminCatalog = lazy(() => import('./pages/admin/AdminCatalog').then(m => ({ default: m.AdminCatalog })));
const AdminHero = lazy(() => import('./pages/admin/AdminHero').then(m => ({ default: m.AdminHero })));
const AdminDocuments = lazy(() => import('./pages/admin/AdminDocuments').then(m => ({ default: m.AdminDocuments })));
const AdminFinanceiro = lazy(() => import('./pages/admin/AdminFinanceiro').then(m => ({ default: m.AdminFinanceiro })));

// Dealer
const DealerLayout = lazy(() => import('./pages/dealer/DealerLayout').then(m => ({ default: m.DealerLayout })));
const DealerDashboard = lazy(() => import('./pages/dealer/DealerDashboard').then(m => ({ default: m.DealerDashboard })));
const DealerInventory = lazy(() => import('./pages/dealer/DealerInventory').then(m => ({ default: m.DealerInventory })));
const DealerLeads = lazy(() => import('./pages/dealer/DealerLeads').then(m => ({ default: m.DealerLeads })));
const DealerProfile = lazy(() => import('./pages/dealer/DealerProfile').then(m => ({ default: m.DealerProfile })));
const DealerAnalytics = lazy(() => import('./pages/dealer/DealerAnalytics').then(m => ({ default: m.DealerAnalytics })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const loadListings = useListingsStore((s) => s.loadListings);

  useEffect(() => {
    initialize();
    loadListings();
  }, [initialize, loadListings]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ─── Site publico (com header/footer) ─── */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/comprar" element={<Listings />} />
          <Route path="/autos" element={<Listings key="auto" vehicleType="auto" />} />
          <Route path="/motos" element={<Listings key="moto" vehicleType="moto" />} />
          <Route path="/barcos" element={<Listings key="barco" vehicleType="barco" />} />
          <Route path="/vehiculo/:id" element={<ListingDetail />} />
          <Route path="/vendedor/:id" element={<PublicProfile type="seller" />} />
          <Route path="/concesionaria/:id" element={<PublicProfile type="dealership" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/olvide-contrasena" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/publicar" element={
            <ProtectedRoute><PublishListing /></ProtectedRoute>
          } />
          <Route path="/editar/:id" element={
            <ProtectedRoute><PublishListing /></ProtectedRoute>
          } />

          <Route path="/perfil/editar" element={
            <ProtectedRoute><EditProfile /></ProtectedRoute>
          } />

          <Route path="/mi-perfil" element={
            <ProtectedRoute><MyProfile /></ProtectedRoute>
          } />

          <Route path="/mensajes" element={
            <ProtectedRoute><ChatsPage /></ProtectedRoute>
          } />
          <Route path="/mensajes/:id" element={
            <ProtectedRoute><ChatPage /></ProtectedRoute>
          } />

          <Route path="/panel" element={
            <ProtectedRoute><SellerDashboard /></ProtectedRoute>
          } />
          <Route path="/panel/assinatura" element={
            <ProtectedRoute><SubscriptionManager /></ProtectedRoute>
          } />

          <Route path="/favoritos" element={
            <ProtectedRoute><Favorites /></ProtectedRoute>
          } />

          <Route path="/precios" element={<PricingPage />} />
          <Route path="/financiar" element={<FinancingCalculator />} />
          <Route path="/comparar" element={<VehicleComparator />} />
          <Route path="/terminos" element={<TerminosServicio />} />
          <Route path="/privacidad" element={<PoliticaPrivacidad />} />
          <Route path="/boost/success" element={<BoostSuccess />} />
          <Route path="/boost/cancel" element={<BoostCancel />} />
        </Route>

        {/* ─── Super Admin ─── */}
        <Route element={<Layout />}>
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="dealers" element={<AdminDealerships />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="impersonate" element={<AdminImpersonate />} />
            <Route path="catalog" element={<AdminCatalog />} />
            <Route path="hero" element={<AdminHero />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="financiero" element={<AdminFinanceiro />} />
          </Route>
        </Route>

        {/* ─── Dealer Dashboard ─── */}
        <Route element={<Layout />}>
          <Route path="/dealer" element={
            <ProtectedRoute requiredRole="seller"><DealerLayout /></ProtectedRoute>
          }>
            <Route index element={<DealerDashboard />} />
            <Route path="inventory" element={<DealerInventory />} />
            <Route path="leads" element={<DealerLeads />} />
            <Route path="profile" element={<DealerProfile />} />
            <Route path="analytics" element={<DealerAnalytics />} />
          </Route>
        </Route>

        {/* ─── 404 ─── */}
        <Route element={<Layout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
