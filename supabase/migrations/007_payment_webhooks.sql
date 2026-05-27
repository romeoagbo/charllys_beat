-- Idempotence des webhooks Fedapay

create table if not exists public.payment_webhook_events (
  event_id text primary key,
  event_name text not null,
  fedapay_transaction_id text,
  processed_at timestamptz not null default now()
);

create index if not exists payment_webhook_events_transaction_idx
  on public.payment_webhook_events (fedapay_transaction_id);
