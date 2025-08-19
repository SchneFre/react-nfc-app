import React, { useState, useEffect } from "react";
import './styles.css';
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import NFCReader from "./components/NFCReader";
import AboutPage from "./components/AboutPage"; 
import TrainingSession from "./components/TrainingSession"; 
import Auth from "./components/Auth"; 

function App() {
  const [user, setUser] = useState(null);

   useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log(storedUser)
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);
  
  return (
    <BrowserRouter>
      <nav>
        <NavLink to="/" end>Workout</NavLink>
        <NavLink to="/about">About</NavLink>
        {user && <NavLink to="/newtags">New Tags</NavLink>}
        <NavLink to="/auth">Login</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<TrainingSession />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/newtags" element={<NFCReader />} />
        <Route path="/auth" element={<Auth setUser={setUser} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
