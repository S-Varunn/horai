/**
 * @file phone-formatter.ts
 * @description Intelligent international phone number formatting and country recognition
 */

export interface CountryInfo {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  format: (national: string) => string;
}

export const COUNTRIES: CountryInfo[] = [
  {
    name: "United States / Canada",
    code: "US",
    dialCode: "+1",
    flag: "🇺🇸",
    format: (n) => {
      if (n.length <= 3) return `(${n}`;
      if (n.length <= 6) return `(${n.slice(0, 3)}) ${n.slice(3)}`;
      return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6, 10)}`;
    },
  },
  {
    name: "India",
    code: "IN",
    dialCode: "+91",
    flag: "🇮🇳",
    format: (n) => {
      if (n.length <= 5) return n;
      return `${n.slice(0, 5)} ${n.slice(5, 10)}`;
    },
  },
  {
    name: "United Kingdom",
    code: "GB",
    dialCode: "+44",
    flag: "🇬🇧",
    format: (n) => {
      if (n.length <= 4) return n;
      if (n.length <= 7) return `${n.slice(0, 4)} ${n.slice(4)}`;
      return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 11)}`;
    },
  },
  {
    name: "Australia",
    code: "AU",
    dialCode: "+61",
    flag: "🇦🇺",
    format: (n) => {
      if (n.length <= 3) return n;
      if (n.length <= 6) return `${n.slice(0, 3)} ${n.slice(3)}`;
      return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)}`;
    },
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    dialCode: "+971",
    flag: "🇦🇪",
    format: (n) => {
      if (n.length <= 2) return n;
      if (n.length <= 5) return `${n.slice(0, 2)} ${n.slice(2)}`;
      return `${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 9)}`;
    },
  },
  {
    name: "Germany",
    code: "DE",
    dialCode: "+49",
    flag: "🇩🇪",
    format: (n) => {
      if (n.length <= 3) return n;
      if (n.length <= 7) return `${n.slice(0, 3)} ${n.slice(3)}`;
      return `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7, 11)}`;
    },
  },
  {
    name: "France",
    code: "FR",
    dialCode: "+33",
    flag: "🇫🇷",
    format: (n) => {
      return n.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
    },
  },
  {
    name: "Singapore",
    code: "SG",
    dialCode: "+65",
    flag: "🇸🇬",
    format: (n) => {
      if (n.length <= 4) return n;
      return `${n.slice(0, 4)} ${n.slice(4, 8)}`;
    },
  },
  {
    name: "Japan",
    code: "JP",
    dialCode: "+81",
    flag: "🇯🇵",
    format: (n) => {
      if (n.length <= 2) return n;
      if (n.length <= 6) return `${n.slice(0, 2)} ${n.slice(2)}`;
      return `${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6, 10)}`;
    },
  },
  {
    name: "Brazil",
    code: "BR",
    dialCode: "+55",
    flag: "🇧🇷",
    format: (n) => {
      if (n.length <= 2) return `(${n}`;
      if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
      return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
    },
  },
  {
    name: "Mexico",
    code: "MX",
    dialCode: "+52",
    flag: "🇲🇽",
    format: (n) => {
      if (n.length <= 2) return n;
      if (n.length <= 6) return `${n.slice(0, 2)} ${n.slice(2)}`;
      return `${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6, 10)}`;
    },
  },
  {
    name: "South Africa",
    code: "ZA",
    dialCode: "+27",
    flag: "🇿🇦",
    format: (n) => {
      if (n.length <= 2) return n;
      if (n.length <= 5) return `${n.slice(0, 2)} ${n.slice(2)}`;
      return `${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 9)}`;
    },
  },
];

/**
 * Recognize country and format phone number in real time as the user types.
 */
export function formatPhoneNumberLive(rawInput: string): {
  formatted: string;
  cleanE164: string;
  country: CountryInfo | null;
  isValid: boolean;
} {
  let cleaned = rawInput.trim();
  const hasPlus = cleaned.startsWith("+");
  const digitsOnly = cleaned.replace(/\D/g, "");

  if (!digitsOnly) {
    return {
      formatted: hasPlus ? "+" : "",
      cleanE164: hasPlus ? "+" : "",
      country: null,
      isValid: false,
    };
  }

  // Sort countries by dialCode length descending (e.g. +971 before +9)
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

  let matchedCountry: CountryInfo | null = null;
  let dialDigits = "";

  // If user explicitly typed '+', match the dial code directly
  if (hasPlus) {
    for (const c of sorted) {
      const codeOnly = c.dialCode.replace("+", "");
      if (digitsOnly.startsWith(codeOnly)) {
        matchedCountry = c;
        dialDigits = codeOnly;
        break;
      }
    }
  } else {
    // If no '+', check if it starts with '1' (US/CA with country code) or a known multi-digit country prefix with enough total digits
    if (digitsOnly.startsWith("1")) {
      matchedCountry = COUNTRIES[0];
      dialDigits = "1";
    } else {
      // Check multi-digit countries like 91 (12 digits), 44 (12 digits), 971 (12 digits), 61 (11 digits)
      for (const c of sorted) {
        const codeOnly = c.dialCode.replace("+", "");
        if (codeOnly !== "1" && digitsOnly.startsWith(codeOnly) && digitsOnly.length > codeOnly.length + 6) {
          matchedCountry = c;
          dialDigits = codeOnly;
          break;
        }
      }

      // If still not matched and it looks like a standard 10-digit North American number:
      if (!matchedCountry && digitsOnly.length <= 10) {
        matchedCountry = COUNTRIES[0];
        dialDigits = "1";
        const formattedNational = matchedCountry.format(digitsOnly);
        return {
          formatted: `+1 ${formattedNational}`.trim(),
          cleanE164: `+1${digitsOnly}`,
          country: matchedCountry,
          isValid: digitsOnly.length === 10,
        };
      }
    }
  }

  if (!matchedCountry) {
    return {
      formatted: `+${digitsOnly.slice(0, 15)}`,
      cleanE164: `+${digitsOnly}`,
      country: null,
      isValid: digitsOnly.length >= 8,
    };
  }

  const nationalDigits = digitsOnly.slice(dialDigits.length);
  const formattedNational = matchedCountry.format(nationalDigits);

  const formatted = `${matchedCountry.dialCode} ${formattedNational}`.trim();
  const cleanE164 = `+${dialDigits}${nationalDigits}`;

  return {
    formatted,
    cleanE164,
    country: matchedCountry,
    isValid: digitsOnly.length >= (dialDigits.length + 7) && digitsOnly.length <= 15,
  };
}
