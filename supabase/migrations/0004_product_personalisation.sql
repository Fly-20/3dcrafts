-- Personalisation is configured per product and saved on each purchased item.
alter table products add column personalisation_required boolean not null default false;
alter table order_items add column personalisation_text text
  check (personalisation_text is null or (char_length(btrim(personalisation_text)) > 0 and char_length(personalisation_text) <= 200));
