#!/bin/bash
BASE_URL="http://localhost:3000/api/activos"

echo "1. Testing Health Check..."
curl -s http://localhost:3000/
echo -e "\n"

echo "2. Creating a new Service Slot..."
RESPONSE=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_dispositivo": "SMARTPHONE",
    "imei": "123456789012345",
    "marca": "Samsung",
    "modelo": "Galaxy S23",
    "telefono": "5512345678",
    "proveedor": "Ochoa"
  }')
echo $RESPONSE
echo -e "\n"

# Extract ID from response (simple grep/sed as jq might not be installed, or just assume it works and copy manually if interactive. 
# But since I am automated, I'll just list all and pick one if I could, but for now just showing output is enough to verify it didn't error).
# Actually, I can use node to parse the response if I want to be fancy, but simple curl output visibility is enough for me to judge.

echo "3. Listing all Service Slots..."
curl -s $BASE_URL
echo -e "\n"

# I will not automate PUT/DELETE with dynamic ID in bash easily without jq. 
# I will inspect the output of step 2 and 3 in the tool result to confirm it works.
