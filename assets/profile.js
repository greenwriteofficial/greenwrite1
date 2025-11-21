// assets/js/profile.js
// Firebase Auth for Profile page: Google + Phone OTP

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// === Your Firebase config ===
const firebaseConfig = {
  apiKey: "AIzaSyBok3WdamaRJaVCzznMwB-lwHVWoHAM2i4",
  authDomain: "greenwrite-704d9.firebaseapp.com",
  projectId: "greenwrite-704d9",
  storageBucket: "greenwrite-704d9.firebasestorage.app",
  messagingSenderId: "815467329176",
  appId: "1:815467329176:web:d7d767409867d2c2eb82ed",
  measurementId: "G-2192KW3Y9J"
};

// === Init Firebase ===
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'en'; // or 'hi'
const googleProvider = new GoogleAuthProvider();

// === Helper to select elements safely ===
const $ = (id) => document.getElementById(id);

// UI elements
const googleBtn = $("googleBtn");
const phoneInput = $("phoneInput");
const sendOtpBtn = $("sendOtpBtn");
const otpBox = $("otpBox");
const otpInput = $("otpInput");
const verifyOtpBtn = $("verifyOtpBtn");
const loginBox = $("loginBox");
const userBox = $("userBox");
const logoutBtn = $("logoutBtn");
const statusEl = $("authStatus");
const errorEl = $("authError");
const uName = $("uName");
const uEmail = $("uEmail");
const uPhone = $("uPhone");
const uUid = $("uUid");

let recaptchaVerifier = null;
let confirmationResult = null;

// =============== STATUS / ERROR HELPERS ===============
function setStatus(msg){
  if (statusEl) statusEl.textContent = msg;
}
function setError(msg){
  if (!errorEl) return;
  if (!msg){ errorEl.style.display = "none"; errorEl.textContent = ""; }
  else { errorEl.style.display = "block"; errorEl.textContent = msg; }
}

// =============== RECAPTCHA SETUP ===============
function setupRecaptcha(){
  if (recaptchaVerifier) return recaptchaVerifier;
  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved automatically when sendOtp is called
    }
  });
  return recaptchaVerifier;
}

// =============== GOOGLE SIGN-IN ===============
if (googleBtn){
  googleBtn.addEventListener("click", async () => {
    setError("");
    setStatus("Opening Google sign-in...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setStatus(`Signed in as ${user.displayName || user.email || "user"}`);
    } catch (err) {
      console.error(err);
      setStatus("Google sign-in cancelled or failed.");
      setError(err.message || "Google sign-in failed.");
    }
  });
}

// =============== PHONE OTP FLOW ===============
if (sendOtpBtn){
  sendOtpBtn.addEventListener("click", async () => {
    setError("");
    const phoneNumber = (phoneInput && phoneInput.value.trim()) || "";
    if (!phoneNumber){
      setError("Please enter your phone number with country code (e.g. +91...).");
      return;
    }
    setStatus("Sending OTP...");
    try {
      const verifier = setupRecaptcha();
      confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setStatus("OTP sent! Please check your phone.");
      if (otpBox) otpBox.style.display = "block";
    } catch (err) {
      console.error(err);
      setStatus("Failed to send OTP.");
      setError(err.message || "Could not send OTP. Check phone number format.");
    }
  });
}

if (verifyOtpBtn){
  verifyOtpBtn.addEventListener("click", async () => {
    setError("");
    if (!confirmationResult){
      setError("Please request OTP first.");
      return;
    }
    const code = (otpInput && otpInput.value.trim()) || "";
    if (!code){
      setError("Please enter the OTP code.");
      return;
    }
    setStatus("Verifying OTP...");
    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      setStatus(`Signed in with phone: ${user.phoneNumber || "success"}`);
    } catch (err) {
      console.error(err);
      setStatus("Failed to verify OTP.");
      setError(err.message || "Invalid OTP. Try again.");
    }
  });
}

// =============== LOGOUT ===============
if (logoutBtn){
  logoutBtn.addEventListener("click", async () => {
    setError("");
    setStatus("Logging out...");
    try {
      await signOut(auth);
      setStatus("Logged out.");
    } catch (err) {
      console.error(err);
      setStatus("Logout failed.");
      setError(err.message || "Could not logout.");
    }
  });
}

// =============== AUTH STATE LISTENER ===============
onAuthStateChanged(auth, (user) => {
  if (user){
    // logged in
    if (loginBox) loginBox.style.display = "none";
    if (userBox) userBox.style.display = "block";

    if (uName) uName.textContent = user.displayName || "(no name)";
    if (uEmail) uEmail.textContent = user.email || "-";
    if (uPhone) uPhone.textContent = user.phoneNumber || "-";
    if (uUid) uUid.textContent = user.uid;

    setStatus("You are logged in.");
    setError("");
  } else {
    // logged out
    if (loginBox) loginBox.style.display = "flex";
    if (userBox) userBox.style.display = "none";

    setStatus("Not logged in.");
    setError("");
  }
});
