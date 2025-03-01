import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";

const LocationPopup = ({ onLocationSelect }) => {
  const [open, setOpen] = useState(true);
  const [error, setError] = useState("");

  // Function to request location
  const requestLocation = useCallback(() => {
    if (navigator.geolocation) {
      console.log("Requesting user location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("Location obtained:", userLocation);
          onLocationSelect(userLocation);
          setOpen(false); // Close popup after getting location
        },
        (err) => {
          console.error("Geolocation Error:", err);
          setError("Location access denied. Please enable it in your browser settings.");
          setOpen(true); // Keep popup open
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Your browser does not support geolocation.");
      setOpen(true);
    }
  }, [onLocationSelect]);

  // Always ask for location when the component mounts
  useEffect(() => {
    setOpen(true); // Force popup open every time
    requestLocation();
  }, [requestLocation]);

  return (
    <Dialog open={open} disableEscapeKeyDown>
      <DialogTitle>
        <GpsFixedIcon sx={{ verticalAlign: "middle", marginRight: 1 }} />
        Allow Location Access
      </DialogTitle>
      <DialogContent>
        <Typography>
          We need your location to set your pickup point. Please allow location access.
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="primary" onClick={requestLocation}>
          Submit Location
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationPopup;
