// src/pages/Auth.js
import React, { useState } from "react";
import { Button, TextField, Container, Typography, Paper } from "@mui/material";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const Auth = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError("");
    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), { email: user.email, role: "rider" });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) console.log("User data:", userSnap.data());
      }
      onLogin(userCredential.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, textAlign: "center" }}>
        <Typography variant="h4">{isSignUp ? "Sign Up" : "Sign In"}</Typography>
        {error && <Typography color="error">{error}</Typography>}
        <TextField fullWidth label="Email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }} onClick={handleAuth}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <Button color="secondary" sx={{ marginTop: 2 }} onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
        </Button>
      </Paper>
    </Container>
  );
};

export default Auth;
