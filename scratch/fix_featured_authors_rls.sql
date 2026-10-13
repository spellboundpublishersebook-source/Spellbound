-- Allow anyone to read featured authors (public)
CREATE POLICY "Allow public read featured_authors"
ON featured_authors FOR SELECT
USING (true);

-- Allow anyone to insert featured authors (admin uses anon key)
CREATE POLICY "Allow insert featured_authors"
ON featured_authors FOR INSERT
WITH CHECK (true);

-- Allow anyone to delete featured authors
CREATE POLICY "Allow delete featured_authors"
ON featured_authors FOR DELETE
USING (true);

-- Allow anyone to update featured authors
CREATE POLICY "Allow update featured_authors"
ON featured_authors FOR UPDATE
USING (true);
