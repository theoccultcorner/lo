import React, { useEffect, useState } from "react";
import { Button, Container, Typography, Paper } from "@mui/material";
import { auth, setUserRole, getUserRole } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAIL = "theoccultcorner@gmail.com"; // Replace this with your email

const RoleSelection = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Check if user already has a role and redirect them
  useEffect(() => {
    if (auth.currentUser) {
      const userEmail = auth.currentUser.email;
      setIsAdmin(userEmail === ADMIN_EMAIL);

      getUserRole(auth.currentUser.uid).then((role) => {
        if (role) {
          console.log(`User already has a role: ${role}. Redirecting...`);
          navigate(role === "driver" ? "/driver" : "/");
        }
      });
    }
    setLoading(false);
  }, [navigate]);

  const handleRoleSelection = async (role) => {
    if (!auth.currentUser) {
      console.error("❌ No authenticated user found.");
      return;
    }

    if (role === "driver" && !isAdmin) {
      alert("❌ Only the admin can be a driver.");
      return;
    }

    try {
      await setUserRole(auth.currentUser.uid, role); // ✅ Save role in Firestore
      console.log(`✅ Role set to: ${role}`);
      navigate(role === "driver" ? "/driver" : "/"); // ✅ Redirect to correct page
    } catch (error) {
      console.error("❌ Error setting user role:", error);
      alert("An error occurred while setting your role. Please try again.");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", marginTop: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom>
          Select Your Role
        </Typography>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Please choose how you'd like to use the app.
        </Typography>

        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: 2 }}
            onClick={() => handleRoleSelection("driver")}
          >
            🚖 Sign in as Driver
          </Button>
        )}

        <Button
          variant="contained"
          color="secondary"
          fullWidth
          sx={{ marginTop: 2 }}
          onClick={() => handleRoleSelection("rider")}
        >
          🚶‍♂️ Sign in as Rider
        </Button>
      </Paper>
    </Container>
  );
};

export default RoleSelection;
