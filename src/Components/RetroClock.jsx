import React, { useEffect, useState } from "react";

export default function NavbarClock() {
  const [time, setTime] = useState(getPKT());

  function getPKT() {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Karachi",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit", // remove if you want cleaner
      hour12: true,
    });
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getPKT());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const [main, period] = time.split(" "); // split AM/PM

  return (
    <div style={styles.container}>
      <span style={styles.time}>{main}</span>
      <span style={styles.ampm}>{period}</span>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "9px 15px",
    borderRadius: "16px",
    boxShadow: "0 0 8px rgba(255, 59, 59, 0.6)", // 🔥 red glow
    background: "linear-gradient(90deg, #cc0202, #000000)", // 🔥 black base
    border: "2px solid #ffffff",
  },

  time: {
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: "monospace",
    color: "#ffffff",
    letterSpacing: "1px",
  },

  ampm: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#ff3b3b", // 🔴 red accent
  },
};