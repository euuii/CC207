import { NavLink } from "react-router-dom";
import { useBrand } from "../BrandContext.jsx";

export default function Header() {
  const { settings, loading } = useBrand();
  const name = settings?.app_name || (loading ? "" : "—");
  const logo = settings?.logo_path;

  return (
    <header className="site-header">
      <div className="brand">
        {logo ? <img src={logo} alt="" className="brand-logo" /> : null}
        <div>
          <div className="brand-name">{name}</div>
          {settings?.active_model_name ? (
            <div className="brand-model">{settings.active_model_name}</div>
          ) : null}
        </div>
      </div>
      <nav>
        <NavLink to="/" end>
          Predict
        </NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
    </header>
  );
}
