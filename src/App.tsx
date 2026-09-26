import { Routes, Route } from "react-router-dom"
import MainLayout from "./layouts/MainLayout"

import Home from "./pages/Home"
import Agenda from "./pages/Agenda"
import Members from "./pages/Members"
import Profile from "./pages/Profile"
import Login from "./pages/Login"
import Register from "./pages/Register"

import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <Routes>
      {/* Layout GLOBAL (public + privé) */}
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/members" element={<Members />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protégé */}
        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <Agenda />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      <Route path="/profile/:id" element={<Profile />} />
      <Route path="/agenda/:id" element={<Agenda />} />

      </Route>
    </Routes>
  )
}

export default App
