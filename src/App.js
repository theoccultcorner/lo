import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import RideRequest from "./pages/RideRequest";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import Login from "./pages/Login";
import DriverDashboard from "./pages/DriverDashboard";
import RoleSelection from "./pages/RoleSelection";
import { auth, googleProvider, getUserRole, setUserRole } from "./firebaseConfig";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { AppBar, Toolbar, Button, Typography, CircularProgress } from "@mui/material";

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        let userRole = await getUserRole(authUser.uid);

        if (!userRole) {
          console.log("User has no role. Redirecting to role selection...");
          setRole(null);
        } else {
          setRole(userRole);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);

      let userRole = await getUserRole(result.user.uid);
      if (!userRole) {
        console.log("New user detected! Redirecting to role selection...");
        setRole(null);
      } else {
        setRole(userRole);
      }
    } catch (error) {
      console.error("Google Login error:", error.message);
      alert("Google login failed: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>LoGo</Typography>
          {user ? (
            <>
              <Typography variant="body1" sx={{ marginRight: 2 }}>
                {user.displayName || "User"}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Button color="inherit" onClick={handleGoogleLogin}>Login with Google</Button>
          )}
        </Toolbar>
      </AppBar>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <CircularProgress />
          <Typography variant="h6">Checking authentication...</Typography>
        </div>
      ) : (
        <Routes>
          {/* ✅ First page user sees is Login */}
          <Route path="/" element={!user ? <Login /> : <Navigate to="/role-selection" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/role-selection" />} />
          
          {/* ✅ After login, user must select a role */}
          <Route path="/role-selection" element={user && !role ? <RoleSelection /> : <Navigate to="/dashboard" />} />
          
          {/* ✅ Redirect user to their assigned role page */}
          <Route path="/dashboard" element={user ? (role === "driver" ? <Navigate to="/driver" /> : <RideRequest />) : <Navigate to="/login" />} />
          <Route path="/driver" element={user && role === "driver" ? <DriverDashboard /> : <Navigate to="/role-selection" />} />
          
          {/* Other routes */}
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Routes>
      )}
    </Router>
  );
};

export default App;
