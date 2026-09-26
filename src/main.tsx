
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'


/* Bootstrap */
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap' // ✅ CRUCIAL (PAS le bundle minifié)
import "font-awesome/css/font-awesome.min.css"


ReactDOM.createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
)

