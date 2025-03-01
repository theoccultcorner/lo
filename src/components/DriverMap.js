import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api"; // Removed DirectionsService

const containerStyle = {
  width: "100%",
  height: "400px",
};

// Default to Santa Maria, CA
const defaultCenter = {
  lat: 34.953,
  lng: -120.435,
};

const DriverMap = ({ driverLocation, pickup, destination, rideStage }) => {
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (driverLocation && pickup && rideStage === "toPickup") {
      getDirections(driverLocation, pickup);
    } else if (pickup && destination && rideStage === "toDestination") {
      getDirections(pickup, destination);
    }
  }, [driverLocation, pickup, destination, rideStage]);

  const getDirections = (start, end) => {
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
          console.error("Directions request failed:", status);
        }
      }
    );
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <GoogleMap mapContainerStyle={containerStyle} center={driverLocation || defaultCenter} zoom={13}>
        {driverLocation && <Marker position={driverLocation} label="🚗 Driver" />}
        {pickup && <Marker position={pickup} label="📍 Pickup" />}
        {destination && <Marker position={destination} label="🏁 Destination" />}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </LoadScript>
  );
};

export default DriverMap;
