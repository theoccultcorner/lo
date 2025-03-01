import React, { useState, useEffect } from "react";
import { Container, Typography, Card, CardContent, Grid, Paper } from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

const TripHistory = () => {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    fetchTripHistory();
  }, []);

  const fetchTripHistory = async () => {
    const tripsRef = collection(db, "tripHistory");
    const snapshot = await getDocs(tripsRef);
    const tripList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTrips(tripList);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Trip History 📜
        </Typography>

        {trips.length === 0 ? (
          <Typography>No completed trips yet</Typography>
        ) : (
          <Grid container spacing={2}>
            {trips.map((trip) => (
              <Grid item xs={12} sm={6} key={trip.id}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6">🚗 Completed Ride</Typography>
                    <Typography>Pickup: {trip.pickup.lat}, {trip.pickup.lng}</Typography>
                    <Typography>Destination: {trip.destination.lat}, {trip.destination.lng}</Typography>
                    <Typography>Price: ${trip.price}</Typography>
                    <Typography color="gray" sx={{ marginTop: 1 }}>
                      {new Date(trip.timestamp.toDate()).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default TripHistory;
