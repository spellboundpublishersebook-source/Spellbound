-- Allow updates on books table
CREATE POLICY "Allow public update access" ON books FOR UPDATE USING (true) WITH CHECK (true);

-- Allow updates on global settings table (just in case)
CREATE POLICY "Allow public update access" ON settings FOR UPDATE USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
