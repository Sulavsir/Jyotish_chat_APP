#!/usr/bin/env bash
# Baseline: mark every migration up to and including
# 20260324120000_nepal_geography_unique_province_name as already applied.
#
# Run ONLY when the database already reflects all of that SQL (e.g. you used db:push
# or applied changes manually). Wrong baselines break future migrate deploy.
#
# After this, apply newer migrations with:
#   pnpm db:migrate:deploy && pnpm db:generate
# (On servers, prefer deploy — it applies all pending migrations in order.)
#
# `pnpm db:migrate` runs `migrate dev` (interactive, dev-oriented). For “just run
# pending migrations” without prompts, use `pnpm db:migrate:deploy`.

set -euo pipefail

MIGRATIONS=(
  20251219042221_init
  20251224161321_add_address_fields
  20260102054502_add_pricing_plans
  20260106054137_add_astrologer_categories_and_appointments
  20260120120000_add_dashboard_rotating_copy
  20260120124500_add_jyotish_booking_requests
  20260120191500_add_katha_vachak_booking_type
  20260120193500_add_preferred_astrologer_to_jyotish_bookings
  20260120195000_add_katha_vachak_astrologer_category
  20260129000000_add_broadcast_message_cancelled_status
  20260202000000_add_questionnaire_language
  20260202100000_add_client_profiles
  20260206100000_add_astrologer_address
  20260209100000_add_astrologer_soft_delete
  20260212000000_add_platform_coin_rate_and_astrologer_coin_earning
  20260212100000_add_kundali_review_and_astrologer_slots
  20260212100001_insert_kundali_review_coin_rate
  20260212110000_booking_slot_type_kundali_only
  20260212120000_add_kundali_match
  20260212120001_insert_kundali_match_coin_rate
  20260219000000_add_coins_per_npr
  20260219000001_insert_coins_per_npr_rate
  20260224000000_add_broadcast_question_pricing
  20260224010000_add_astrologer_chat_message_fee
  20260225000000_add_fonepay_transaction
  20260225100000_add_fonepay_transaction_type
  20260226000000_add_subha_sahit_language
  20260226100000_add_nepali_date
  20260315100000_add_reopened_after_ended_nepal_place_of_birth
  20260316000000_geography_type_enum_and_unique
  20260319000000_add_performance_indexes
  20260319030000_add_horoscope_batch_index
  20260319040000_add_payment_success_index
  20260319050000_add_missing_tables
  20260320054025_add_horoscope_user_unique_constraints
  20260320060000_add_sidebar_count_indexes
  20260320062855_sidebar
  20260321000000_add_astrologer_earning_source_detail
  20260321100000_add_chat_ended_abandoned_notification_types
  20260323112829_earning
  20260324120000_astrologer_commission_split
  20260324120000_nepal_geography_unique_province_name
)

for name in "${MIGRATIONS[@]}"; do
  echo "→ prisma migrate resolve --applied $name"
  pnpm exec prisma migrate resolve --applied "$name"
done

echo ""
echo "Baseline complete through nepal_geography_unique_province_name."
echo "Next: pnpm db:migrate:deploy && pnpm db:generate   (applies all newer migrations, e.g. broadcast expires_at)"
