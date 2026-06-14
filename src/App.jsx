import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Rooms from './pages/Rooms/Rooms';
import Reservations from './pages/Reservations/Reservations';
import Housekeeping from './pages/Housekeeping/Housekeeping';
import Folio from './pages/Folio/Folio';
import Login from './pages/Auth/Login';
import Guests from './pages/Guests/Guests';
import RoomTypes from './pages/RoomTypes/RoomTypes';
import Users from './pages/Users/Users';
import UserDetails from './pages/Users/UserDetails';
import Settings from './pages/Settings/Settings';
import ChargeTypes from './pages/ChargeTypes/ChargeTypes';
import PaymentMethods from './pages/PaymentMethods/PaymentMethods';
import Expenses from './pages/Expenses/Expenses';
import GeneralReports from './pages/Reports/GeneralReports';
import FinancialReports from './pages/Reports/FinancialReports';
import CheckIn from './pages/CheckIn/CheckIn';
import CheckOut from './pages/CheckOut/CheckOut';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import ShiftGuard from './components/ShiftGuard/ShiftGuard';
import Keycards from './pages/Keycards/Keycards';
import Venues from './pages/Venues/Venues';
import RoomDetails from './pages/Rooms/RoomDetails';
import VenueBookings from './pages/VenueBookings/VenueBookings';
import ShiftHandover from './pages/Shift/ShiftHandover';
import Employees from './pages/Employees/Employees';
import Currencies from './pages/Currencies/Currencies';


function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes - All require at least being logged in */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ShiftGuard><MainLayout /></ShiftGuard>}>
              {/* Main */}
              <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              {/* Operations */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST']} />}>
                  <Route path="/reservations" element={<Reservations />} />
                  <Route path="/check-in" element={<CheckIn />} />
                  <Route path="/rooms" element={<Rooms />} />
                  <Route path="/rooms/:id" element={<RoomDetails />} />
                  <Route path="/guests" element={<Guests />} />
                  <Route path="/check-out" element={<CheckOut />} />
                  <Route path="/keycards" element={<Keycards />} />
                  <Route path="/venues" element={<Venues />} />
                  <Route path="/venue-bookings" element={<VenueBookings />} />
                  <Route path="/shift-handover" element={<ShiftHandover />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_HOUSEKEEPING', 'ROLE_RECEPTIONIST']} />}>
                  <Route path="/housekeeping" element={<Housekeeping />} />
              </Route>
              {/* Financials */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT']} />}>
                  <Route path="/folio" element={<Folio />} />
                  <Route path="/charge-types" element={<ChargeTypes />} />
                  <Route path="/payment-methods" element={<PaymentMethods />} />
                  <Route path="/currencies" element={<Currencies />} />
                  <Route path="/expenses" element={<Expenses />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT']} />}>
                  <Route path="/reports/general" element={<GeneralReports />} />
                  <Route path="/reports/financial" element={<FinancialReports />} />
              </Route>
              {/* System */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN']} />}>
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/room-types" element={<RoomTypes />} /> 
                  <Route path="/users" element={<Users />} />
                  <Route path="/users/:id" element={<UserDetails />} />
                  <Route path="/employees" element={<Employees />} />
              </Route>

          </Route>
        </Route>
        
        {/* Catch-all undefined routes and redirect to root (helps prevent blank screens) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
