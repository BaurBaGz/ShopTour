-- Телефон покупателя в брони — с любым кодом страны (раньше только +7):
-- только цифры, от 8 до 15 (международный формат E.164 без «+»).
alter table public.reservations drop constraint if exists reservations_customer_phone_check;
alter table public.reservations add constraint reservations_customer_phone_check check (customer_phone ~ '^\d{8,15}$');
