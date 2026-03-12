const fetch = require('node-fetch');

async function testPost() {
    const data = {
        nombre: 'Test',
        apellido: 'Manual',
        telefono: '123456789',
        mensaje: 'Test desde script',
        vehiculo: 'Fiat Cronos'
    };

    try {
        const res = await fetch('http://localhost:5000/api/public/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        console.log('Response:', result);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testPost();
