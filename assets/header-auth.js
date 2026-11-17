import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ldjrinmohlomzlyeagwd.supabase.co";
const SUPABASE_KEY = "sb_publishable_aMRUSYoNLbIriNAxLdu9mQ_KTqqefWR";
const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const form = document.getElementById("leonHeaderLoginForm");
const status = document.getElementById("leonHeaderLoginStatus");
const adminLink = document.querySelector(".leon-header-admin-link");

function authErrorMessage(error) {
  const code = String(error?.code || "").toLowerCase();
  const name = String(error?.name || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  const httpStatus = Number(error?.status || 0);
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) return "Logowanie odrzucone: nieprawidłowy e-mail lub hasło.";
  if (code === "email_not_confirmed") return "Konto wymaga potwierdzenia adresu e-mail.";
  if (code === "too_many_requests" || httpStatus === 429) return "Zbyt wiele prób logowania. Odczekaj chwilę i spróbuj ponownie.";
  if (name === "typeerror" || message.includes("failed to fetch") || message.includes("networkerror")) return "Nie można połączyć się z usługą logowania. Sprawdź połączenie i spróbuj ponownie.";
  if (code === "user_banned") return "Logowanie do tego konta jest tymczasowo zablokowane.";
  const safeCode = code.replace(/[^a-z0-9_-]/g, "").slice(0, 48);
  return "Usługa logowania zwróciła błąd" + (safeCode ? " (kod: " + safeCode + ")" : httpStatus ? " (HTTP " + httpStatus + ")" : "") + ". Nie zmieniaj hasła — potrzebna jest dalsza diagnostyka.";
}

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
    } catch (error) {
      console.warn("[LEON auth] Sign-in failed", { code: error?.code || null, status: error?.status || null, name: error?.name || null });
      status.textContent = "" + authErrorMessage(error);
    } finally {
      button.disabled = false;
    }
  });
}
