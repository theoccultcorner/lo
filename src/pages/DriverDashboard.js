import React, { useState, useEffect } from "react";
import { Container, Typography, Paper, CircularProgress, Button } from "@mui/material";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { GoogleMap, LoadScript, DirectionsRenderer } from "@react-google-maps/api";
import Auth from "./Auth";

const mapContainerStyle = { width: "100%", height: "400px" };
const defaultCenter = { lat: 34.953, lng: -120.435 }; // Santa Maria, CA (Example Default Location)

const DriverDashboard = () => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rides, setRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideStage, setRideStage] = useState("idle");
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const driverRef = doc(db, "users", authUser.uid);
        try {
          const driverSnap = await getDoc(driverRef);
          if (driverSnap.exists() && driverSnap.data().role === "driver") {
            setDriver(driverSnap.data());
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

  useEffect(() => {
    if (driver) {
      const ridesQuery = query(collection(db, "rides"), where("status", "==", "pending"));
      const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
        setRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [driver]);

  const acceptRide = async (ride) => {
    setCurrentRide(ride);
    setRideStage("toPickup");
    await updateDoc(doc(db, "rides", ride.id), { status: "accepted", driverId: driver.id });
    getDirections(driver.location, ride.pickup);
  };

  const completePickup = async () => {
    setRideStage("toDestination");
    await updateDoc(doc(db, "rides", currentRide.id), { status: "in_progress" });
    getDirections(currentRide.pickup, currentRide.destination);
  };

  const completeRide = async () => {
    setRideStage("idle");
    setCurrentRide(null);
    await updateDoc(doc(db, "rides", currentRide.id), { status: "completed" });
  };

  const getDirections = (start, end) => {
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      { origin: start, destination: end, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
        } else {
          console.error("Directions request failed due to", status);
        }
      }
    );
  };

  if (loading) return <CircularProgress sx={{ margin: "auto", display: "block" }} />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!driver) return <Auth />;

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h4">Driver Dashboard 🚖</Typography>
        {currentRide && (
          <>
            <Typography variant="h6">Pickup: {currentRide.pickup.lat}, {currentRide.pickup.lng}</Typography>
            <Typography variant="h6">Destination: {currentRide.destination.lat}, {currentRide.destination.lng}</Typography>
            <Typography variant="h6" color="primary">Fare: ${currentRide.price ? currentRide.price.toFixed(2) : "N/A"}</Typography>
            <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
              <GoogleMap mapContainerStyle={mapContainerStyle} center={driver.location || defaultCenter} zoom={13}>
                {directions && <DirectionsRenderer directions={directions} />}
              </GoogleMap>
            </LoadScript>
            {rideStage === "toPickup" ? (
              <Button variant="contained" color="success" fullWidth sx={{ marginTop: 2 }} onClick={completePickup}>
                Arrived at Pickup 🚦
              </Button>
            ) : (
              <Button variant="contained" color="secondary" fullWidth sx={{ marginTop: 2 }} onClick={completeRide}>
                Complete Ride ✅
              </Button>
            )}
          </>
        )}

        {!currentRide && (
          <>
            {rides.length > 0 ? (
              rides.map((ride) => (
                <Paper key={ride.id} elevation={3} sx={{ marginTop: 2, padding: 2 }}>
                  <Typography variant="h6">Ride Request</Typography>
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
          </>
        )}
      </Paper>
    </Container>
  );
};

export default DriverDashboard;