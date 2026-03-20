import React, { useState } from "react";
import LoginForm from "./LoginForm";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function App() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="size-full">
      <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </div>
  );
}
