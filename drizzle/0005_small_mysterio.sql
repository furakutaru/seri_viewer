CREATE INDEX "userChecks_userId_idx" ON "userChecks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "userChecks_horseId_idx" ON "userChecks" USING btree ("horseId");--> statement-breakpoint
CREATE INDEX "userChecks_userId_horseId_idx" ON "userChecks" USING btree ("userId","horseId");