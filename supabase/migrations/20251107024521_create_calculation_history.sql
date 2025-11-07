/*
  # Create calculation history table

  1. New Tables
    - `calculation_history`
      - `id` (uuid, primary key) - Unique identifier for each calculation
      - `transcript` (text) - Original voice input from user
      - `expression` (text) - Parsed mathematical expression
      - `result` (text) - Calculated result
      - `created_at` (timestamptz) - Timestamp when calculation was performed
  
  2. Security
    - Enable RLS on `calculation_history` table
    - Add policies for anonymous users to insert, read, and delete calculations
  
  3. Notes
    - This table stores the history of voice calculations
    - No authentication required as this is a public calculator app
    - Anyone can manage all calculations (public access for demo purposes)
*/

CREATE TABLE IF NOT EXISTS calculation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript text NOT NULL,
  expression text NOT NULL,
  result text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calculation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert calculations"
  ON calculation_history
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read calculations"
  ON calculation_history
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can delete calculations"
  ON calculation_history
  FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_calculation_history_created_at 
  ON calculation_history(created_at DESC);