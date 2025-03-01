import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Container, Typography, Paper, CircularProgress, Button } from "@mui/material";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "./Auth";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const DriverDashboard = () => {
  console.log("🚀 DriverDashboard Mounted");

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rides, setRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideStage, setRideStage] = useState("idle");
  const [driverLocation, setDriverLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [eta, setEta] = useState(null);
  const [earnings, setEarnings] = useState(0);

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

  const acceptRide = async (ride) => {
    console.log("✅ Ride Accepted:", ride);
    setCurrentRide(ride);
    setRideStage("toPickup");

    const rideRef = doc(db, "rides", ride.id);
    try {
      await updateDoc(rideRef, { status: "accepted", driverId: driver.id });
      console.log("📌 Ride marked as accepted");
      getDirections(driverLocation, ride.pickup);
    } catch (err) {
      console.error("❌ Error updating ride status:", err);
    }
  };

  const completePickup = async () => {
    if (!currentRide) return;
    console.log("✅ Pickup Completed. Heading to destination...");
    setRideStage("toDestination");
    getDirections(currentRide.pickup, currentRide.destination);

    const rideRef = doc(db, "rides", currentRide.id);
    try {
      await updateDoc(rideRef, { status: "in_progress" });
      console.log("📌 Ride status updated to 'in_progress'");
    } catch (err) {
      console.error("❌ Error updating ride status:", err);
    }
  };

  const completeRide = async () => {
    if (!currentRide) return;
    console.log("✅ Ride Completed.");
    setRideStage("idle");
    setCurrentRide(null);
    setDirections(null);
    setEarnings(earnings + currentRide.price);

    const rideRef = doc(db, "rides", currentRide.id);
    try {
      await updateDoc(rideRef, { status: "completed" });
      console.log("📌 Ride status updated to 'completed'");
    } catch (err) {
      console.error("❌ Error updating ride status:", err);
    }
  };

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
          setEta(`${Math.round(result.routes[0].legs[0].duration.value / 60)} min`);
        } else {
          console.error("Directions request failed:", status);
        }
      }
    );
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, textAlign: "center" }}>
        <Typography variant="h4">Driver Dashboard 🚖</Typography>
        <Typography variant="h6">Total Earnings: ${earnings.toFixed(2)}</Typography>
        {eta && <Typography variant="h6" color="success">ETA: {eta}</Typography>}

        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
          <GoogleMap mapContainerStyle={containerStyle} center={driverLocation} zoom={13}>
            {driverLocation && <Marker position={driverLocation} label="🚗 You" />}
            {currentRide?.pickup && <Marker position={currentRide.pickup} label="📍 Pickup" />}
            {currentRide?.destination && <Marker position={currentRide.destination} label="🏁 Destination" />}
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        </LoadScript>

        {rideStage === "toPickup" && <Button onClick={completePickup}>Arrived at Pickup</Button>}
        {rideStage === "toDestination" && <Button onClick={completeRide}>Complete Ride</Button>}
      </Paper>
    </Container>
  );
};

export default DriverDashboard;
