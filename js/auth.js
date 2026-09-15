/* ==================================================
   PAYTRACK SME — AUTHENTICATION
================================================== */

const supabaseClient =
  window.paytrackSupabase;


/* ==================================================
   AUTH PAGE REDIRECT
================================================== */

async function redirectAuthenticatedUser() {

  const isLoginPage =
    document.getElementById(
      "loginForm"
    );

  const isSignupPage =
    document.getElementById(
      "signupForm"
    );


  if (
    !isLoginPage &&
    !isSignupPage
  ) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient.auth
      .getSession();


  if (error) {

    console.error(
      "Session check failed:",
      error
    );

    return;
  }


  if (data.session) {

    window.location.replace(
      "pages/dashboard.html"
    );

  }

}



/* ==================================================
   ERROR HELPERS
================================================== */

function showAuthError(
  element,
  message
) {

  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.hidden =
    false;

}


function clearAuthError(
  element
) {

  if (!element) {
    return;
  }


  element.textContent = "";

  element.hidden =
    true;

}



/* ==================================================
   LOGIN
================================================== */

const loginForm =
  document.getElementById(
    "loginForm"
  );


if (loginForm) {

  const loginEmail =
    document.getElementById(
      "loginEmail"
    );

  const loginPassword =
    document.getElementById(
      "loginPassword"
    );

  const loginError =
    document.getElementById(
      "loginError"
    );

  const loginSubmitButton =
    document.getElementById(
      "loginSubmitButton"
    );


  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      clearAuthError(
        loginError
      );


      const email =
        loginEmail.value
          .trim();


      const password =
        loginPassword.value;


      if (
        !email ||
        !password
      ) {

        showAuthError(
          loginError,
          "Enter your email and password."
        );

        return;

      }


      loginSubmitButton.disabled =
        true;


      loginSubmitButton.textContent =
        "Signing In...";


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signInWithPassword({
              email,
              password
            });


        if (error) {

          console.error(
            "Login failed:",
            error
          );


          showAuthError(
            loginError,
            error.message
          );


          return;

        }


        if (
          !data ||
          !data.session
        ) {

          console.error(
            "Login succeeded but no session was returned.",
            data
          );


          showAuthError(
            loginError,
            "Sign in succeeded, but no session was created."
          );


          return;

        }


        console.log(
          "Login successful:",
          data.user?.email
        );


        window.location.replace(
          "pages/dashboard.html"
        );

      }
      catch (error) {

        console.error(
          "Unexpected login error:",
          error
        );


        showAuthError(
          loginError,
          "Unable to sign in. Please try again."
        );

      }
      finally {

        loginSubmitButton.disabled =
          false;


        loginSubmitButton.textContent =
          "Sign In";

      }

    }
  );

}



/* ==================================================
   SIGN UP
================================================== */

const signupForm =
  document.getElementById(
    "signupForm"
  );


if (signupForm) {

  const signupFullName =
    document.getElementById(
      "signupFullName"
    );

  const signupEmail =
    document.getElementById(
      "signupEmail"
    );

  const signupPassword =
    document.getElementById(
      "signupPassword"
    );

  const signupConfirmPassword =
    document.getElementById(
      "signupConfirmPassword"
    );

  const signupError =
    document.getElementById(
      "signupError"
    );

  const signupSubmitButton =
    document.getElementById(
      "signupSubmitButton"
    );


  signupForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      clearAuthError(
        signupError
      );


      const fullName =
        signupFullName.value
          .trim();


      const email =
        signupEmail.value
          .trim();


      const password =
        signupPassword.value;


      const confirmPassword =
        signupConfirmPassword.value;


      if (
        password !==
        confirmPassword
      ) {

        showAuthError(
          signupError,
          "Passwords do not match."
        );

        return;

      }


      if (
        password.length < 8
      ) {

        showAuthError(
          signupError,
          "Password must contain at least 8 characters."
        );

        return;

      }


      signupSubmitButton.disabled =
        true;


      signupSubmitButton.textContent =
        "Creating Account...";


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signUp({

              email,

              password,

              options: {

                data: {
                  full_name:
                    fullName
                }

              }

            });


        if (error) {

          console.error(
            "Signup failed:",
            error
          );


          showAuthError(
            signupError,
            error.message
          );


          return;

        }


        if (data.session) {

          window.location.replace(
            "pages/dashboard.html"
          );

          return;

        }


        showAuthError(
          signupError,
          "Account created. Please confirm your email before signing in."
        );

      }
      catch (error) {

        console.error(
          "Unexpected signup error:",
          error
        );


        showAuthError(
          signupError,
          "Unable to create account."
        );

      }
      finally {

        signupSubmitButton.disabled =
          false;


        signupSubmitButton.textContent =
          "Create Account";

      }

    }
  );

}



/* ==================================================
   INITIALISE AUTH PAGE
================================================== */

redirectAuthenticatedUser();