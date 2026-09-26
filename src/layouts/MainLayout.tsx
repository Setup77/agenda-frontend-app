import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function MainLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <main className="container my-4 flex-grow-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default MainLayout
