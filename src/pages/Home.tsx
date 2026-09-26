import { useEffect, useRef } from "react";
import { Toast } from "bootstrap";
import { Link } from "react-router-dom";

function Home() {
  const logoutToastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("logout") === "true") {
      if (logoutToastRef.current) {
        new Toast(logoutToastRef.current).show();
      }
      sessionStorage.removeItem("logout");
    }
  }, []);

  const testAccounts = [
    { email: "nokewi@gmail.com", pass: "azerty" },
    { email: "nono@gmail.com", pass: "azerty" },
    { email: "tala@gmail.com", pass: "azerty" },
  ];

  return (
    <div className="container py-5">
      {/* Toast logout */}
      <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
        <div ref={logoutToastRef} className="toast text-bg-success" role="alert">
          <div className="toast-body">Déconnexion réussie.</div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="row align-items-center g-5 py-5">
        <div className="col-lg-6 text-center text-lg-start">
          <h1 className="display-4 fw-bold lh-1 mb-3" translate="no">
            Mini Réseau Social
          </h1>
          <p className="col-lg-10 fs-4">
            Gérez vos contacts et votre emploi du temps en un seul endroit. 
            Une solution moderne avec un <strong>agenda collaboratif</strong> puissant.
          </p>
          <div className="d-grid gap-2 d-md-flex justify-content-md-start mt-4">
            <Link to="/login" className="btn btn-primary btn-lg px-4 me-md-2">Tester l'application</Link>
            <Link to="/register" className="btn btn-outline-secondary btn-lg px-4">Créer un compte</Link>
          </div>
        </div>

        {/* Section Comptes de Test */}
        <div className="col-md-10 mx-auto col-lg-6">
          <div className="card shadow-sm border-primary">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="card-title mb-0">🚀 Accès Rapide (Mode Démo)</h5>
            </div>
            <div className="card-body p-4">
              <p className="text-muted small">Utilisez ces comptes pour explorer les fonctionnalités :</p>
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Mot de passe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testAccounts.map((acc, index) => (
                      <tr key={index}>
                        <td><code className="text-primary">{acc.email}</code></td>
                        <td><code>{acc.pass}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="alert alert-info mb-0 py-2 small">
                <i className="fa fa-info-circle me-2"></i>
                Cliquez sur <strong>Login</strong> pour vous connecter.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features rapides */}
      <div className="row g-4 py-5 row-cols-1 row-cols-md-3">
        <div className="col text-center">
          <div className="feature-icon bg-primary bg-gradient text-white mb-3 py-3 rounded">
            <i className="fa fa-calendar fa-2x"></i>
          </div>
          <h3>Agenda</h3>
          <p>Visualisation FullCalendar avec gestion d'événements en temps réel.</p>
        </div>
        <div className="col text-center">
          <div className="feature-icon bg-primary bg-gradient text-white mb-3 py-3 rounded">
            <i className="fa fa-users fa-2x"></i>
          </div>
          <h3>Membres</h3>
          <p>Consultez la liste des membres et accédez à leurs profils publics.</p>
        </div>
        <div className="col text-center">
          <div className="feature-icon bg-primary bg-gradient text-white mb-3 py-3 rounded">
            <i className="fa fa-lock fa-2x"></i>
          </div>
          <h3>Sécurisé</h3>
          <p>Routes protégées et gestion d'authentification robuste.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
