/* assets/js/profile.js
   Profile page auth (ONLY for profile.html)
   - Firebase modular SDK
   - Google sign-in
   - Email + Password sign up / login
   - No phone / OTP
*/

// Only run UI logic on profile.html
const isProfilePage = window.location.pathname.endsWith("profile.html");

/* ---------- Firebase imports (modular) ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ---------- Your Firebase config ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBok3WdamaRJaVCzznMwB-lwHVWoHAM2i4",
  authDomain: "greenwrite-704d9.firebaseapp.com",
  projectId: "greenwrite-704d9",
  storageBucket: "greenwrite-704d9.firebasestorage.app",
  messagingSenderId: "815467329176",
  appId: "1:815467329176:web:d7d767409867d2c2eb82ed",
  measurementId: "G-2192KW3Y9J"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";

const $ = (sel) => document.querySelector(sel);

/* ---------- UI render functions ---------- */

function renderLoggedOut() {
  if (!isProfilePage) return;
  const root = $("#profileRoot");
  if (!root) return;

  root.innerHTML = `
    <h3 style="margin-top:0">Login or Sign up</h3>
    <p class="small" style="color:var(--muted)">
      Use Google or email & password to create a simple profile for GreenWrite orders.
    </p>

    <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
      <button id="btnGoogle" class="btn" type="button">Continue with Google</button>

      <div class="card" style="margin-top:6px;padding:10px;border-radius:10px">
        <label class="small" for="emailInput">Email</label>
        <input id="emailInput" type="email"
               placeholder="you@example.com"
               style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />

        <label class="small" for="passwordInput" style="margin-top:6px">Password (min 6 characters)</label>
        <input id="passwordInput" type="password"
               placeholder="********"
               style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />

        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <button id="btnEmailLogin" class="btn secondary" type="button">Login</button>
          <button id="btnEmailSignup" class="btn" type="button">Sign up</button>
        </div>

        <div id="profileMsg" class="small" style="margin-top:8px;color:var(--muted)"></div>
      </div>
    </div>
  `;

  attachLoggedOutHandlers();
}

function renderLoggedIn(user) {
  if (!isProfilePage) return;
  const root = $("#profileRoot");
  if (!root) return;

  const name  = user.displayName || user.email || "GreenWrite user";
  const email = user.email || "Not set";

  root.innerHTML = `
    <h3 style="margin-top:0">Welcome, ${escapeHtml(name)}</h3>
    <p class="small" style="color:var(--muted)">
      You are logged in. We will use this info to auto-fill the order form in this browser.
    </p>

    <div class="card" style="margin-top:10px;padding:10px;border-radius:10px">
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    </div>

    <p class="small" style="margin-top:8px">
      Tip: Open the home page order form. Your name & email can be auto-filled using this profile.
    </p>

    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
      <button id="btnGoOrder" class="btn secondary" type="button">Go to Order Form</button>
      <button id="btnLogout" class="btn" type="button">Log out</button>
    </div>
  `;

  // Save minimal profile to localStorage for auto-fill (optional)
  try {
    const mini = { name, email };
    localStorage.setItem("greenwrite_profile", JSON.stringify(mini));
  } catch (e) {
    console.warn("Could not save profile locally", e);
  }

  const btnLogout = $("#btnLogout");
  const btnGoOrder = $("#btnGoOrder");

  btnLogout &&
    btnLogout.addEventListener("click", () => {
      signOut(auth).catch(console.error);
    });

  btnGoOrder &&
    btnGoOrder.addEventListener("click", () => {
      window.location.href = "index.html#order";
    });
}

/* ---------- Helper ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[s])
  );
}

/* ---------- Attach handlers for logged-out view ---------- */
function attachLoggedOutHandlers() {
  const btnGoogle      = $("#btnGoogle");
  const btnEmailLogin  = $("#btnEmailLogin");
  const btnEmailSignup = $("#btnEmailSignup");
  const emailInput     = $("#emailInput");
  const passwordInput  = $("#passwordInput");
  const msgEl          = $("#profileMsg");

  function showMsg(text, isError = false) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color = isError ? "#b00020" : "var(--muted)";
  }

  // Google login
  if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged will re-render UI
      } catch (err) {
        console.error(err);
        showMsg("Google login failed. Check console for details.", true);
      }
    });
  }

  // Email/password: Sign up
  if (btnEmailSignup) {
    btnEmailSignup.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const pass  = passwordInput.value;

      // Basic validation (avoid auth/invalid-email)
      if (!email || !email.includes("@") || !email.includes(".")) {
        showMsg("Enter a valid email like you@example.com", true);
        return;
      }
      if (!pass || pass.length < 6) {
        showMsg("Password must be at least 6 characters.", true);
        return;
      }

      showMsg("Creating account...");

      try {
        await createUserWithEmailAndPassword(auth, email, pass);
        showMsg("Account created! You are now logged in.");
      } catch (err) {
        console.error(err);
        if (err.code === "auth/email-already-in-use") {
          showMsg("This email already has an account. Try logging in.", true);
        } else if (err.code === "auth/invalid-email") {
          showMsg("Email format invalid. Use something like you@example.com.", true);
        } else {
          showMsg(err.message || "Could not create account.", true);
        }
      }
    });
  }

  // Email/password: Login
  if (btnEmailLogin) {
    btnEmailLogin.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const pass  = passwordInput.value;

      if (!email || !email.includes("@") || !email.includes(".")) {
        showMsg("Enter a valid email like you@example.com", true);
        return;
      }
      if (!pass) {
        showMsg("Enter your password.", true);
        return;
      }

      showMsg("Logging in...");

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        showMsg("Logged in!");
      } catch (err) {
        console.error(err);
        if (err.code === "auth/user-not-found") {
          showMsg("No account with this email. Try Sign up.", true);
        } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
          showMsg("Wrong password. Try again.", true);
        } else {
          showMsg(err.message || "Login failed.", true);
        }
      }
    });
  }
}

/* ---------- Auth state listener ---------- */
if (isProfilePage) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      renderLoggedIn(user);
    } else {
      renderLoggedOut();
    }
  });
}
