(() => {
  const client = window.paytrackSupabase;

  if (!client) {
    console.error("PayTrack Supabase client is not available.");
    return;
  }

  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginButton = document.getElementById("loginButton");
  const loginError = document.getElementById("loginError");

  function showLoginError(message) {
    if (!loginError) return;
    loginError.textContent = message || "Unable to sign in.";
    loginError.hidden = false;
  }

  function clearLoginError() {
    if (!loginError) return;
    loginError.textContent = "";
    loginError.hidden = true;
  }

  async function redirectAuthenticatedUser() {
    const { data, error } = await client.auth.getSession();
    if (error) {
      console.error("Unable to read auth session:", error);
      return;
    }

    if (data?.session) {
      window.location.replace("pages/dashboard.html");
    }
  }

  redirectAuthenticatedUser();

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearLoginError();

    const email = loginEmail?.value.trim();
    const password = loginPassword?.value || "";

    if (!email || !password) {
      showLoginError("Enter your email address and password.");
      return;
    }

    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent = "Signing in...";
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data?.session) throw new Error("A login session could not be created.");

      window.location.replace("pages/dashboard.html");
    } catch (error) {
      console.error("Sign in failed:", error);
      showLoginError(error?.message || "Unable to sign in.");
    } finally {
      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
      }
    }
  });
})();
