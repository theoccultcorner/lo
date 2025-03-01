import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import { TextField, Box } from "@mui/material";

const containerStyle = {
  width: "100%",
  height: "400px",
};

// Default location: Santa Maria, CA
const defaultCenter = {
  lat: 34.953,
  lng: -120.435,
};

const Map = ({ onLocationSelect, onDestinationSelect }) => {
  const [currentLocation, setCurrentLocation] = useState(defaultCenter);
  const [destination, setDestination] = useState(null);
  const pickupRef = useRef(null);
  const destinationRef = useRef(null);

  // Fetch user's location if allowed
  useEffect(() => {
    if (navigator.geolocation) {
      console.log("Attempting to get user location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("User location detected:", userLocation);
          setCurrentLocation(userLocation);
          onLocationSelect(userLocation); // Pass to parent component
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Geolocation failed. Please allow location access.");
          setCurrentLocation(defaultCenter);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
      alert("Your browser does not support location services.");
    }
  }, [onLocationSelect]);

  // Handle pickup location selection
  const handlePickupSelect = () => {
    const place = pickupRef.current.getPlace();
    if (place && place.geometry) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      console.log("Pickup location selected:", location);
      setCurrentLocation(location);
      onLocationSelect(location);
    }
  };

  // Handle destination selection
  const handleDestinationSelect = () => {
    const place = destinationRef.current.getPlace();
    if (place && place.geometry) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      console.log("Destination selected:", location);
      setDestination(location);
      onDestinationSelect(location);
    }
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        
        {/* Pickup Input Field (User can type or use GPS) */}
        <Autocomplete
          onLoad={(autocomplete) => (pickupRef.current = autocomplete)}
          onPlaceChanged={handlePickupSelect}
        >
          <TextField label="Enter Pickup Location" variant="outlined" fullWidth />
        </Autocomplete>

        {/* Destination Input Field */}
        <Autocomplete
          onLoad={(autocomplete) => (destinationRef.current = autocomplete)}
          onPlaceChanged={handleDestinationSelect}
        >
          <TextField label="Enter Destination" variant="outlined" fullWidth />
        </Autocomplete>

        {/* Google Map */}
        <GoogleMap mapContainerStyle={containerStyle} center={currentLocation} zoom={13}>
          {/* Show user's current location as pickup */}
          <Marker position={currentLocation} label="📍 You" />
          {/* Show destination marker if set */}
          {destination && <Marker position={destination} label="📍 Destination" />}
        </GoogleMap>
      </Box>
    </LoadScript>
  );
};

export default Map;
