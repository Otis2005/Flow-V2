import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './lib/AuthProvider.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import AdminGuard from './components/AdminGuard.jsx';
import AuthGuard from './components/AuthGuard.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

// Eagerly loaded: the routes most visitors hit first.
import Home from './pages/Home.jsx';
import Listings from './pages/Listings.jsx';
import TenderDetail from './pages/TenderDetail.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import About from './pages/About.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';

// Code-split: pages that 90% of visitors never touch. Browser only
// downloads these chunks when the user actually navigates to them,
// keeping the initial bundle small.
const Onboard = lazy(() => import('./pages/Onboard.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Consultants = lazy(() => import('./pages/Consultants.jsx'));
const ConsultantDetail = lazy(() => import('./pages/ConsultantDetail.jsx'));
const ConsultantSignup = lazy(() => import('./pages/ConsultantSignup.jsx'));
const ConsultantDashboard = lazy(() => import('./pages/ConsultantDashboard.jsx'));
const ConsultantEdit = lazy(() => import('./pages/ConsultantEdit.jsx'));
const Hire = lazy(() => import('./pages/Hire.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const AdminUpload = lazy(() => import('./pages/AdminUpload.jsx'));
const AdminConsultants = lazy(() => import('./pages/AdminConsultants.jsx'));

// Info pages are tiny but never on the critical path; bundle them
// together by re-exporting from one lazy chunk.
const InfoModule = () => import('./pages/InfoPages.jsx');
const Pricing = lazy(() => InfoModule().then(m => ({ default: m.Pricing })));
const SubmitTender = lazy(() => InfoModule().then(m => ({ default: m.SubmitTender })));
const Contact = lazy(() => InfoModule().then(m => ({ default: m.Contact })));
const FAQ = lazy(() => InfoModule().then(m => ({ default: m.FAQ })));
const Glossary = lazy(() => InfoModule().then(m => ({ default: m.Glossary })));
const Guide = lazy(() => InfoModule().then(m => ({ default: m.Guide })));
const Press = lazy(() => InfoModule().then(m => ({ default: m.Press })));
const Privacy = lazy(() => InfoModule().then(m => ({ default: m.Privacy })));
const Terms = lazy(() => InfoModule().then(m => ({ default: m.Terms })));
const Cookies = lazy(() => InfoModule().then(m => ({ default: m.Cookies })));
const NotFound = lazy(() => InfoModule().then(m => ({ default: m.NotFound })));

// Tiny inline loading state. Used for the initial render of lazy chunks.
function PageLoading() {
  return (
    <main style={{ padding: '120px 0', textAlign: 'center' }}>
      <div className="tf-eyebrow">Loading…</div>
    </main>
  );
}

// Routes that render their own header/footer (or are intentionally chrome-less).
const FULL_BLEED_ROUTES = ['/admin', '/digest', '/onboard'];

function isFullBleed(pathname) {
  return FULL_BLEED_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function ChromeWrapper({ children }) {
  const location = useLocation();
  const fullBleed = isFullBleed(location.pathname);
  return (
    <div className="tf-shell">
      {!fullBleed && <Header />}
      {children}
      {!fullBleed && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <ChromeWrapper>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tenders" element={<Listings />} />
            <Route path="/tenders/:id" element={<TenderDetail />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />

            <Route path="/digest" element={<Onboard />} />
            <Route path="/onboard" element={<Onboard />} />

            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/signup" element={<SignUp />} />

            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />

            <Route path="/consultants" element={<AuthGuard><Consultants /></AuthGuard>} />
            <Route path="/consultants/:id" element={<AuthGuard><ConsultantDetail /></AuthGuard>} />
            <Route path="/consultant-signup" element={<ConsultantSignup />} />
            <Route path="/consultant-dashboard" element={<AuthGuard><ConsultantDashboard /></AuthGuard>} />
            <Route path="/consultant-edit" element={<AuthGuard><ConsultantEdit /></AuthGuard>} />
            <Route path="/hire" element={<AuthGuard><Hire /></AuthGuard>} />

            <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            <Route path="/admin/upload" element={<AdminGuard><AdminUpload /></AdminGuard>} />
            <Route path="/admin/consultants" element={<AdminGuard><AdminConsultants /></AdminGuard>} />

            <Route path="/pricing" element={<Pricing />} />
            <Route path="/submit-tender" element={<SubmitTender />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/press" element={<Press />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ChromeWrapper>
    </AuthProvider>
  );
}
