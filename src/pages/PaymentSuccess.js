import React from "react";
import { Container, Typography, Paper, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentMethod = location.state?.paymentMethod || "Unknown";
  const cashAppUsername = location.state?.username || "";

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", marginTop: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: "green" }}>
          ✅ Payment Successful!
        </Typography>
        <Typography variant="h6">Payment Method: {paymentMethod}</Typography>

        {cashAppUsername && (
          <Typography variant="body1" sx={{ marginTop: 1 }}>
            CashApp Username: {cashAppUsername}
          </Typography>
        )}

        <Typography variant="body1" sx={{ marginTop: 2 }}>
          Your payment has been processed successfully. Thank you for using our service!
        </Typography>

        <Button variant="contained" color="primary" sx={{ marginTop: 3 }} onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </Paper>
    </Container>
  );
};

export default PaymentSuccess;
