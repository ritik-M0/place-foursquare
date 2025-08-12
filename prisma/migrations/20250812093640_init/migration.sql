-- CreateTable
CREATE TABLE "public"."Place" (
    "id" SERIAL NOT NULL,
    "fsq_id" TEXT NOT NULL,
    "name" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Place_fsq_id_key" ON "public"."Place"("fsq_id");

-- CreateIndex
CREATE INDEX "Place_fsq_id_idx" ON "public"."Place"("fsq_id");
