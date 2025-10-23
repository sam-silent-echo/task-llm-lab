-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "paramGrid" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "experimentId" TEXT NOT NULL,
    "temperature" REAL NOT NULL,
    "topP" REAL NOT NULL,
    "maxTokens" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Run_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    CONSTRAINT "Response_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "completeness" REAL NOT NULL,
    "coherence" REAL NOT NULL,
    "repetition" REAL NOT NULL,
    "readability" REAL NOT NULL,
    "lengthFit" REAL NOT NULL,
    "structure" REAL NOT NULL,
    "composite" REAL NOT NULL,
    CONSTRAINT "Metrics_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Response_runId_key" ON "Response"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "Metrics_responseId_key" ON "Metrics"("responseId");
