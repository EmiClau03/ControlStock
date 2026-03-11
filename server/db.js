const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function initDb() {
    const db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER,
            version TEXT,
            mileage INTEGER,
            fuel TEXT,
            transmission TEXT,
            color TEXT,
            price REAL,
            description TEXT,
            status TEXT DEFAULT 'Disponible',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER,
            filename TEXT NOT NULL,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
        );
    `);

    return db;
}

module.exports = { initDb };
