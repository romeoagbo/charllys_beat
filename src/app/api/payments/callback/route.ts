import { NextResponse } from "next/server";
import { siteRedirectPath } from "@/lib/config";
import { syncPurchaseFromTransaction } from "@/lib/payment-sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("id");
  const callbackStatus = searchParams.get("status");

  if (!transactionId) {
    return NextResponse.redirect(siteRedirectPath("/payment/cancel", request));
  }

  const result = await syncPurchaseFromTransaction(transactionId, {
    preferredStatus: callbackStatus
      ? mapCallbackStatus(callbackStatus)
      : null,
    verifyWithApi: true,
  });

  if (!result.found) {
    return NextResponse.redirect(siteRedirectPath("/payment/cancel", request));
  }

  const { status, audioId } = result;

  if (status === "approved" && audioId) {
    return NextResponse.redirect(
      siteRedirectPath("/payment/success", request, { audio: audioId }),
    );
  }

  if (status === "pending" && audioId) {
    return NextResponse.redirect(
      siteRedirectPath("/payment/pending", request, {
        audio: audioId,
        transaction: transactionId,
      }),
    );
  }

  return NextResponse.redirect(
    siteRedirectPath("/payment/cancel", request, {
      ...(audioId ? { audio: audioId } : {}),
      status,
    }),
  );
}

function mapCallbackStatus(status: string) {
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
