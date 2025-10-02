-- Add profile_picture_url column to employees_details table
ALTER TABLE employees_details
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN employees_details.profile_picture_url IS 'Storage path to profile picture in employee-documents/profile-pictures/ folder';
