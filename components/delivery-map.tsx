"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCartStore, DeliveryLocation } from "@/lib/store";
import "leaflet/dist/leaflet.css";

const customIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapEventsProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapEvents({ onLocationSelect }: MapEventsProps) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

interface DeliveryMapProps {
  onLocationConfirm?: (location: DeliveryLocation) => void;
}

export function DeliveryMap({ onLocationConfirm }: DeliveryMapProps) {
  const { deliveryLocation, setDeliveryLocation } = useCartStore();
  const [position, setPosition] = useState<[number, number]>(
    deliveryLocation ? [deliveryLocation.lat, deliveryLocation.lng] : [20.02287, -75.82171]
  );
  const [address, setAddress] = useState(deliveryLocation?.address || "");
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  const calculateDeliveryInfo = (lat: number, lng: number) => {
    const baseLat = 40.7128;
    const baseLng = -74.006;
    const distance = Math.sqrt(Math.pow(lat - baseLat, 2) + Math.pow(lng - baseLng, 2));
    const fee = Math.min(Math.max(2.99, distance * 50), 15.99);
    setDeliveryFee(Math.round(fee * 100) / 100);
    const time = Math.round(20 + distance * 100);
    setEstimatedTime(`${time}-${time + 15} min`);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    calculateDeliveryInfo(lat, lng);
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const formattedAddress = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddress(formattedAddress);
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!address.trim()) return;
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setPosition([newLat, newLng]);
        setAddress(display_name);
        calculateDeliveryInfo(newLat, newLng);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          calculateDeliveryInfo(latitude, longitude);
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            setAddress(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } catch {
            setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          alert("Could not get your location. Please enter your address manually.");
        }
      );
    } else {
      setIsLocating(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleConfirmLocation = () => {
    const location: DeliveryLocation = {
      address,
      lat: position[0],
      lng: position[1],
    };
    setDeliveryLocation(location);
    onLocationConfirm?.(location);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Delivery Location
        </CardTitle>
        <CardDescription>
          Enter your address or click on the map to set your delivery location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="address" className="sr-only">
              Address
            </Label>
            <Input
              id="address"
              placeholder="Enter your delivery address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
            />
          </div>
          <Button onClick={handleAddressSearch} disabled={isGeocoding} variant="secondary">
            {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
          <Button onClick={handleUseCurrentLocation} disabled={isLocating} variant="outline">
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Current Location</span>
          </Button>
        </div>

        <div className="h-[300px] overflow-hidden rounded-lg border">
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={new LatLng(position[0], position[1])} icon={customIcon} />
            <MapEvents onLocationSelect={handleMapClick} />
            <MapController center={position} />
          </MapContainer>
        </div>

        {deliveryFee !== null && (
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Delivery Fee</p>
                <p className="text-xs text-muted-foreground">Based on your location</p>
              </div>
              <span className="text-lg font-bold text-primary">${deliveryFee.toFixed(2)}</span>
            </div>
            {estimatedTime && (
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <p className="text-sm text-muted-foreground">Estimated delivery time</p>
                <span className="text-sm font-medium text-foreground">{estimatedTime}</span>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleConfirmLocation}
          className="w-full"
          disabled={!address || isGeocoding}
        >
          Confirm Delivery Location
        </Button>
      </CardContent>
    </Card>
  );
}
