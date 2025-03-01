import React, { useState } from "react";
import { Container, Typography, Paper, Button, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Payment = () => {
  const [cashAppUsername, setCashAppUsername] = useState("");
  const navigate = useNavigate();

  const handleCashAppPayment = () => {
    if (!cashAppUsername) {
      alert("Please enter your CashApp username.");
      return;
    }
    
    console.log("CashApp Payment Selected:", cashAppUsername);
    navigate("/payment-success", { state: { paymentMethod: "CashApp", username: cashAppUsername } });
  };

  const handleCashPayment = () => {
    console.log("Cash Payment Selected");
    navigate("/payment-success", { state: { paymentMethod: "Cash" } });
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", marginTop: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom>
          Select Payment Method
        </Typography>

        {/* CashApp Payment Option */}
        <TextField
          label="Enter your CashApp username ($username)"
          variant="outlined"
          fullWidth
          sx={{ marginTop: 2 }}
          value={cashAppUsername}
          onChange={(e) => setCashAppUsername(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: 2 }}
          onClick={handleCashAppPayment}
        >
          Pay with CashApp
        </Button>

        {/* Cash Payment Option */}
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          sx={{ marginTop: 2 }}
          onClick={handleCashPayment}
        >
          Pay with Cash
        </Button>
      </Paper>
    </Container>
  );
};

export default Payment;
