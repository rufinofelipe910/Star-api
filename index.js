const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Errores al cargar módulos (TEMPORAL: para diagnosticar sin ver los logs de Vercel)
const loadErrors = [];

app.enable("trust proxy");
app.set("json spaces", 2);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// TEMPORAL: borra esta ruta cuando todo funcione
app.get('/_debug', (req, res) => {
    res.json({
        status: true,
        node: process.version,
        loadErrors
    });
});

// Rutas de autenticación
try {
    const authRoutes = require('./src/authRoutes');
    app.use(authRoutes);
} catch (e) {
    loadErrors.push({ file: 'src/authRoutes.js', error: e.message });
    console.error('Error cargando authRoutes:', e);
}

app.use('/', express.static(path.join(__dirname, 'api-page')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Settings
let settings = { apiSettings: { creator: 'Star API' } };
try {
    const settingsPath = path.join(__dirname, 'src', 'settings.json');
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
} catch (e) {
    loadErrors.push({ file: 'src/settings.json', error: e.message });
    console.error('Error cargando settings.json:', e);
}

app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && typeof data === 'object') {
            const responseData = {
                status: data.status,
                creator: (settings.apiSettings && settings.apiSettings.creator) || "Star API",
                ...data
            };
            return originalJson.call(this, responseData);
        }
        return originalJson.call(this, data);
    };
    next();
});

// Api Routes (cada ruta se carga por separado: si una falla, las demás siguen)
let totalRoutes = 0;
const apiFolder = path.join(__dirname, 'src', 'api');

try {
    fs.readdirSync(apiFolder).forEach((subfolder) => {
        const subfolderPath = path.join(apiFolder, subfolder);
        if (!fs.statSync(subfolderPath).isDirectory()) return;

        fs.readdirSync(subfolderPath).forEach((file) => {
            if (path.extname(file) !== '.js') return;
            const filePath = path.join(subfolderPath, file);
            try {
                require(filePath)(app);
                totalRoutes++;
                console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Loaded Route: ${file} `));
            } catch (e) {
                loadErrors.push({ file: `src/api/${subfolder}/${file}`, error: e.message });
                console.error(`Error cargando ${subfolder}/${file}:`, e);
            }
        });
    });
} catch (e) {
    loadErrors.push({ file: 'src/api', error: e.message });
    console.error('Error leyendo src/api:', e);
}

console.log(chalk.bgHex('#90EE90').hex('#333').bold(' Load Complete! ✓ '));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Total Routes Loaded: ${totalRoutes} `));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'api-page', 'index.html'));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'api-page', '404.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(path.join(__dirname, 'api-page', '500.html'));
});

// Solo escucha en local; en Vercel se exporta la app
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Server is running on port ${PORT} `));
    });
}

module.exports = app;
