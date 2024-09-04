import React, { useState, useEffect } from 'react';
import Register from './Components/Register';
import SignupForm from './Components/SignupForm';
import ChatPage from './Components/ChatPage';

function App() {
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      setIsVerified(true);
    }
  }, []);

  const handleRegister = (registeredUser, phoneNumber) => {
    if (registeredUser) {
      // User exists in the database, navigate directly to ChatPage
      setUser(registeredUser);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setIsVerified(true);
    } else {
      // New user, needs to complete signup
      setUser({ phoneNumber });
      setIsVerified(true);
    }
  };

  const handleSignup = (newUser) => {
    setUser(newUser);
    // Save user to localStorage
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setIsVerified(false);
    setUser(null);
    // Remove user from localStorage
    localStorage.removeItem('user');
  };

  return (
    <div className="App">
      {!isVerified ? (
        <Register onRegister={handleRegister} />
      ) : user && !user.name ? (
        <SignupForm phoneNumber={user.phoneNumber} onSignup={handleSignup} />
      ) : (
        <ChatPage user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
