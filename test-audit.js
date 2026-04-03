const jwt = require('jsonwebtoken');

async function runTest() {
  const token = jwt.sign(
    { id: 1, email: 'admin@test.com', rol: 'SUPERADMIN', nombre: 'Admin Test' },
    process.env.JWT_SECRET || 'itam_secret_key_123',
    { expiresIn: '1h' }
  );

  console.log("Token generated:", token);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  try {
    // 1. Get slots
    const res1 = await fetch('http://localhost:3000/api/slots?limit=1', { headers });
    const data1 = await res1.json();
    const slot1 = data1.data[0];
    console.log("Found slot:", slot1.id, slot1.modelo, slot1.gama);

    // 2. Update slot (change gama and modelo)
    const newGama = slot1.gama === 'ALTA' ? 'MEDIA' : 'ALTA';
    const newModelo = slot1.modelo + ' (Edited)';

    const res2 = await fetch(`http://localhost:3000/api/slots/${slot1.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ gama: newGama, modelo: newModelo })
    });
    const updateResult = await res2.json();
    console.log("Update result:", updateResult.message);

    // 3. Get Slot Logs
    const res3 = await fetch(`http://localhost:3000/api/slots/${slot1.id}/logs`, { headers });
    const slotLogs = await res3.json();
    console.log("Slot Logs Count:", slotLogs.data.length);
    console.log("Latest Slot Log:", slotLogs.data[0]);

    // 4. Get Global Logs
    const res4 = await fetch('http://localhost:3000/api/logs?limit=5', { headers });
    const globalLogs = await res4.json();
    console.log("Global Logs Count:", globalLogs.data.length);
    console.log("Latest Global Log:", globalLogs.data[0]?.campo_afectado, globalLogs.data[0]?.valor_nuevo);

  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTest();
