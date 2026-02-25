-- Add per-astrologer chat message fee (NRs per direct message)

ALTER TABLE "Astrologer"
ADD COLUMN "chatMessageFee" DOUBLE PRECISION;

