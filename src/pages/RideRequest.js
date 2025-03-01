import React, { useState } from "react";
import { Button, Container, Typography, Paper, Box, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { io } from "socket.io-client";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Map from "../components/Map";

const socket = io("http://localhost:5000");

const RideRequest = () => {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideConfirmed, setRideConfirmed] = useState(false);
  const [user, setUser] = useState(null);
  const [price, setPrice] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Monitor authentication state
  onAuthStateChanged(auth, (authUser) => {
    setUser(authUser);
  });

  // Calculate ride price
  const calculatePrice = (pickup, destination) => {
    if (!pickup || !destination) return null;
    
    const distance = Math.sqrt(
      Math.pow(destination.lat - pickup.lat, 2) + Math.pow(destination.lng - pickup.lng, 2)
    ) * 69; // Convert to miles (approximate)
    
    const fare = 5 + distance * 2; // Base fare: $5 + $2 per mile
    return parseFloat(fare.toFixed(2)); // Round to 2 decimal places
  };

  const handleRequestRide = async () => {
    if (!pickup || !destination || !user) {
      alert("Please sign in and select pickup and destination.");
      return;
    }

    setPaymentDialogOpen(true);
  };

  const confirmPayment = async () => {
    setPaymentDialogOpen(false);

    const rideData = {
      riderId: user.uid,
      riderEmail: user.email,
      pickup,
      destination,
      price,
      status: "pending",
      paymentMethod: "cash",
    };

    try {
      await addDoc(collection(db, "rides"), rideData);
      socket.emit("requestRide", rideData);
      setRideConfirmed(true);
    } catch (err) {
      console.error("Error requesting ride:", err);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, textAlign: "center" }}>
        <Typography variant="h4">Request a Ride</Typography>

        <Box sx={{ my: 2 }}>
          <Map
            onLocationSelect={(loc) => {
              setPickup(loc);
              setPrice(calculatePrice(loc, destination));
            }}
            onDestinationSelect={(loc) => {
              setDestination(loc);
              setPrice(calculatePrice(pickup, loc));
            }}
          />
        </Box>

        {price !== null && (
          <Typography variant="h5" color="primary" sx={{ marginTop: 2 }}>
            💰 Ride Price: ${price}
          </Typography>
        )}

        <Button
          variant="contained"
          color="success"
          fullWidth
          sx={{ marginTop: 2 }}
          onClick={handleRequestRide}
          disabled={!pickup || !destination}
        >
          Pay with Cash 💵
        </Button>

        {rideConfirmed && <Typography color="success">🎉 A driver has been assigned!</Typography>}

        {/* Payment Confirmation Popup */}
        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogContent>
            <Typography variant="h6">💰 Ride Price: ${price}</Typography>
            <Typography variant="body1">Press OK to confirm payment.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)} color="secondary">Cancel</Button>
            <Button onClick={confirmPayment} color="primary" variant="contained">OK</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default RideRequest;
