from app.core.security import get_password_hash # Adjust import if needed

plain_password = "password123" # Choose a password for your test user
hashed_password = get_password_hash(plain_password)
print(f"Password: {plain_password}")
print(f"Hashed: {hashed_password}")
# Copy the generated hashed password