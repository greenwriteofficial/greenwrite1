/* assets/js/profile.js
   Firebase Auth (Google + Phone) ONLY for profile.html
   - Uses modular Firebase SDK (v10)
   - Saves minimal profile (name, email, phone) in localStorage
   - Does NOTHING on other pages
*/

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ---------- Only care about profile.html ---------- */
const isProfilePage =
  window.location.pathname.endsWith("profile.html") ||
  document.title.toLowerCase().includes("profile");

if (!isProfilePage) {
  // We still init Firebase (safe), but we won't touch the DOM.
  console.log("profile.js: not profile.html, no UI changes.");
}

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

/* ---------- Initialize Firebase (reuse app if already created) ---------- */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";

/* ---------- Helpers ---------- */
const $ = (sel) => document.querySelector(sel);

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

/* ---------- Only build UI when we are on profile.html ---------- */
if (isProfilePage) {
  window.addEventListener("DOMContentLoaded", () => {
    let recaptchaVerifier = null;
    let confirmationResult = null;

    function setupRecaptcha() {
      if (recaptchaVerifier) return recaptchaVerifier;
      const containerId = "recaptcha-container";
      const container = document.getElementById(containerId);
      if (!container) {
        console.warn("No #recaptcha-container element found.");
        return null;
      }
      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA solved");
        }
      });
      return recaptchaVerifier;
    }

    /* ------------ RENDER STATES ------------ */

    function renderLoggedOut() {
      const root = $("#profileRoot");
      if (!root) return;

      root.innerHTML = `
        <h3 style="margin-top:0">Login or Sign up</h3>
        <p class="small" style="color:var(--muted)">
          Use Google or your phone number to create a simple profile.
          This is only for demo and order auto-fill.
        </p>

        <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
          <button id="btnGoogle" class="btn" type="button">Continue with Google</button>

          <div class="card" style="margin-top:6px;padding:10px;border-radius:10px">
            <label class="small" for="phoneInput">Login with phone (with country code)</label>
            <input id="phoneInput" type="tel"
                   placeholder="+91 98765 43210"
                   style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />
            <button id="btnSendOtp" class="btn secondary" type="button" style="margin-top:6px">Send OTP</button>

            <div id="otpArea" style="display:none;margin-top:8px">
              <label class="small" for="otpInput">Enter OTP</label>
              <input id="otpInput" type="text" placeholder="123456"
                     style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />
              <button id="btnVerifyOtp" class="btn" type="button" style="margin-top:6px">Verify & Login</button>
            </div>
            <div id="phoneMsg" class="small" style="margin-top:6px;color:var(--muted)"></div>
          </div>
        </div>

        <div id="recaptcha-container" style="margin-top:10px"></div>
      `;

      attachLoggedOutHandlers();
    }

    function renderLoggedIn(user) {
      const root = $("#profileRoot");
      if (!root) return;

      const name  = user.displayName || "GreenWrite user";
      const phone = user.phoneNumber || "Not set";
      const email = user.email || "Not set";

      root.innerHTML = `
        <h3 style="margin-top:0">Welcome, ${escapeHtml(name)}</h3>
        <p class="small" style="color:var(--muted)">
          You are logged in. We will use this info to auto-fill the order form
          on the website (in this browser only).
        </p>

        <div class="card" style="margin-top:10px;padding:10px;border-radius:10px">
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        </div>

        <p class="small" style="margin-top:8px">
          Tip: Go to the home page order form. Your name, phone and email
          can be auto-filled using this profile.
        </p>

        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button id="btnFillOrder" class="btn secondary" type="button">Open Order Form</button>
          <button id="btnLogout" class="btn" type="button">Log out</button>
        </div>
      `;

      // Save minimal profile to localStorage for order form auto-fill
      try {
        const mini = {
          name,
          email: user.email || "",
          phone: user.phoneNumber || ""
        };
        localStorage.setItem("greenwrite_profile", JSON.stringify(mini));
      } catch (e) {
        console.warn("Could not save profile locally", e);
      }

      const btnLogout   = $("#btnLogout");
      const btnFillForm = $("#btnFillOrder");

      btnLogout &&
        btnLogout.addEventListener("click", () => {
          signOut(auth).catch(console.error);
        });

      btnFillForm &&
        btnFillForm.addEventListener("click", () => {
          window.location.href = "index.html#order";
        });
    }

    /* ------------ Logged out handlers (Google + Phone) ------------ */

    function attachLoggedOutHandlers() {
      const btnGoogle    = $("#btnGoogle");
      const btnSendOtp   = $("#btnSendOtp");
      const btnVerifyOtp = $("#btnVerifyOtp");
      const phoneInput   = $("#phoneInput");
      const otpArea      = $("#otpArea");
      const otpInput     = $("#otpInput");
      const phoneMsg     = $("#phoneMsg");

      // Google sign-in
      if (btnGoogle) {
        btnGoogle.addEventListener("click", async () => {
          try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
          } catch (err) {
            console.error(err);
            alert("Google login failed. Check console for details.");
          }
        });
      }

      // Send OTP
      if (btnSendOtp && phoneInput) {
        btnSendOtp.addEventListener("click", async () => {
          const phone = phoneInput.value.trim();
          if (!phone) {
            phoneMsg.textContent = "Enter phone number with country code (e.g., +91...).";
            return;
          }
          phoneMsg.textContent = "Sending OTP...";
          try {
            const verifier = setupRecaptcha();
            if (!verifier) {
              phoneMsg.textContent = "reCAPTCHA error. Please refresh the page.";
              return;
            }
            confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
            otpArea.style.display = "block";
            phoneMsg.textContent = "OTP sent. Please check your phone.";
          } catch (err) {
            console.error(err);
            if (err.code === "auth/billing-not-enabled") {
              phoneMsg.textContent =
                "Phone auth is not enabled for this Firebase project. (You must enable billing in Firebase console.)";
            } else {
              phoneMsg.textContent = "Failed to send OTP. Check number and try again.";
            }
          }
        });
      }

      // Verify OTP
      if (btnVerifyOtp && otpInput) {
        btnVerifyOtp.addEventListener("click", async () => {
          const code = otpInput.value.trim();
          if (!code || !confirmationResult) return;
          phoneMsg.textContent = "Verifying...";
          try {
            await confirmationResult.confirm(code);
            phoneMsg.textContent = "Phone verified!";
          } catch (err) {
            console.error(err);
            phoneMsg.textContent = "Invalid OTP. Please try again.";
          }
        });
      }
    }

    /* ------------ Auth state listener ------------ */
    onAuthStateChanged(auth, (user) => {
      if (!isProfilePage) return;
      if (user) {
        renderLoggedIn(user);
      } else {
        renderLoggedOut();
      }
    });
  });
}
