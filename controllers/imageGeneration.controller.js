// proyecto/backend/controllers/imageGeneration.controller.js
const { OpenAI } = require('openai');

// Inicializa el cliente de OpenAI con tu API Key desde las variables de entorno
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

exports.generateImage = async (req, res) => {
    try {
        const { prompt } = req.body;

        // ***** AQUÍ ES DONDE DEBES AGREGAR ESTAS LÍNEAS *****
        console.log('Prompt recibido del frontend:', prompt);
        console.log('Longitud del prompt:', prompt ? prompt.length : 0);
        // ***************************************************

        if (!prompt) {
            return res.status(400).json({ mensaje: 'El prompt es requerido para generar la imagen.' });
        }

        // Llamada a la API de DALL-E
        const response = await openai.images.generate({
            model: "dall-e-2", // Puedes probar con "dall-e-3" si tienes acceso y quieres mayor calidad (considera el costo)
            prompt: prompt,
            n: 1, // Generar una sola imagen
            size: "512x512", // Tamaño de la imagen (otras opciones: "256x256", "1024x1024")
            response_format: "url", // Queremos que la respuesta incluya una URL a la imagen
        });

        const imageUrl = response.data[0].url; // La URL de la imagen generada

        res.status(200).json({ imageUrl: imageUrl, mensaje: 'Imagen generada exitosamente.' });

    } catch (error) {
        console.error('Error al generar imagen con DALL-E:', error.response ? error.response.data : error.message);
        let errorMessage = 'Error al generar la imagen.';
        if (error.response) {
            if (error.response.status === 401) {
                errorMessage = 'Error de autenticación con OpenAI. Verifica tu API Key.';
            } else if (error.response.status === 429) {
                errorMessage = 'Has excedido tu cuota de OpenAI. Por favor, verifica tu plan.';
            } else if (error.response.data && error.response.data.error) {
                errorMessage = `Error de OpenAI: ${error.response.data.error.message}`;
            }
        }
        res.status(500).json({ mensaje: errorMessage });
    }
};