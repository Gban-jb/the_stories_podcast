-- Supabase publishes the public schema through its Data API, so any table
-- without row level security can be read and written with the anon key.
-- The site reaches the database only through Prisma, as the table owner,
-- which bypasses RLS. Turning it on with no policies closes the Data API.
ALTER TABLE "Episode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chapter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Guest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SyncRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_EpisodeToTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_EpisodeToGuest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
