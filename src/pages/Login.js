import React, { useState } from "react";
import { Button, Container, Typography, Paper, CircularProgress } from "@mui/material";
import { auth, googleProvider, db, getUserRole, setUserRole } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // ✅ Now use `useNavigate` inside `Login.js`

const Login = () => {
  const navigate = useNavigate(); // ✅ Now inside a Router-wrapped component
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log("New user detected! Assigning default role: rider");
        await setUserRole(user.uid, "rider");
        navigate("/role-selection");
      } else {
        const userRole = userSnap.data().role;
        console.log("Existing user role:", userRole);
        navigate(userRole === "driver" ? "/driver" : "/");
      }
    } catch (error) {
      console.error("Login error:", error.message);
      alert(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", marginTop: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom>Sign In</Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: 2 }}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Sign in with Google"}
        </Button>
      </Paper>
    </Container>
  );
};

export default Login;
