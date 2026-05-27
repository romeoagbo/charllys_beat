"use client";

import Script from "next/script";
import { createContext, useContext, useState, type ReactNode } from "react";

const FedaPayScriptContext = createContext(false);

export function useFedaPayScriptReady() {
  return useContext(FedaPayScriptContext);
}

export function FedaPayScriptProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(
    typeof window !== "undefined" && typeof FedaPay !== "undefined",
  );

  return (
    <FedaPayScriptContext.Provider value={ready}>
      <Script
        src="https://cdn.fedapay.com/checkout.js?v=1.1.7"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onLoad={() => setReady(true)}
      />
      {children}
    </FedaPayScriptContext.Provider>
  );
}
