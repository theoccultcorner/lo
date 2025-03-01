import React, { useState } from "react";
import { Container, Typography, Paper, Button, RadioGroup, FormControlLabel, Radio, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

const PaymentForm = () => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cashAppUsername, setCashAppUsername] = useState("");
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (paymentMethod === "cashApp" && !cashAppUsername) {
      alert("Please enter your CashApp username.");
      return;
    }

    if (paymentMethod === "card") {
      if (!stripe || !elements) {
        alert("Stripe has not loaded yet. Please wait.");
        return;
      }

      const { error, paymentMethod: stripePayment } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
      });

      if (error) {
        console.error("Stripe Payment Error:", error);
        alert(error.message);
        return;
      }

      console.log("Stripe Payment Success:", stripePayment);
    }

    navigate("/payment-success", { state: { paymentMethod } });
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", marginTop: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom>
          Select Payment Method
        </Typography>

        <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <FormControlLabel value="card" control={<Radio />} label="💳 Credit/Debit Card" />
          <FormControlLabel value="cashApp" control={<Radio />} label="💰 CashApp" />
          <FormControlLabel value="cash" control={<Radio />} label="💵 Pay with Cash" />
        </RadioGroup>

        {paymentMethod === "cashApp" && (
          <TextField
            label="Enter your CashApp username ($username)"
            variant="outlined"
            fullWidth
            sx={{ marginTop: 2 }}
            value={cashAppUsername}
            onChange={(e) => setCashAppUsername(e.target.value)}
          />
        )}

        {paymentMethod === "card" && (
          <Paper sx={{ padding: 2, marginTop: 2 }}>
            <CardElement />
          </Paper>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: 3 }}
          onClick={handlePayment}
          disabled={!paymentMethod}
        >
          Confirm Payment
        </Button>
      </Paper>
    </Container>
  );
};

export default PaymentForm;
