export type FedaPayCompleteResponse = {
  reason: string;
  transaction?: {
    id: number;
    status?: string;
  };
};

export type FedaPayCheckoutGlobal = {
  init: (
    target: HTMLElement | { current: HTMLElement | null },
    options: Record<string, unknown>,
  ) => void;
  DIALOG_DISMISSED: string;
  CHECKOUT_COMPLETED: string;
};

declare global {
  // checkout.js exposes FedaPay as a global
  const FedaPay: FedaPayCheckoutGlobal;

  interface Window {
    FedaPay: FedaPayCheckoutGlobal;
  }
}

export {};
