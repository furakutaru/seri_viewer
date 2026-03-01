CREATE TYPE "public"."evaluation" AS ENUM('◎', '○', '△');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('牡', '牝', 'セン');--> statement-breakpoint
CREATE TABLE "horses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "horses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"saleId" integer NOT NULL,
	"lotNumber" integer NOT NULL,
	"sex" "sex",
	"color" varchar(64),
	"birthDate" timestamp,
	"sireName" varchar(256),
	"damName" varchar(256),
	"consignor" varchar(256),
	"breeder" varchar(256),
	"height" numeric(5, 2),
	"girth" numeric(5, 2),
	"cannon" numeric(5, 2),
	"priceEstimate" integer,
	"photoUrl" varchar(512),
	"videoUrl" varchar(512),
	"pedigreePdfUrl" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedigreeUrls" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pedigreeUrls_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"horseName" varchar(256) NOT NULL,
	"jbisUrl" varchar(512),
	"lastVerified" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "popularityStats" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "popularityStats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"horseId" integer NOT NULL,
	"countExcellent" integer DEFAULT 0 NOT NULL,
	"countGood" integer DEFAULT 0 NOT NULL,
	"countFair" integer DEFAULT 0 NOT NULL,
	"lastUpdated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sales_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"saleCode" varchar(32) NOT NULL,
	"saleName" varchar(256) NOT NULL,
	"saleDate" timestamp NOT NULL,
	"catalogUrl" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_saleCode_unique" UNIQUE("saleCode")
);
--> statement-breakpoint
CREATE TABLE "userCheckItems" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userCheckItems_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"saleId" integer NOT NULL,
	"itemName" varchar(256) NOT NULL,
	"itemType" text NOT NULL,
	"score" integer NOT NULL,
	"criteria" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userCheckResults" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userCheckResults_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userCheckId" integer NOT NULL,
	"checkItemId" integer NOT NULL,
	"isChecked" boolean NOT NULL,
	"scoreApplied" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userChecks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userChecks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"horseId" integer NOT NULL,
	"evaluation" "evaluation",
	"memo" text,
	"isEliminated" boolean DEFAULT false NOT NULL,
	"totalScore" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" text DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
