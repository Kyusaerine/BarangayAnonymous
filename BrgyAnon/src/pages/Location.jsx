// src/pages/Location.jsx

import React, { useState, useEffect, useRef } from "react";
import { db, collection, addDoc, serverTimestamp } from "../firebase";

function NewReportModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    userName: "",
    issue: "",
    location: "",
    lat: null,
    lng: null,
    desc: "",
    imagePreview: "",
    imageDataUrl: "",
    status: "Waiting Approval",
    block: "",
    purok: "",
  });

  const locationRef = useRef(null);

  // ✅ Autocomplete with Google Places
  useEffect(() => {
    if (!window.google || !locationRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      locationRef.current,
      { types: ["geocode"] }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      setForm((s) => ({
        ...s,
        location: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      }));
    });
  }, []);

  // ✅ Detect GPS and reverse geocode with Google
  function detectLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!window.google) {
          alert("Google Maps API not loaded.");
          return;
        }

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
            const address = results[0].formatted_address;
            setForm((s) => ({
              ...s,
              location: address,
              lat,
              lng,
            }));
            if (locationRef.current) locationRef.current.value = address;
          } else {
            alert("No address found, showing coordinates instead.");
            setForm((s) => ({
              ...s,
              location: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              lat,
              lng,
            }));
          }
        });
      },
      (err) => {
        console.error(err);
        alert("Unable to fetch location.");
      }
    );
  }

  // ✅ Submit handler
  async function handleSubmit(e) {
    e.preventDefault();

    const finalAddress = `${form.block ? "Blk " + form.block + ", " : ""}${
      form.purok ? "Purok " + form.purok + ", " : ""
    }${form.location}`;

    try {
      await addDoc(collection(db, "reports"), {
        ...form,
        location: finalAddress, // 👉 formatted address with Blk & Purok
        createdAt: serverTimestamp(),
      });

      alert("Report submitted!");
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Failed to save report.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <div className="flex gap-2">
          <input
            ref={locationRef}
            type="text"
            placeholder="Type or detect location"
            value={form.location}
            onChange={(e) =>
              setForm((s) => ({ ...s, location: e.target.value }))
            }
            className="flex-1 rounded-xl border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={detectLocation}
            className="rounded-xl bg-green-600 text-white px-3 py-2 text-sm hover:bg-green-700"
          >
            Use GPS
          </button>
        </div>
      </div>

      {/* Additional fields for Blk/Lot/Purok */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Block / Lot"
          value={form.block}
          onChange={(e) => setForm((s) => ({ ...s, block: e.target.value }))}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Purok"
          value={form.purok}
          onChange={(e) => setForm((s) => ({ ...s, purok: e.target.value }))}
          className="rounded-xl border px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-green-600 text-white px-3 py-2 text-sm hover:bg-green-700"
      >
        Submit Report
      </button>
    </form>
  );
}

export default NewReportModal;
