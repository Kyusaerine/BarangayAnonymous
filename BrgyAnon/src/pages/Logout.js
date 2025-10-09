import { useEffect, useRef } from "react";

export default function Logout({ timeoutMinutes = 15 } = {}) {
  const timerRef = useRef(null);
  const TIMEOUT_MS = timeoutMinutes * 60 * 1000;

  const signOut = () => {
    console.log("Logging out due to inactivity");
    localStorage.removeItem("isLogedIn");
    window.location.href = "/login";
  };

  const resetTimer = () => {
    console.log("Activity detected, resetting timer");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(signOut, TIMEOUT_MS);
  };

  useEffect(() => {
    resetTimer(); 

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, []);

  return null;
}
