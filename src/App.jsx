import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './lib/AuthProvider.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import AdminGuard from './components/AdminGuard.jsx';
import AuthGuard from './components/AuthGuard.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

import Home from './pages/Home.jsx';
import Listings from './pages/Listings.jsx';
import TenderDetail from './pages/TenderDetail.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import About from './pages/About.jsx';
import Onboard from './pages/Onboard.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import Dashboard from './pages/Dashboard.jsx';

import Consultants from './pages/Consultants.jsx';
import ConsultantDetail from './pages/ConsultantDetail.jsx';
import ConsultantSignup from './pages/ConsultantSignup.jsx';
import ConsultantDashboard from './pages/ConsultantDashboard.jsx';
import ConsultantEdit from './pages/ConsultantEdit.jsx';
import Hire from './pages/Hire.jsx';

import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUpload from './pages/AdminUpload.jsx';
import AdminConsultants from './pages/AdminConsultants.jsx';

import {
  Pricing, SubmitTender, Contact, FAQ, Glossary, Guide, Press,
  Privacy, Terms, Cookies, NotFound
} from './pages/InfoPages.jsx';

// Routes that render their own header/footer (or are intentionally chrome-less).
const FULL_BLEED_ROUTES = [
  '/admin',
  '/digest',
  '/onboard'
];

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
      </ChromeWrapper>
    </AuthProvider>
  );
}
