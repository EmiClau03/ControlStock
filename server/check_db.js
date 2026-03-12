const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function checkLeads() {
    const db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    try {
        const leads = await db.all('SELECT * FROM leads');
        console.log('Leads found:', JSON.stringify(leads, null, 2));
        
        const tableInfo = await db.all("PRAGMA table_info(leads)");
        console.log('Leads table schema:', JSON.stringify(tableInfo, null, 2));
    } catch (e) {
        console.error('Error checking leads:', e.message);
    }
}

checkLeads();
