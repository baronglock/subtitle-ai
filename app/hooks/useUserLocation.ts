"use client";

import { useEffect, useState } from "react";

interface LocationData {
  country: string;
  currency: "USD" | "BRL";
  locale: string;
  symbol: string;
}

export function useUserLocation(): LocationData {
  const [location, setLocation] = useState<LocationData>({
    country: "US",
    currency: "USD",
    locale: "en-US",
    symbol: "$",
  });

  useEffect(() => {
    // Check browser language
    const browserLang = navigator.language || (navigator as any).userLanguage;
    
    // Check timezone for Brazil
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isBrazil = timezone?.includes("Sao_Paulo") || 
                     timezone?.includes("Brazil") ||
                     browserLang?.toLowerCase().includes("pt-br");

    // Fetch location from IP (optional - using free service)
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.country_code === "BR" || isBrazil) {
          setLocation({
            country: "BR",
            currency: "BRL",
            locale: "pt-BR",
            symbol: "R$",
          });
        } else {
          setLocation({
            country: data.country_code || "US",
            currency: "USD",
            locale: "en-US",
            symbol: "$",
          });
        }
      })
      .catch(() => {
        // Fallback to browser detection
        if (isBrazil) {
          setLocation({
            country: "BR",
            currency: "BRL",
            locale: "pt-BR",
            symbol: "R$",
          });
        }
      });
  }, []);

  return location;
}

export function formatPrice(
  price: number,
  currency: "USD" | "BRL",
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: currency === "BRL" ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(price);
}