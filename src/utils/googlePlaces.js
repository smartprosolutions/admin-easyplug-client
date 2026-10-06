let mapsReadyPromise;

export function loadGoogleMaps() {
  if (mapsReadyPromise) return mapsReadyPromise;
  mapsReadyPromise = new Promise((resolve, reject) => {
    const apiKey = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
    if (!apiKey) {
      reject(new Error("VITE_GOOGLE_MAPS_API_KEY is not configured."));
      return;
    }
    let timeout;
    const previousAuthFailure = window.gm_authFailure;
    const fail = (message) => {
      clearTimeout(timeout);
      reject(new Error(message));
    };
    window.gm_authFailure = () => {
      fail("Google Maps rejected the API key. Check enabled APIs and website restrictions in Google Cloud.");
      previousAuthFailure?.();
    };
    const ready = () => {
      clearTimeout(timeout);
      if (typeof window.google?.maps?.importLibrary !== "function") {
        fail("Google Maps did not initialize. Check the API key and Google Cloud configuration.");
        return;
      }
      resolve(window.google.maps);
    };
    if (typeof window.google?.maps?.importLibrary === "function") {
      ready();
      return;
    }
    window.easyplugMapsReady = ready;
    timeout = setTimeout(() => fail("Google Maps initialization timed out. Check the network and API key restrictions."), 15000);
    const existing = document.querySelector("#google-maps");
    if (existing) {
      fail("Google Maps was loaded by another script before initialization. Reload the page.");
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async&v=weekly&callback=easyplugMapsReady`;
    script.onerror = () => fail("Unable to download Google Maps. Check your network connection.");
    document.head.appendChild(script);
  });
  return mapsReadyPromise;
}

async function getPlacesLibrary() {
  const maps = await loadGoogleMaps();
  return maps.importLibrary("places");
}

export async function fetchAddressSuggestions(input) {
  const { AutocompleteSuggestion } = await getPlacesLibrary();
  const { suggestions } =
    await AutocompleteSuggestion.fetchAutocompleteSuggestions({ input });
  return suggestions
    .filter((suggestion) => suggestion.placePrediction)
    .map(({ placePrediction }) => ({
      placePrediction,
      place_id: placePrediction.placeId,
      description: placePrediction.text.toString(),
      structured_formatting: {
        main_text:
          placePrediction.mainText?.toString() ||
          placePrediction.text.toString(),
        secondary_text: placePrediction.secondaryText?.toString() || "",
        main_text_matched_substrings: (
          placePrediction.mainText?.matches || []
        ).map(({ startOffset, endOffset }) => ({
          offset: startOffset,
          length: endOffset - startOffset,
        })),
      },
    }));
}

export async function fetchAddressDetails(option) {
  const place = option.placePrediction.toPlace();
  await place.fetchFields({
    fields: ["addressComponents", "location", "formattedAddress"],
  });
  return {
    address_components: (place.addressComponents || []).map((component) => ({
      long_name: component.longText,
      short_name: component.shortText,
      types: component.types,
    })),
    geometry: { location: place.location },
    formatted_address: place.formattedAddress,
  };
}
