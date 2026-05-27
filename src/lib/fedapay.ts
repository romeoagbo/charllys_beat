import { fedapayConfig } from "@/lib/config";

type FedaPayCustomerInput = {
  firstname: string;
  lastname: string;
  email: string;
  phone_number?: {
    number: string;
    country: string;
  };
};

type CreateTransactionInput = {
  description: string;
  amount: number;
  callbackUrl: string;
  customer?: FedaPayCustomerInput;
};

export type FedaPayTransaction = {
  id: number;
  status: string;
  amount: number;
  payment_url?: string | null;
  payment_token?: string | null;
};

type FedaPayToken = {
  token: string;
  url: string;
};

function getBaseUrl() {
  return fedapayConfig.environment === "live"
    ? "https://api.fedapay.com/v1"
    : "https://sandbox-api.fedapay.com/v1";
}

function unwrapResource<T>(payload: Record<string, unknown>, key: string): T {
  if (payload[key]) return payload[key] as T;
  const nested = Object.values(payload).find(
    (value) => typeof value === "object" && value !== null && "id" in value,
  );
  if (nested) return nested as T;
  return payload as T;
}

function formatFedapayError(payload: Record<string, unknown>): string {
  const base = (payload.message as string | undefined) ?? "Erreur Fedapay.";
  const errors = payload.errors as Record<string, string[]> | undefined;

  if (!errors) return base;

  const details = Object.entries(errors)
    .flatMap(([field, messages]) =>
      messages.map((message) => {
        if (field.includes("phone")) return `Téléphone ${message}`;
        if (field.includes("email")) return `Email ${message}`;
        if (field.includes("amount")) return `Montant ${message}`;
        return message;
      }),
    )
    .join(" · ");

  return details ? `${base} ${details}` : base;
}

async function fedaPayRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!fedapayConfig.secretKey) {
    throw new Error("Fedapay non configuré.");
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${fedapayConfig.secretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(formatFedapayError(payload));
  }

  return payload as T;
}

export function customerFromProfile(input: {
  email: string;
  displayName: string | null;
}): FedaPayCustomerInput {
  if (!input.email.includes("@")) {
    throw new Error("Adresse email invalide sur votre compte.");
  }

  const nameParts = (input.displayName ?? input.email.split("@")[0])
    .trim()
    .split(/\s+/);
  const firstname = nameParts[0] ?? "Client";
  const lastname = nameParts.slice(1).join(" ") || "Charllys";

  return {
    firstname,
    lastname,
    email: input.email,
  };
}

export async function createFedaPayTransaction(input: CreateTransactionInput) {
  const payload = await fedaPayRequest<Record<string, unknown>>("/transactions", {
    method: "POST",
    body: JSON.stringify({
      description: input.description,
      amount: input.amount,
      currency: { iso: "XOF" },
      callback_url: input.callbackUrl,
      ...(input.customer ? { customer: input.customer } : {}),
    }),
  });

  return unwrapResource<FedaPayTransaction>(payload, "v1/transaction");
}

export async function generateFedaPayToken(transactionId: number) {
  const payload = await fedaPayRequest<Record<string, unknown>>(
    `/transactions/${transactionId}/token`,
    { method: "POST", body: JSON.stringify({}) },
  );

  if (typeof payload.url === "string") {
    return {
      token: String(payload.token ?? ""),
      url: payload.url,
    };
  }

  return unwrapResource<FedaPayToken>(payload, "token");
}

export async function getFedaPayCheckoutUrl(transaction: FedaPayTransaction) {
  if (transaction.payment_url) {
    return transaction.payment_url;
  }

  const token = await generateFedaPayToken(transaction.id);
  return token.url;
}

export async function retrieveFedaPayTransaction(transactionId: string) {
  const payload = await fedaPayRequest<Record<string, unknown>>(
    `/transactions/${transactionId}`,
    { method: "GET" },
  );

  return unwrapResource<FedaPayTransaction>(payload, "v1/transaction");
}

export function mapFedaPayStatus(status: string) {
  switch (status) {
    case "approved":
      return "approved" as const;
    case "canceled":
    case "cancelled":
      return "canceled" as const;
    case "declined":
    case "failed":
      return "failed" as const;
    default:
      return "pending" as const;
  }
}
