import { memo } from "react";
import { useTheme } from "next-themes";
import React from "react";
const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="hidden peer"
        checked={isDark}
        onChange={() => setTheme(isDark ? "light" : "dark")}
      />

      <div
        className={`
          relative w-36 h-12 rounded-full border transition-all duration-300
          ${isDark
            ? "bg-zinc-700 border-zinc-600"
            : "bg-gradient-to-br from-orange-500 to-yellow-400 border-orange-400"}
          
          after:absolute
          after:content-['']
          after:w-9
          after:h-9
          after:rounded-full
          after:top-1
          after:left-1
          after:bg-white
          after:shadow-md
          after:transition-all
          after:duration-300
          ${isDark ? "after:translate-x-24" : ""}
        `}
      />

      {/* Sun */}
      <svg
        viewBox="0 0 24 24"
        className={`absolute left-3 w-4 h-4 fill-white transition-opacity duration-300 ${
          isDark ? "opacity-40" : "opacity-100"
        }`}
      >
        <path d="M12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5,5,2.24,5,5-2.24,5-5,5ZM13,0h-2V5h2V0Zm0,19h-2v5h2v-5ZM5,11H0v2H5v-2Zm19,0h-5v2h5v-2Zm-2.81-6.78l-1.41-1.41-3.54,3.54,1.41,1.41,3.54-3.54ZM7.76,17.66l-1.41-1.41-3.54,3.54,1.41,1.41,3.54-3.54Zm0-11.31l-3.54-3.54-1.41,1.41,3.54,3.54,1.41-1.41Zm13.44,13.44l-3.54-3.54-1.41,1.41,3.54,3.54,1.41-1.41Z" />
      </svg>

      {/* Moon */}
      <svg
        viewBox="0 0 24 24"
        className={`absolute right-3 w-4 h-4 transition-all duration-300 ${
          isDark ? "fill-white opacity-100" : "fill-black opacity-60"
        }`}
      >
        <path d="M12.009,24A12.067,12.067,0,0,1,.075,10.725,12.121,12.121,0,0,1,10.1.152a13,13,0,0,1,5.03.206,2.5,2.5,0,0,1,1.8,1.8,2.47,2.47,0,0,1-.7,2.425c-4.559,4.168-4.165,10.645.807,14.412h0a2.5,2.5,0,0,1-.7,4.319A13.875,13.875,0,0,1,12.009,24Z" />
      </svg>
    </label>
  );
};

export default memo(ThemeToggle);