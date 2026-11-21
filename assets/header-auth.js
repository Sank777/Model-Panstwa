import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.2";

const SUPABASE_URL = "https://ldjrinmohlomzlyeagwd.supabase.co";
const SUPABASE_KEY = "sb_publishable_aMRUSYoNLbIriNAxLdu9mQ_KTqqefWR";
const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const form = document.getElementById("leonHeaderLoginForm");
const status = document.getElementById("leonHeaderLoginStatus");
const adminLink = document.querySelector(".leon-header-admin-link");

function showAuthenticated(message) {
  status.textContent = message;
  adminLink.hidden = false;
}

if (form && status && adminLink) {
  client.auth.getSession().then(({ data, error }) => {
    if (!error && data.session) {
      showAuthenticated("Sesja jest aktywna. Uprawnienia zostaną sprawdzone po otwarciu panelu.");
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    if (!email || !password) return;
    button.disabled = true;
    status.textContent = "Sprawdzam dane logowania…";
    adminLink.hidden = true;
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      form.elements.password.value = "";
      showAuthenticated("Logowanie poprawne. Dostęp administratora zostanie zweryfikowany w panelu.");
    } catch {
      status.textContent = "Nie udało się zalogować. Sprawdź e-mail i hasło.";
    } finally {
      button.disabled = false;
    }
  });
}
