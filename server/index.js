const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const xlsx = require('xlsx');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

let db;

// Routes
app.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await db.all(`
            SELECT v.*, (SELECT COUNT(*) FROM photos p WHERE p.vehicle_id = v.id) as photoCount
            FROM vehicles v
            ORDER BY v.created_at DESC
        `);
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/vehicles/:id', async (req, res) => {
    try {
        const vehicle = await db.get('SELECT * FROM vehicles WHERE id = ?', req.params.id);
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
        
        const photos = await db.all('SELECT * FROM photos WHERE vehicle_id = ?', req.params.id);
        res.json({ ...vehicle, photos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vehicles', async (req, res) => {
    const { brand, model, year, version, mileage, fuel, transmission, color, price, description, status } = req.body;
    try {
        const result = await db.run(`
            INSERT INTO vehicles (brand, model, year, version, mileage, fuel, transmission, color, price, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [brand, model, year, version, mileage, fuel, transmission, color, price, description, status || 'Disponible']);
        
        res.status(201).json({ id: result.lastID });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/vehicles/:id', async (req, res) => {
    const { brand, model, year, version, mileage, fuel, transmission, color, price, description, status } = req.body;
    try {
        await db.run(`
            UPDATE vehicles 
            SET brand=?, model=?, year=?, version=?, mileage=?, fuel=?, transmission=?, color=?, price=?, description=?, status=?
            WHERE id=?
        `, [brand, model, year, version, mileage, fuel, transmission, color, price, description, status, req.params.id]);
        
        res.json({ message: 'Vehicle updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        // Delete photos files first
        const photos = await db.all('SELECT filename FROM photos WHERE vehicle_id = ?', req.params.id);
        photos.forEach(p => {
            const filePath = path.join(__dirname, 'uploads', p.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

        await db.run('DELETE FROM vehicles WHERE id = ?', req.params.id);
        res.json({ message: 'Vehicle and photos deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Photo upload
app.post('/api/vehicles/:id/photos', upload.array('photos'), async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const insertPromises = req.files.map(file => {
            return db.run('INSERT INTO photos (vehicle_id, filename) VALUES (?, ?)', [vehicleId, file.filename]);
        });
        await Promise.all(insertPromises);
        res.json({ message: 'Photos uploaded' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/photos/:id', async (req, res) => {
    try {
        const photo = await db.get('SELECT filename FROM photos WHERE id = ?', req.params.id);
        if (photo) {
            const filePath = path.join(__dirname, 'uploads', photo.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await db.run('DELETE FROM photos WHERE id = ?', req.params.id);
        }
        res.json({ message: 'Photo deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Excel Import
app.post('/api/import-excel', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

        // Vaciar tablas antes de importar (borrar todos los registros existentes)
        await db.run('DELETE FROM photos');
        await db.run('DELETE FROM vehicles');

        for (const row of data) {
            // Usar EXACTAMENTE los encabezados que definimos en el prompt:
            // Marca | Modelo | Año | Versión | Kilometraje | Combustible | Transmisión | Color | Precio | Estado

            let brand = String(row.Marca ?? '').trim();
            let model = String(row.Modelo ?? '').trim();
            let year = row.Año;
            let version = String(row['Versión'] ?? '').trim();
            let mileage = row.Kilometraje;
            let fuel = String(row.Combustible ?? '').trim();
            let transmission = String(row['Transmisión'] ?? '').trim();
            let color = String(row.Color ?? '').trim();
            let price = row.Precio;
            let status = String(row.Estado ?? '').trim() || 'Disponible';

            if (!brand) brand = 'Sin nombre';
            if (!model) model = 'Sin modelo';

            // Normalizar numéricos si vienen como string
            const toNumber = (v) => {
                if (v === null || v === undefined || v === '') return null;
                if (typeof v === 'number') return v;
                const cleaned = String(v).replace(/[^0-9.-]/g, '');
                const n = Number(cleaned);
                return Number.isNaN(n) ? null : n;
            };

            year = toNumber(year);
            mileage = toNumber(mileage);
            price = toNumber(price);

            await db.run(`
                INSERT INTO vehicles (brand, model, year, version, mileage, fuel, transmission, color, price, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                brand,
                model,
                year,
                version,
                mileage,
                fuel,
                transmission,
                color,
                price,
                status
            ]);
        }

        // Clean up uploaded excel file
        fs.unlinkSync(req.file.path);

        res.json({ message: `${data.length} vehicles imported successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stat: Vehicles without photos
app.get('/api/stats/no-photos', async (req, res) => {
    try {
        const vehicles = await db.all(`
            SELECT * FROM vehicles v
            WHERE NOT EXISTS (SELECT 1 FROM photos p WHERE p.vehicle_id = v.id)
        `);
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

initDb().then(database => {
    db = database;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
