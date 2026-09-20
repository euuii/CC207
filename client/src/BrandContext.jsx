import { createContext, useContext, useEffect, useState } from "react";
import { getSettings } from "./api";

const BrandContext = createContext({
  settings: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

function applyDocumentBrand(settings) {
  if (!settings) return;

  document.title = settings.app_name || "";

  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = settings.logo_path || "";
}

export function BrandProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refresh() {
    const data = await getSettings();
    setSettings(data);
    applyDocumentBrand(data);
    return data;
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <BrandContext.Provider value={{ settings, loading, error, refresh }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
