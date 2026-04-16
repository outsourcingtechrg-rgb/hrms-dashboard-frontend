import React, { useEffect, useState } from "react";

// Flip digit
function FlipDigit({ digit }) {
  const [prev, setPrev] = useState(digit);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (digit !== prev) {
      setFlip(true);
      const t = setTimeout(() => {
        setFlip(false);
        setPrev(digit);
      }, 180);
      return () => clearTimeout(t);
    }
  }, [digit]);

  return (
    <div style={styles.digitWrapper}>
      <div
        style={{
          ...styles.digit,
          transform: flip ? "rotateX(-90deg)" : "rotateX(0deg)",
        }}
      >
        {digit}
      </div>
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

// Main clock
export default function RetroClock() {
  const isMobile = useIsMobile();

  // 🚫 Hide completely on mobile
  if (isMobile) return null;

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const format = (v) => String(v).padStart(2, "0");

  const h = format(time.getHours());
  const m = format(time.getMinutes());
  const s = format(time.getSeconds());

  return (
    <div style={styles.container}>
      <div style={styles.group}>
        {h.split("").map((d, i) => <FlipDigit key={`h${i}`} digit={d} />)}
      </div>

      <span style={styles.separator}>:</span>

      <div style={styles.group}>
        {m.split("").map((d, i) => <FlipDigit key={`m${i}`} digit={d} />)}
      </div>

      <span style={styles.separator}>:</span>

      <div style={styles.group}>
        {s.split("").map((d, i) => <FlipDigit key={`s${i}`} digit={d} />)}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: "1vw",
    padding: "0.2vw 1.8vw",
    borderRadius: "12px",
    background: "#0f0f0f",
    border: "1px solid #222",
    width: "fit-content",
  },

  group: {
    display: "flex",
    gap: "0.4vw",
  },

  digitWrapper: {
    width: "3.5vw",
    height: "0.5vw",
    minWidth: "32px",
    minHeight: "45px",
    perspective: 100,
  },

  digit: {
    width: "100%",
    height: "100%",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Oswald', sans-serif",
    fontSize: "2.2vw",
    minFontSize: "20px",
    fontWeight: 700,
    color: "#ff3b3b", // 🔴 RED theme
    transition: "transform 0.18s ease",
    boxShadow: "0 4px 10px rgba(0,0,0,0.6)",
  },

  separator: {
    fontSize: "2vw",
    minFontSize: "18px",
    fontWeight: "bold",
    color: "#ffffff",
    margin: "0 0.3vw",
  },
};