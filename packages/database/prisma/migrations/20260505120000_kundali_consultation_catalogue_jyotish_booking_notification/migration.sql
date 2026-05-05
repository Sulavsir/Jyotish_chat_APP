
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'NotificationType'
      AND e.enumlabel = 'JYOTISH_BOOKING'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'JYOTISH_BOOKING';
  END IF;
END $$;

CREATE TABLE "KundaliMatchConsultationQuestion" (
    "id" TEXT NOT NULL,
    "textNe" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KundaliMatchConsultationQuestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KundaliMatchConsultationQuestion_isActive_sortOrder_idx" ON "KundaliMatchConsultationQuestion"("isActive", "sortOrder");

INSERT INTO "Settings" ("id", "key", "value", "description", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'kundali_match_consultation_title_ne',
    $title$कुण्डली मिलान सम्बन्धी ज्योतिषीय परामर्श (Premium Kundali Matching Consultation)$title$,
    'Title shown above kundali match consultation topics (Nepali)',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("key") DO NOTHING;

INSERT INTO "KundaliMatchConsultationQuestion" ("id", "textNe", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
(
    'KM_PREMIUM_Q1',
    $q1$हाम्रो दुवै जनाको कुण्डली मिलान कस्तो देखिन्छ? कुल गुण मिलान (guna milan) कति छ र यसको समग्र परिणाम कस्तो हुन्छ?$q1$,
    1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'KM_PREMIUM_Q2',
    $q2$हाम्रो स्वभाव, सोच र व्यवहार कत्तिको मिल्ने देखिन्छ? दीर्घकालीन रूपमा compatibility कस्तो रहने सम्भावना छ?$q2$,
    2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'KM_PREMIUM_Q3',
    $q3$हाम्रो सम्बन्ध भविष्यमा कत्तिको स्थिर र सफल रहने देखिन्छ? सम्बन्धमा उतार–चढाव आउने सम्भावना कस्तो छ?$q3$,
    3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'KM_PREMIUM_Q4',
    $q4$विवाहपछि हाम्रो दाम्पत्य जीवन (relationship, trust, emotional bonding) कस्तो रहने देखिन्छ?$q4$,
    4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'KM_PREMIUM_Q5',
    $q5$कुण्डलीमा कुनै दोष (जस्तै माङ्गलिक दोष, ग्रह दोष आदि) छन् कि छैनन्? यदि छन् भने त्यसले सम्बन्धमा कस्तो असर पार्छ?$q5$,
    5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'KM_PREMIUM_Q6',
    $q6$आर्थिक अवस्था, करियर र पारिवारिक जीवनमा हाम्रो मिलान कस्तो देखिन्छ? विवाहपछि stability कस्तो रहने सम्भावना छ?$q6$,
    6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'KM_PREMIUM_Q7',
    $q7$विवाहपछि हामीबीच दूरी (ताढिनु), अलग बसाइ वा सम्बन्धमा चिसोपन आउने सम्भावना कत्तिको छ? यसको कारण के हुन सक्छ?$q7$,
    7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'KM_PREMIUM_Q8',
    $q8$सन्तान (children) सम्बन्धी योग कस्तो देखिन्छ? भविष्यमा पारिवारिक जीवनमा कस्तो अवस्था रहने सम्भावना छ?$q8$,
    8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'KM_PREMIUM_Q9',
    $q9$दुवै जनाको ग्रहदशा र गोचरले हाम्रो सम्बन्ध र विवाहमा कस्तो प्रभाव पार्ने देखिन्छ? कुन समय राम्रो वा संवेदनशील हुन सक्छ?$q9$,
    9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'KM_PREMIUM_Q10',
    $q10$यदि कुण्डलीमा केही कमजोरी वा दोष छन् भने, त्यसलाई सुधार गर्न कुन मन्त्र, पूजा, दान वा उपाय अपनाउनु उपयुक्त हुन्छ?$q10$,
    10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
