import React, { useState, useEffect } from "react";
import { Container, Typography, Paper, CircularProgress, Button } from "@mui/material";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import DriverMap from "../components/DriverMap";
import Auth from "./Auth";

const DriverDashboard = () => {
  console.log("🚀 DriverDashboard Mounted");

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rides, setRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideStage, setRideStage] = useState("idle");
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [earnings, setEarnings] = useState(0);

  // ✅ Authenticate Driver & Fetch Role
  useEffect(() => {
    console.log("🔄 Checking Authentication...");
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        console.log("✅ Authenticated User:", authUser.email);
        if (!authUser.uid) {
          console.error("❌ User ID is undefined!");
          setError("User ID is missing.");
          setLoading(false);
          return;
        }

        const driverRef = doc(db, "users", authUser.uid);
        try {
          const driverSnap = await getDoc(driverRef);
          if (driverSnap.exists()) {
            const driverData = driverSnap.data();
            console.log("✅ Driver Data:", driverData);
            if (driverData.role === "driver") {
              setDriver(driverData);
              setEarnings(driverData.earnings || 0);
            } else {
              console.warn("🚨 User is NOT a driver!");
              setError("You are not authorized as a driver.");
            }
          } else {
            console.warn("🚨 Driver data NOT found in Firestore!");
            setError("Driver data not found.");
          }
        } catch (err) {
          console.error("❌ Error fetching driver data:", err);
          setError("Error loading driver data.");
        }
      } else {
        console.warn("❌ No user logged in!");
        setError("Please log in.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Track Driver's Location in Real Time
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setDriverLocation(location);
          console.log("📍 Updated Driver Location:", location);
        },
        (error) => console.error("❌ Error getting location:", error),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // ✅ Fetch Available Rides in Real-Time
  useEffect(() => {
    if (driver) {
      console.log("📡 Fetching available rides...");
      const ridesQuery = query(collection(db, "rides"), where("status", "==", "pending"));
      const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
        const rideData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("📌 Available Rides:", rideData);
        setRides(rideData);
      });

      return () => unsubscribe();
    }
  }, [driver]);

  // ✅ Accept Ride & Set Route
  const acceptRide = async (ride) => {
    console.log("✅ Ride Accepted:", ride);
    setCurrentRide(ride);
    setRideStage("toPickup");

    const rideRef = doc(db, "rides", ride.id);
    try {
      await updateDoc(rideRef, { status: "accepted", driverId: driver.id });
      console.log("📌 Ride marked as accepted");
    } catch (err) {
      console.error("❌ Error updating ride status:", err);
    }
  };

  // ✅ Complete Pickup
  const completePickup = async () => {
    if (!currentRide) return;
    console.log("✅ Pickup Completed. Heading to destination...");
    setRideStage("toDestination");

    const rideRef = doc(db, "rides", currentRide.id);
    try {
      await updateDoc(rideRef, { status: "in_progress" });
      console.log("📌 Ride status updated to 'in_progress'");
    } catch (err) {
      console.error("❌ Error updating ride status:", err);
    }
  };

  // ✅ Complete Ride
  const completeRide = async () => {
    if (!currentRide) return;
    console.log("✅ Ride Completed.");
    setRideStage("idle");
    setCurrentRide(null);
    setEarnings(earnings + currentRide.price);

    const rideRef = doc(db, "rides", currentRide.id);
    try {
      await updateDoc(rideRef, { status: "completed" });
      console.log("📌 Ride status updated to 'completed'");
    } catch (err) {
      console.error("❌ Error updating ride status:", err);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, textAlign: "center" }}>
        <Typography variant="h4">Driver Dashboard 🚖</Typography>
        <Typography variant="h6">Total Earnings: ${earnings.toFixed(2)}</Typography>

        {currentRide && (
          <Typography variant="h6" color="success">
            {rideStage === "toPickup"
              ? `📍 Navigating to Pickup (${currentRide.pickup.lat}, ${currentRide.pickup.lng})`
              : `🏁 Driving to Destination (${currentRide.destination.lat}, ${currentRide.destination.lng})`}
          </Typography>
        )}

        {/* Integrating DriverMap */}
        <DriverMap
          driverLocation={driverLocation}
          pickup={currentRide?.pickup}
          destination={currentRide?.destination}
          rideStage={rideStage}
        />

        {/* Ride Actions */}
        {rideStage === "toPickup" && (
          <Button variant="contained" color="success" fullWidth sx={{ marginTop: 2 }} onClick={completePickup}>
            Arrived at Pickup 🚦
          </Button>
        )}
        {rideStage === "toDestination" && (
          <Button variant="contained" color="secondary" fullWidth sx={{ marginTop: 2 }} onClick={completeRide}>
            Complete Ride ✅
          </Button>
        )}

        {/* Available Rides */}
        {rides.length > 0 ? (
          rides.map((ride) => (
            <Paper key={ride.id} elevation={3} sx={{ marginTop: 2, padding: 2 }}>
              <Typography variant="h6">📍 Ride Request</Typography>
              <Typography>Rider: {ride.riderName || "Unknown"}</Typography>
              <Typography>Pickup: {ride.pickup.lat}, {ride.pickup.lng}</Typography>
              <Typography>Destination: {ride.destination.lat}, {ride.destination.lng}</Typography>
              <Typography color="primary">Fare: ${ride.price ? ride.price.toFixed(2) : "N/A"}</Typography>
              <Button variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }} onClick={() => acceptRide(ride)}>
                Accept Ride ✅
              </Button>
            </Paper>
          ))
        ) : (
          <Typography>No available rides at the moment.</Typography>
        )}
      </Paper>
    </Container>
  );
};

export default DriverDashboard;
