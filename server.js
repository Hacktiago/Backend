const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/images/' }); // Carpeta para las imágenes
const app = express();
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Middleware para parsear el cuerpo de la solicitud
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Función para limpiar el nombre de la placa
const cleanLicensePlate = (licensePlate) => {
  return licensePlate.replace(/[^a-zA-Z0-9]/g, ''); // Elimina cualquier carácter no alfanumérico
};

// Endpoint para registrar el ingreso a un parqueadero
app.post('/cars', upload.single('photo'), (req, res) => {
    console.log("Solicitud de POST recibida")
    console.log("Request: ")
    console.log(req.body)
  try {
    const { license_plate, color } = req.body;
    const cleanedLicensePlate = cleanLicensePlate(license_plate); // Limpiar el nombre de la placa
    const photoPath = req.file ? req.file.path : null;
    const currentTime = new Date();

    // Guardar la información del carro en un archivo JSON en una carpeta separada
    const carInfo = { license_plate, color, photoPath, currentTime };
    const carInfoFilePath = path.join('uploads/descriptions/', cleanedLicensePlate + '.json');
    fs.writeFileSync(carInfoFilePath, JSON.stringify(carInfo, null, 2));

    res.json({ message: 'Registro exitoso', ...carInfo });
  } catch (error) {
    console.error('Error en la ruta /cars:', error);
    res.status(500).json({ error: 'Error en el servidor', message: error.message });
  }
});

// Endpoint para listar los vehículos registrados
app.get('/cars', async (req, res) => {
    console.log("Solicitud de GET recibida")
    try {
      const carDescriptionsDirectory = 'uploads/descriptions/';
  
      const files = await fs.promises.readdir(carDescriptionsDirectory);
  
      const carDescriptions = await Promise.all(files.map(async (file) => {
        const filePath = path.join(carDescriptionsDirectory, file);
        
        // Utilizamos readFileSync para leer el archivo de forma síncrona
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const carInfo = JSON.parse(rawData);
  
        // Combinamos la información con la ruta de la imagen
        return {
          ...carInfo,
          photoPath: path.join('uploads/images/', path.basename(carInfo.photoPath))
        };
      }));
      res.json(carDescriptions);
    } catch (error) {
      console.error('Error en la ruta /cars:', error);
      res.status(500).json({ error: 'Error en el servidor', message: error.message });
    }
  });

// Endpoint para retirar un carro usando la placa
app.patch('/cars', (req, res) => {
    console.log('Solicitud de patch recibida');
    console.log("Request: ")
    console.log(req.body)
    try {
      const { license_plate } = req.body;
  
      // Verificar si la placa está presente en la solicitud
      if (!license_plate) {
        return res.status(400).json({ error: 'Se requiere la placa en el cuerpo de la solicitud.' });
      }
  
      const cleanedLicensePlate = cleanLicensePlate(license_plate); // Limpiar el nombre de la placa
  
      const carDescriptionsDirectory = 'uploads/descriptions/';
      const carDescriptionsPath = path.join(carDescriptionsDirectory, `${cleanedLicensePlate}.json`);
  
      // Verificar si el archivo de descripción del carro existe de forma síncrona
      if (!fs.existsSync(carDescriptionsPath)) {
        return res.status(404).json({ error: 'No se encontró información para la placa proporcionada.' });
      }
  
      // Leer el archivo de descripción del carro para obtener la ruta de la imagen
      const rawData = fs.readFileSync(carDescriptionsPath, 'utf-8');
      const carInfo = JSON.parse(rawData);
      const photoPath = carInfo.photoPath;
  
      // Eliminar el archivo de descripción del carro de forma síncrona
      fs.unlinkSync(carDescriptionsPath);
  
      // Verificar si la ruta de la imagen existe y eliminarla de forma síncrona
      if (photoPath && fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
  
      res.json({ message: `Carro con placa ${cleanedLicensePlate} retirado exitosamente.` });
    } catch (error) {
      console.error('Error en la ruta PATCH /cars:', error);
      res.status(500).json({ error: 'Error en el servidor', message: error.message });
    }
  });

// Iniciar el servidor en el puerto 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
