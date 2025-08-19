import React, { useEffect } from "react";

function Auth({ setUser }) {

  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("authToken", token);
      const userData = { token }; 
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      window.location.href = "/";
    }
  }, [setUser]);

  const handleGoogleLogin = () => {
    // Redirect to your deployed backend
    window.location.href = `/auth/google`;
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  );
}

export default Auth;
