import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Slider from "@mui/material/Slider";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Typography from "@mui/material/Typography";
import { debounce } from "@mui/material/utils";

const GOOGLE_MAPS_API_KEY = "AIzaSyB7cmi28zd3kXLEw1DcjFFIT7kvaKj-4Co";

function loadScript(src, position, id) {
  if (!position) return;

  const existing = document.querySelector(`#${id}`);
  if (existing) return;

  const script = document.createElement("script");
  script.setAttribute("async", "");
  script.setAttribute("id", id);
  script.src = src;
  position.appendChild(script);
}

const autocompleteService = { current: null };

function normalizeSuggestion(option) {
  const prediction = option?.placePrediction || option;

  const placeId = prediction?.placeId || prediction?.place_id;
  const mainText =
    prediction?.mainText?.text ||
    prediction?.structuredFormat?.mainText?.text ||
    prediction?.structured_formatting?.main_text ||
    "";
  const secondaryText =
    prediction?.secondaryText?.text ||
    prediction?.structuredFormat?.secondaryText?.text ||
    prediction?.structured_formatting?.secondary_text ||
    "";
  const description =
    prediction?.text?.text ||
    prediction?.description ||
    [mainText, secondaryText].filter(Boolean).join(", ");

  if (!description) return null;

  return {
    description,
    place_id: placeId || `suggestion-${description}`,
    structured_formatting: {
      main_text: mainText || description,
      secondary_text: secondaryText || "",
    },
  };
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDistanceInKm(fromLat, fromLng, toLat, toLng) {
  const earthRadiusKm = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function hasExistingAddress(defaultAddressValues) {
  if (!defaultAddressValues) return false;

  const addressFields = [
    "streetNumber",
    "streetName",
    "suburb",
    "city",
    "province",
    "country",
    "postalCode",
  ];

  const hasAddressText = addressFields.some((field) => {
    const value = defaultAddressValues[field];
    return value !== undefined && value !== null && String(value).trim() !== "";
  });

  const hasCoordinates =
    defaultAddressValues.latitude !== undefined &&
    defaultAddressValues.latitude !== null &&
    String(defaultAddressValues.latitude).trim() !== "" &&
    defaultAddressValues.longitude !== undefined &&
    defaultAddressValues.longitude !== null &&
    String(defaultAddressValues.longitude).trim() !== "";

  return hasAddressText || hasCoordinates;
}

function buildAddressLabel(defaultAddressValues) {
  const lineOne = [
    defaultAddressValues.streetNumber,
    defaultAddressValues.streetName,
  ]
    .filter(
      (value) =>
        value !== undefined && value !== null && String(value).trim() !== "",
    )
    .join(" ");

  const lineTwo = [
    defaultAddressValues.suburb,
    defaultAddressValues.city,
    defaultAddressValues.province,
    defaultAddressValues.country,
    defaultAddressValues.postalCode,
  ].filter(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );

  const fullAddress = [lineOne, ...lineTwo].filter(Boolean).join(", ");
  if (fullAddress) return fullAddress;

  const lat = defaultAddressValues.latitude;
  const lng = defaultAddressValues.longitude;
  if (
    lat !== undefined &&
    lat !== null &&
    String(lat).trim() !== "" &&
    lng !== undefined &&
    lng !== null &&
    String(lng).trim() !== ""
  ) {
    return `${lat}, ${lng}`;
  }

  return "";
}

export default function LocationAutoComplete({
  setAddressInfor,
  defaultAddressValues,
  onCurrentLocationLoadingChange,
}) {
  const [value, setValue] = React.useState(null);
  const [inputValue, setInputValue] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState([]);
  const [radius, setRadius] = React.useState(10);
  const loaded = React.useRef(false);
  const locationInitialized = React.useRef(false);
  const hasManualSelection = React.useRef(false);
  const hasDefaultApplied = React.useRef(false);
  const originCoordinatesRef = React.useRef(null);
  const [locationError, setLocationError] = React.useState("");

  const setCurrentLocationLoading = React.useCallback(
    (isLoading) => {
      if (typeof onCurrentLocationLoadingChange === "function") {
        onCurrentLocationLoadingChange(isLoading);
      }
    },
    [onCurrentLocationLoadingChange],
  );

  if (typeof window !== "undefined" && !loaded.current) {
    loadScript(
      `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`,
      document.querySelector("head"),
      "google-maps",
    );
    loaded.current = true;
  }

  const fetch = React.useMemo(
    () =>
      debounce(async (request, callback) => {
        const placesApi = window.google?.maps?.places;

        if (placesApi?.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
          try {
            const response =
              await placesApi.AutocompleteSuggestion.fetchAutocompleteSuggestions(
                {
                  input: request.input,
                },
              );

            const normalizedOptions = (response?.suggestions || [])
              .map(normalizeSuggestion)
              .filter(Boolean);

            callback(normalizedOptions);
            return;
          } catch {
            // Fallback to legacy service below.
          }
        }

        if (!autocompleteService.current && placesApi?.AutocompleteService) {
          autocompleteService.current = new placesApi.AutocompleteService();
        }

        if (!autocompleteService.current) {
          callback([]);
          return;
        }

        autocompleteService.current.getPlacePredictions(request, callback);
      }, 400),
    [],
  );

  React.useEffect(() => {
    let active = true;

    if (!window.google?.maps?.places) return undefined;

    if (query === "") {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch({ input: query }, (results) => {
      if (!active) return;
      let newOptions = [];
      if (value) newOptions = [value];
      if (results) newOptions = [...newOptions, ...results];
      setOptions(newOptions);
    });

    return () => {
      active = false;
    };
  }, [value, query, fetch]);

  React.useEffect(() => {
    setAddressInfor({ radius: String(radius) });
  }, [radius, setAddressInfor]);

  React.useEffect(() => {
    if (hasDefaultApplied.current) return;
    if (!hasExistingAddress(defaultAddressValues)) return;

    const defaultLabel = buildAddressLabel(defaultAddressValues);
    if (!defaultLabel) return;

    const defaultOption = {
      description: defaultLabel,
      place_id: `default-${defaultAddressValues.latitude || "na"}-${defaultAddressValues.longitude || "na"}-${defaultAddressValues.postalCode || "na"}`,
    };

    const parsedRadius = Number(defaultAddressValues.radius);
    if (!Number.isNaN(parsedRadius)) {
      const boundedRadius = Math.min(50, Math.max(5, parsedRadius));
      setRadius(boundedRadius);
    }

    const baseLatitude = toNumber(defaultAddressValues.latitude);
    const baseLongitude = toNumber(defaultAddressValues.longitude);
    if (baseLatitude !== null && baseLongitude !== null) {
      originCoordinatesRef.current = {
        latitude: baseLatitude,
        longitude: baseLongitude,
      };
    }

    setValue(defaultOption);
    setInputValue(defaultLabel);
    setOptions([defaultOption]);
    setQuery("");
    hasDefaultApplied.current = true;
    locationInitialized.current = true;
  }, [defaultAddressValues]);

  const extractAddressInfo = React.useCallback(
    (result, customAccuracy = "0", customLatitude, customLongitude) => {
      const addressComponents = result.address_components || [];

      let streetNumber = "";
      let streetName = "";
      let suburb = "";
      let city = "";
      let province = "";
      let country = "";
      let postalCode = "";

      addressComponents.forEach((component) => {
        if (component.types.includes("street_number")) {
          streetNumber = component.long_name;
        }
        if (component.types.includes("route")) {
          streetName = component.long_name;
        }
        if (
          component.types.includes("sublocality") ||
          component.types.includes("sublocality_level_1")
        ) {
          suburb = component.long_name;
        }
        if (component.types.includes("locality")) {
          city = component.long_name;
        }
        if (component.types.includes("administrative_area_level_1")) {
          province = component.long_name;
        }
        if (component.types.includes("country")) {
          country = component.long_name;
        }
        if (component.types.includes("postal_code")) {
          postalCode = component.long_name;
        }
      });

      const latitude =
        customLatitude ?? result.geometry?.location?.lat?.() ?? "";
      const longitude =
        customLongitude ?? result.geometry?.location?.lng?.() ?? "";

      setAddressInfor({
        latitude: latitude === "" ? "" : String(latitude),
        longitude: longitude === "" ? "" : String(longitude),
        accuracy: String(customAccuracy),
        radius: String(radius),
        streetNumber,
        streetName,
        suburb,
        city: city || suburb,
        province,
        country,
        postalCode,
      });
    },
    [radius, setAddressInfor],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") {
      setCurrentLocationLoading(false);
      return undefined;
    }
    if (hasExistingAddress(defaultAddressValues)) {
      setCurrentLocationLoading(false);
      return undefined;
    }
    if (locationInitialized.current) {
      setCurrentLocationLoading(false);
      return undefined;
    }
    if (!navigator?.geolocation) {
      setCurrentLocationLoading(false);
      return undefined;
    }

    setCurrentLocationLoading(true);

    const intervalId = window.setInterval(() => {
      if (locationInitialized.current) {
        window.clearInterval(intervalId);
        setCurrentLocationLoading(false);
        return;
      }

      if (!window.google?.maps) return;

      locationInitialized.current = true;
      window.clearInterval(intervalId);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 0);
          const geocoder = new window.google.maps.Geocoder();

          const coordinateLabel = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          const currentLocationOption = {
            description: coordinateLabel,
            place_id: `current-${latitude}-${longitude}`,
          };

          setValue(currentLocationOption);
          setInputValue(coordinateLabel);
          setOptions([currentLocationOption]);
          setQuery("");
          setLocationError("");
          originCoordinatesRef.current = {
            latitude,
            longitude,
          };
          setAddressInfor({
            latitude: String(latitude),
            longitude: String(longitude),
            accuracy: String(accuracy),
          });

          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              if (hasManualSelection.current) {
                setCurrentLocationLoading(false);
                return;
              }

              if (status === "OK" && results?.[0]) {
                const result = results[0];
                const description =
                  result.formatted_address || "Current Location";
                const resolvedLocationOption = {
                  description,
                  place_id:
                    result.place_id || `current-${latitude}-${longitude}`,
                };

                setValue(resolvedLocationOption);
                setInputValue(description);
                setOptions([resolvedLocationOption]);
                setQuery("");
                extractAddressInfo(result, accuracy, latitude, longitude);
                setCurrentLocationLoading(false);
                return;
              }

              setAddressInfor({
                latitude: String(latitude),
                longitude: String(longitude),
                accuracy: String(accuracy),
              });
              setCurrentLocationLoading(false);
            },
          );
        },
        () => {
          setCurrentLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    }, 300);

    return () => {
      window.clearInterval(intervalId);
      setCurrentLocationLoading(false);
    };
  }, [
    defaultAddressValues,
    extractAddressInfo,
    setAddressInfor,
    setCurrentLocationLoading,
  ]);

  const handlePlaceSelect = (place) => {
    if (!window.google?.maps) return;

    if (!place) {
      setValue(null);
      setInputValue("");
      setQuery("");
      setLocationError("");
      return;
    }

    hasManualSelection.current = true;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: place.place_id }, (results, status) => {
      if (status !== "OK" || !results?.[0]) return;

      const result = results[0];
      const selectedLatitude = toNumber(result.geometry?.location?.lat?.());
      const selectedLongitude = toNumber(result.geometry?.location?.lng?.());

      if (
        originCoordinatesRef.current &&
        selectedLatitude !== null &&
        selectedLongitude !== null
      ) {
        const distanceKm = getDistanceInKm(
          originCoordinatesRef.current.latitude,
          originCoordinatesRef.current.longitude,
          selectedLatitude,
          selectedLongitude,
        );

        if (distanceKm > radius) {
          setLocationError(
            `Selected location is ${distanceKm.toFixed(1)} km away. Please choose a location within ${radius} km.`,
          );
          setInputValue(value?.description || "");
          setQuery("");
          return;
        }
      }

      setLocationError("");
      setValue(place);
      setInputValue(place.description || "");
      setQuery("");
      extractAddressInfo(result);
    });
  };

  return (
    <Box>
      <Autocomplete
        isOptionEqualToValue={(option, selectedValue) =>
          option?.place_id === selectedValue?.place_id
        }
        getOptionLabel={(option) =>
          typeof option === "string" ? option : option.description
        }
        filterOptions={(x) => x}
        options={options}
        includeInputInList
        filterSelectedOptions
        value={value}
        inputValue={inputValue}
        fullWidth
        noOptionsText="No locations"
        onChange={(event, newValue) => {
          setOptions(newValue ? [newValue, ...options] : options);
          handlePlaceSelect(newValue);
        }}
        onInputChange={(event, newInputValue, reason) => {
          if (reason === "input") {
            setInputValue(newInputValue);
            setQuery(newInputValue);
          }
          if (reason === "reset") {
            setInputValue(newInputValue);
            setQuery("");
          }
        }}
        renderInput={(params) => (
          <TextField {...params} label="Search Address" fullWidth />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Box sx={{ display: "flex", width: 36 }}>
                <LocationOnIcon sx={{ color: "text.secondary" }} />
              </Box>
              <Box sx={{ width: "calc(100% - 36px)", wordWrap: "break-word" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {option?.structured_formatting?.main_text ||
                    option.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option?.structured_formatting?.secondary_text || ""}
                </Typography>
              </Box>
            </Box>
          </li>
        )}
      />
      {locationError ? (
        <Typography
          variant="caption"
          color="error.main"
          sx={{ mt: 0.75, display: "block" }}
        >
          {locationError}
        </Typography>
      ) : null}

      <Box sx={{ mt: 2, px: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Radius: {radius} km
        </Typography>
        <Slider
          value={radius}
          min={5}
          max={50}
          step={1}
          valueLabelDisplay="auto"
          valueLabelFormat={(val) => `${val} km`}
          onChange={(event, newValue) => {
            setRadius(Array.isArray(newValue) ? newValue[0] : newValue);
          }}
        />
        <Typography
          variant="caption"
          color="error.main"
          sx={{ mt: 0.75, display: "block" }}
        >
          The system allows you to use your current location or choose any
          location within your selected radius (currently {radius} km).
        </Typography>
      </Box>
    </Box>
  );
}
