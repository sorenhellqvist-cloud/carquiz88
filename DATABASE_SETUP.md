# Database Setup for Car Quiz

## Supabase Configuration

This application connects to the Supabase database at:
- Project URL: `https://rrcmcnkcktqvhahnetee.supabase.co`
- Project ID: `rrcmcnkcktqvhahnetee`

## Database Schema

### Table: `questions`

The quiz expects a table named `questions` with the following structure:

```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  image_url TEXT,
  correct_answer TEXT NOT NULL,
  wrong_answer1 TEXT,
  wrong_answer2 TEXT,
  wrong_answer3 TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Alternative Column Names

The application also supports these alternative column names:
- `image` instead of `image_url`
- `wrong_answer_1` instead of `wrong_answer1`
- `wrong_answer_2` instead of `wrong_answer2`
- `wrong_answer_3` instead of `wrong_answer3`

## Sample Data

Here are some example questions you can insert into the database:

```sql
INSERT INTO questions (question, image_url, correct_answer, wrong_answer1, wrong_answer2, wrong_answer3) VALUES
('Vilken bil är det här?', 'https://example.com/car1.jpg', 'Volvo V70', 'Saab 9-5', 'BMW 5-serie', 'Audi A6'),
('Vilket märke tillhör denna bil?', 'https://example.com/car2.jpg', 'Tesla Model 3', 'Polestar 2', 'BMW i4', 'Mercedes EQE'),
('Känner du igen denna klassiker?', 'https://example.com/car3.jpg', 'Porsche 911', 'Ferrari 458', 'Lamborghini Huracán', 'Aston Martin Vantage');
```

## Setting Up Row Level Security (RLS)

To allow public read access to the questions table, you need to configure Row Level Security:

1. In Supabase Dashboard, go to Authentication > Policies
2. Select the `questions` table
3. Create a new policy with these settings:
   - Policy name: "Enable read access for all users"
   - Policy command: SELECT
   - Target roles: anon, authenticated
   - Policy definition: `true`

Or run this SQL:

```sql
-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Enable read access for all users" ON questions
  FOR SELECT
  USING (true);
```

## Testing the Connection

Once the table is set up with data, the quiz will automatically load questions when you open `carquiz.html` in a web browser.

If you see a "Failed to fetch" error, check:
1. That the questions table exists
2. That there is at least one row in the table
3. That RLS policies allow anonymous access
4. That the Supabase URL and anon key are correct in `carquiz.html`
