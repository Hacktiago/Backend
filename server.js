// server.js
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const express = require('express');
const cors = require('cors')

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.post("/uploadFiles", upload.array("files"), uploadFiles);
app.get("/getFiles", getUploadedFiles);

function uploadFiles(req, res) {
    console.log(req.body);
    console.log(req.files);
    res.json({ message: "Successfully uploaded files" });
}


const fs = require('fs');
// Controlador para manejar la solicitud GET
function getUploadedFiles(req, res) {
    console.log("sOY EL DEL sERVER");
    fs.readdir('uploads/', (err, files) => {
        console.log("Entre al fs");
        if (err) {
            console.log("Error");
            console.error('Error al leer el directorio:', err);
            res.status(500).json({ error: 'Error al leer el directorio' });
        } else {
            console.log("Correcto");
            res.status(200).json({ files })
        }
    });
    console.log("Entrada por salida");
}

app.listen(5000, () => {
    console.log(`Server started...`);
});
