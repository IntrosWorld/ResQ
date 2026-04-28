import { Bot, Building2, Flame, Hospital, Loader2, MapPinned, Navigation, Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { AssistantChatMessage, AssistantMapAction } from "../api";
import { sendAssistantMessage } from "../api";

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  rating?: number;
  location?: any;
}

declare global {
  interface Window {
    google?: any;
  }
}

const defaultCenter = { lat: 28.6139, lng: 77.209 };
let googleMapsLoader: Promise<void> | undefined;

export function AssistantMapPage() {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      role: "assistant",
      content: "Ask me for directions, nearby hospitals, nearby fire stations, or general emergency-response communication."
    }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mapStatus, setMapStatus] = useState("Add VITE_GOOGLE_MAPS_API_KEY to enable Google Maps.");
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [routeLabel, setRouteLabel] = useState("");
  const [originLabel, setOriginLabel] = useState("your current location");
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentLocationMarkerRef = useRef<any>(null);
  const currentLocationAccuracyRef = useRef<any>(null);
  const currentLocationRef = useRef<any>(null);

  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  useEffect(() => {
    let cancelled = false;
    if (!mapsKey) {
      return;
    }

    loadGoogleMaps(mapsKey)
      .then(() => {
        if (cancelled || !mapEl.current || !window.google) {
          return;
        }

        const map = new window.google.maps.Map(mapEl.current, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          mapId: "DEMO_MAP_ID"
        });
        mapRef.current = map;
        directionsServiceRef.current = new window.google.maps.DirectionsService();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({ map, suppressMarkers: false });
        placesServiceRef.current = new window.google.maps.places.PlacesService(map);
        setMapStatus("Map ready. Ask for directions or nearby emergency services.");

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = { lat: position.coords.latitude, lng: position.coords.longitude };
              currentLocationRef.current = location;
              map.setCenter(location);
              showCurrentLocation(location, position.coords.accuracy);
              setOriginLabel("your current location");
            },
            () => {
              currentLocationRef.current = defaultCenter;
              showCurrentLocation(defaultCenter);
              setOriginLabel("Delhi fallback location");
            },
            { timeout: 5000, maximumAge: 60000 }
          );
        } else {
          currentLocationRef.current = defaultCenter;
          showCurrentLocation(defaultCenter);
          setOriginLabel("Delhi fallback location");
        }
      })
      .catch((error: unknown) => {
        setMapStatus(error instanceof Error ? error.message : "Google Maps failed to load.");
      });

    return () => {
      cancelled = true;
    };
  }, [mapsKey]);

  const quickPrompts = useMemo(
    () => [
      { label: "Nearest hospital", icon: Hospital, text: "Show me the nearest hospital" },
      { label: "Nearest fire station", icon: Flame, text: "Show me the nearest fire station" },
      { label: "Directions", icon: Navigation, text: "Give me directions to Apollo Hospital" },
      { label: "Incident update", icon: Building2, text: "Write a short evacuation update for hotel guests" }
    ],
    []
  );

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) {
      return;
    }

    setInput("");
    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setBusy(true);

    try {
      const response = await sendAssistantMessage(nextMessages);
      const localReply = response.mapAction ? await executeMapAction(response.mapAction) : "";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: localReply ? `${localReply}\n\n${response.reply}` : response.reply
        }
      ]);
    } catch (error) {
      const fallbackAction = parseFallbackMapAction(trimmed);
      const localReply = fallbackAction ? await executeMapAction(fallbackAction) : "";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: localReply || (error instanceof Error ? error.message : "Assistant request failed.")
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function executeMapAction(action: AssistantMapAction): Promise<string> {
    if (action.kind === "nearby") {
      return searchNearby(action.placeType, action.label);
    }

    if (action.kind === "directions") {
      return drawRoute(action.destination);
    }

    if (action.kind === "nearest_directions") {
      return drawRouteToNearest(action.placeType, action.label);
    }

    return "";
  }

  function searchNearby(placeType: "hospital" | "fire_station", label: string): Promise<string> {
    clearRouteAndMarkers();
    setPlaces([]);
    setRouteLabel("");

    if (!window.google || !mapRef.current || !placesServiceRef.current) {
      setMapStatus("Google Maps is not configured yet.");
      return Promise.resolve(`I understood the request for nearby ${label}, but Google Maps is not ready yet.`);
    }

    const location = currentLocationRef.current ?? mapRef.current.getCenter();
    setMapStatus(`Searching nearby ${label} from ${originLabel}.`);

    return new Promise((resolve) => {
      placesServiceRef.current.nearbySearch({ location, radius: 5000, type: placeType }, (results: any[], status: string) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results?.length) {
          setMapStatus(`No nearby ${label} found in the current map area.`);
          resolve(`I could not find nearby ${label} in the current map area.`);
          return;
        }

        const bounds = new window.google.maps.LatLngBounds();
        const nextPlaces = results.slice(0, 6).map((place) => {
          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            map: mapRef.current,
            position: place.geometry?.location,
            title: place.name
          });
          markersRef.current.push(marker);
          if (place.geometry?.location) {
            bounds.extend(place.geometry.location);
          }
          return {
            id: place.place_id ?? place.name,
            name: place.name ?? "Unnamed place",
            address: place.vicinity ?? "Address unavailable",
            rating: place.rating
          };
        });

        mapRef.current.fitBounds(bounds);
        setPlaces(nextPlaces);
        setMapStatus(`Showing ${nextPlaces.length} nearby ${label} on the map.`);
        resolve(`Showing nearby ${label} on the map.`);
      });
    });
  }

  function drawRoute(destination: string): Promise<string> {
    clearRouteAndMarkers();
    setPlaces([]);

    if (!window.google || !mapRef.current || !directionsServiceRef.current || !directionsRendererRef.current) {
      setMapStatus("Google Maps is not configured yet.");
      return Promise.resolve(`I understood the route request to ${destination}, but Google Maps is not ready yet.`);
    }

    const origin = currentLocationRef.current ?? mapRef.current.getCenter();
    setMapStatus(`Calculating route to ${destination}.`);

    return new Promise((resolve) => {
      directionsServiceRef.current.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result: any, status: string) => {
          if (status !== "OK" || !result) {
            setMapStatus(`Could not calculate a route to ${destination}.`);
            resolve(`I could not calculate a route to ${destination}. Try a more specific destination.`);
            return;
          }

          directionsRendererRef.current.setDirections(result);
          const leg = result.routes?.[0]?.legs?.[0];
          const summary = leg?.distance?.text && leg?.duration?.text ? `${leg.distance.text}, about ${leg.duration.text}` : "Route ready";
          setRouteLabel(`${destination} - ${summary}`);
          setMapStatus(`Route shown from ${originLabel} to ${destination}.`);
          resolve(`Route shown to ${destination}: ${summary}.`);
        }
      );
    });
  }

  function drawRouteToNearest(placeType: "hospital" | "fire_station", label: string): Promise<string> {
    clearRouteAndMarkers();
    setPlaces([]);
    setRouteLabel("");

    if (!window.google || !mapRef.current || !placesServiceRef.current || !directionsServiceRef.current || !directionsRendererRef.current) {
      setMapStatus("Google Maps is not configured yet.");
      return Promise.resolve(`I understood the route request to the nearest ${label.replace(/s$/, "")}, but Google Maps is not ready yet.`);
    }

    const origin = currentLocationRef.current ?? mapRef.current.getCenter();
    setMapStatus(`Finding the nearest ${label.replace(/s$/, "")} and calculating directions.`);

    return new Promise((resolve) => {
      placesServiceRef.current.nearbySearch(
        {
          location: origin,
          rankBy: window.google.maps.places.RankBy.DISTANCE,
          type: placeType
        },
        (results: any[], status: string) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results?.length) {
            setMapStatus(`No nearby ${label} found in the current map area.`);
            resolve(`I could not find a nearby ${label.replace(/s$/, "")} to route to.`);
            return;
          }

          const nextPlaces = results.slice(0, 6).map((place) => ({
            id: place.place_id ?? place.name,
            name: place.name ?? "Unnamed place",
            address: place.vicinity ?? "Address unavailable",
            rating: place.rating,
            location: place.geometry?.location
          }));
          setPlaces(nextPlaces);

          const nearest = nextPlaces.find((place) => place.location);
          if (!nearest) {
            setMapStatus(`Nearest ${label.replace(/s$/, "")} has no routable map location.`);
            resolve(`I found a nearby ${label.replace(/s$/, "")}, but it has no routable map location.`);
            return;
          }

          directionsServiceRef.current.route(
            {
              origin,
              destination: nearest.location,
              travelMode: window.google.maps.TravelMode.DRIVING
            },
            (routeResult: any, routeStatus: string) => {
              if (routeStatus !== "OK" || !routeResult) {
                setMapStatus(`Could not calculate directions to ${nearest.name}.`);
                resolve(`I found ${nearest.name}, but could not calculate a route to it.`);
                return;
              }

              directionsRendererRef.current.setDirections(routeResult);
              const leg = routeResult.routes?.[0]?.legs?.[0];
              const summary = leg?.distance?.text && leg?.duration?.text ? `${leg.distance.text}, about ${leg.duration.text}` : "Route ready";
              setRouteLabel(`${nearest.name} - ${summary}`);
              setMapStatus(`Route shown from ${originLabel} to ${nearest.name}.`);
              resolve(`Route shown to the nearest ${label.replace(/s$/, "")}: ${nearest.name}, ${summary}.`);
            }
          );
        }
      );
    });
  }

  function clearRouteAndMarkers() {
    markersRef.current.forEach((marker) => { marker.map = null; });
    markersRef.current = [];
    directionsRendererRef.current?.setDirections({ routes: [] });
  }

  function showCurrentLocation(location: { lat: number; lng: number }, accuracy?: number) {
    if (!window.google || !mapRef.current) {
      return;
    }

    if (currentLocationMarkerRef.current) currentLocationMarkerRef.current.map = null;
    if (currentLocationAccuracyRef.current) currentLocationAccuracyRef.current.map = null;

    const dotEl = document.createElement("div");
    dotEl.style.cssText = "width:16px;height:16px;background:#4285f4;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)";
    currentLocationMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position: location,
      title: "Your estimated location",
      content: dotEl,
      zIndex: 1000
    });

    currentLocationAccuracyRef.current = new window.google.maps.Circle({
      map: mapRef.current,
      center: location,
      radius: Math.max(accuracy ?? 90, 35),
      fillColor: "#4285f4",
      fillOpacity: 0.16,
      strokeColor: "#4285f4",
      strokeOpacity: 0.35,
      strokeWeight: 1
    });
  }

  function usePrompt(text: string) {
    setInput(text);
  }

  return (
    <section className="assistant-page">
      <div className="assistant-panel assistant-chat">
        <div className="panel-heading">
          <div>
            <h2>ResQ Assistant</h2>
          </div>
          <Bot size={24} />
        </div>

        <div className="assistant-quick-prompts">
          {quickPrompts.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <button key={prompt.label} onClick={() => usePrompt(prompt.text)}>
                <Icon size={16} />
                {prompt.label}
              </button>
            );
          })}
        </div>

        <div className="assistant-messages" aria-live="polite">
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`assistant-message ${message.role}`}>
              {message.content}
            </article>
          ))}
          {busy ? (
            <article className="assistant-message assistant loading">
              <Loader2 size={16} />
              Thinking and checking map intent
            </article>
          ) : null}
        </div>

        <form className="assistant-input" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for directions, nearest hospital, nearest fire station, or a response message..."
            rows={3}
          />
          <button type="submit" disabled={busy || !input.trim()}>
            <Send size={17} />
            Send
          </button>
        </form>
      </div>

      <div className="assistant-panel assistant-map-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Local map actions</p>
            <h2>Directions and Nearby Help</h2>
          </div>
          <MapPinned size={24} />
        </div>

        <div className="assistant-map-shell">
          {mapsKey ? <div ref={mapEl} className="assistant-map-canvas" /> : null}
          {!mapsKey ? (
            <div className="assistant-map-placeholder">
              <MapPinned size={34} />
              <strong>Google Maps key required</strong>
              <span>Add VITE_GOOGLE_MAPS_API_KEY in your environment to enable routes and nearby places.</span>
            </div>
          ) : null}
        </div>

        <div className="assistant-map-status">
          <strong>{mapStatus}</strong>
          <span>Origin: {originLabel}</span>
          {routeLabel ? <span>Route: {routeLabel}</span> : null}
        </div>

        {places.length > 0 ? (
          <div className="places-list">
            {places.map((place) => (
              <article key={place.id}>
                <strong>{place.name}</strong>
                <span>{place.address}</span>
                {place.rating ? <small>Rating {place.rating}</small> : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function parseFallbackMapAction(message: string): AssistantMapAction | null {
  const normalized = message.toLowerCase();
  if (
    (normalized.includes("direction") || normalized.includes("route") || normalized.includes("navigate") || normalized.includes("how to get")) &&
    (normalized.includes("nearest") || normalized.includes("nearby") || normalized.includes("near")) &&
    normalized.includes("hospital")
  ) {
    return { kind: "nearest_directions", placeType: "hospital", label: "hospitals" };
  }

  if (
    (normalized.includes("direction") || normalized.includes("route") || normalized.includes("navigate") || normalized.includes("how to get")) &&
    (normalized.includes("nearest") || normalized.includes("nearby") || normalized.includes("near")) &&
    (normalized.includes("fire station") || normalized.includes("firestation"))
  ) {
    return { kind: "nearest_directions", placeType: "fire_station", label: "fire stations" };
  }

  if (normalized.includes("hospital") || normalized.includes("clinic") || normalized.includes("doctor") || normalized.includes("medical") || normalized.includes("teeth") || normalized.includes("dental") || normalized.includes("dentist") || normalized.includes("emergency")) {
    return { kind: "nearby", placeType: "hospital", label: "hospitals" };
  }

  if (normalized.includes("fire station") || normalized.includes("firestation") || normalized.includes("fire brigade") || normalized.includes("firefighter")) {
    return { kind: "nearby", placeType: "fire_station", label: "fire stations" };
  }

  if (normalized.includes("direction") || normalized.includes("route") || normalized.includes("navigate") || normalized.includes("how to get")) {
    const destination = extractDestination(message);
    if (destination) {
      return { kind: "directions", destination };
    }
  }

  return null;
}

function extractDestination(message: string): string {
  const toMatch = message.match(/\bto\s+(.+)$/i);
  if (toMatch?.[1]) {
    return toMatch[1].trim().replace(/[?.!]$/, "");
  }

  return message.replace(/^(give me|show me)?\s*(directions|route|navigate)\s*/i, "").trim().replace(/[?.!]$/, "");
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsLoader) {
    return googleMapsLoader;
  }

  googleMapsLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-resq-google-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.dataset.resqGoogleMaps = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });

  return googleMapsLoader;
}
