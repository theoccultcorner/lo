import React, { useState, useEffect } from "react";
import { Container, Typography, Paper, CircularProgress, Button } from "@mui/material";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "./Auth";
import DriverMap from "../components/DriverMap"; // ✅ Importing DriverMap

const DriverDashboard = () => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rides, setRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideStage, setRideStage] = useState("idle");
  const [driverLocation, setDriverLocation] = useState(null);
  const [directions, setDirections] = useState(null);

  // ✅ Check Authentication & Driver Role
  useEffect(() => {
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
            } else {
              setError("You are not authorized as a driver.");
            }
          } else {
            setError("You are not authorized as a driver.");
          }
        } catch (err) {
          setError("Error loading driver data.");
        }
      } else {
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
      const ridesQuery = query(collection(db, "rides"), where("status", "==", "pending"));
      const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
        setRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [driver]);

  // ✅ Function to Get Directions
  const getDirections = (start, end) => {
    if (!start || !end) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error("❌ Directions request failed:", status);
        }
      }
    );
  };

  // ✅ Accept Ride Function
  const acceptRide = async (ride) => {
    setCurrentRide(ride);
    setRideStage("toPickup");
    await updateDoc(doc(db, "rides", ride.id), { status: "accepted", driverId: driver.id });
    getDirections(driverLocation, ride.pickup);
  };

  const completePickup = async () => {
    setRideStage("toDestination");
    await updateDoc(doc(db, "rides", currentRide.id), { status: "in_progress" });
    getDirections(currentRide.pickup, currentRide.destination);
  };

  const completeRide = async () => {
    setRideStage("idle");
    setCurrentRide(null);

    const rideRef = doc(db, "rides", currentRide.id);
    try {
      await updateDoc(rideRef, { status: "completed" });
      console.log("📌 Ride status updated to 'completed'");
    } catch (err) {
      console.error("❌ Error updating ride status:", err);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: "center", marginTop: 4 }}>
        <Typography variant="h5">🔄 Loading Driver Dashboard...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: "center", marginTop: 4 }}>
        <Typography variant="h5" color="error">{error}</Typography>
      </Container>
    );
  }

  if (!driver) {
    return <Auth />;
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Driver Dashboard 🚖
        </Typography>
        <Typography variant="h5" color="primary">
          👤 Driver: {driver.name || "Unknown"}
        </Typography>

        {/* Map for Live Tracking */}
        <DriverMap
          driverLocation={driverLocation}
          pickup={currentRide?.pickup}
          destination={currentRide?.destination}
          rideStage={rideStage}
          directions={directions}
        />

        {/* Show Available Rides */}
        {rides.length > 0 ? (
          rides.map((ride) => (
            <Paper key={ride.id} elevation={3} sx={{ marginTop: 2, padding: 2 }}>
              <Typography variant="h6">📍 Ride Request</Typography>
              <Typography>Rider: {ride.riderName || "Unknown"}</Typography>
              <Typography>Pickup: {ride.pickup.lat}, {ride.pickup.lng}</Typography>
              <Typography>Destination: {ride.destination.lat}, {ride.destination.lng}</Typography>
              <Typography color="primary">Fare: ${ride.price ? ride.price.toFixed(2) : "N/A"}</Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ marginTop: 2 }}
                onClick={() => acceptRide(ride)}
              >
                Accept Ride ✅
              </Button>
            </Paper>
          ))
        ) : (
          <Typography>No available rides at the moment.</Typography>
        )}

        {/* If Ride is in Progress, Show Ride Details */}
        {currentRide && (
          <Paper elevation={3} sx={{ marginTop: 4, padding: 3 }}>
            <Typography variant="h6" color="primary">🚕 Current Ride</Typography>
            <Typography>Pickup: {currentRide.pickup.lat}, {currentRide.pickup.lng}</Typography>
            <Typography>Destination: {currentRide.destination.lat}, {currentRide.destination.lng}</Typography>
            <Typography>Status: {rideStage === "toPickup" ? "Driving to Pickup" : "Driving to Destination"}</Typography>
            
            {rideStage === "toPickup" ? (
              <Button variant="contained" color="success" fullWidth sx={{ marginTop: 2 }} onClick={completePickup}>
                Arrived at Pickup 🚦
              </Button>
            ) : (
              <Button variant="contained" color="secondary" fullWidth sx={{ marginTop: 2 }} onClick={completeRide}>
                Complete Ride ✅
              </Button>
            )}
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default DriverDashboard;
