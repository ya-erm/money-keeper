-- Add token expiration for server-side session validation.
ALTER TABLE "MemberToken" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- Keep existing sessions alive for one more full token lifetime after deployment.
UPDATE "MemberToken" SET "expiresAt" = CURRENT_TIMESTAMP + INTERVAL '30 days';

ALTER TABLE "MemberToken" ALTER COLUMN "expiresAt" SET NOT NULL;
