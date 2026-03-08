-- CreateTable
CREATE TABLE "Nbfi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "keyContacts" TEXT NOT NULL,
    "fundingAmount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dateOnboarded" TEXT NOT NULL,
    "recommendation" TEXT,
    "approverComments" TEXT,
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "transactionType" TEXT,
    "loanBookMeta" TEXT,
    "securitisationStructure" TEXT,
    "monitoringData" TEXT,
    "earlyWarnings" TEXT,
    "financialData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Commentary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nbfiId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    CONSTRAINT "Commentary_nbfiId_fkey" FOREIGN KEY ("nbfiId") REFERENCES "Nbfi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CovenantDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nbfiId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "threshold" REAL NOT NULL,
    "frequency" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    CONSTRAINT "CovenantDefinition_nbfiId_fkey" FOREIGN KEY ("nbfiId") REFERENCES "Nbfi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CovenantReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nbfiId" TEXT NOT NULL,
    "covenantId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "CovenantReading_nbfiId_fkey" FOREIGN KEY ("nbfiId") REFERENCES "Nbfi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CovenantReading_covenantId_fkey" FOREIGN KEY ("covenantId") REFERENCES "CovenantDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nbfiId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "nextDueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedDate" TEXT,
    "submittedBy" TEXT,
    CONSTRAINT "Document_nbfiId_fkey" FOREIGN KEY ("nbfiId") REFERENCES "Nbfi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    CONSTRAINT "DocumentSubmission_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProvisioningRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nbfiId" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "dpdMin" INTEGER NOT NULL,
    "dpdMax" INTEGER NOT NULL,
    "provisionPercent" REAL NOT NULL,
    CONSTRAINT "ProvisioningRule_nbfiId_fkey" FOREIGN KEY ("nbfiId") REFERENCES "Nbfi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoanBook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nbfiId" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rows" TEXT NOT NULL,
    CONSTRAINT "LoanBook_nbfiId_fkey" FOREIGN KEY ("nbfiId") REFERENCES "Nbfi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PoolSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nbfiId" TEXT NOT NULL,
    "excludedSegments" TEXT NOT NULL,
    "filterSnapshot" TEXT NOT NULL,
    "confirmedAt" TEXT,
    CONSTRAINT "PoolSelection_nbfiId_fkey" FOREIGN KEY ("nbfiId") REFERENCES "Nbfi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nbfiId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_nbfiId_fkey" FOREIGN KEY ("nbfiId") REFERENCES "Nbfi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LoanBook_nbfiId_idx" ON "LoanBook"("nbfiId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolSelection_nbfiId_key" ON "PoolSelection"("nbfiId");
