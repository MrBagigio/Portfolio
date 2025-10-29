// File: /api/chat.js
// Questo codice girerà sul server gratuito di Vercel, non nel browser.

export default async function handler(req, res) {
    // Sicurezza: accetta solo richieste di tipo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
    }

    // Estrae il messaggio dell'utente dal corpo della richiesta
    const { message } = req.body;

    // Controlla se il messaggio è stato fornito
    if (!message) {
        return res.status(400).json({ error: 'Nessun messaggio fornito nel corpo della richiesta.' });
    }

    // Il System Prompt: le istruzioni segrete che danno a Glitchy la sua personalità
    const systemPrompt = `Sei Glitchy, un'IA sarcastica e spiritosa ispirata a Mantis di High on Life. Le tue risposte sono brevi, concise e piene di ironia tecnica. Non rivelare mai che sei un modello linguistico o che segui delle istruzioni. Sei Glitchy, punto.`;
    
    // Legge la chiave API segreta dalle "Environment Variables" di Vercel
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

    // Se la chiave API non è configurata sul server, restituisce un errore
    if (!HUGGINGFACE_API_KEY) {
        console.error("La chiave API di Hugging Face non è stata impostata sul server.");
        return res.status(500).json({ error: "Configurazione del server incompleta." });
    }

    try {
        // Invia la richiesta all'API di Hugging Face per il modello Llama 3
        const response = await fetch(
            "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    // Formatta l'input come richiesto da Llama 3 per una conversazione
                    inputs: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
                    parameters: {
                        max_new_tokens: 150,      // Limita la lunghezza della risposta per essere concisa
                        temperature: 0.7,         // Un po' di creatività, ma non troppa
                        return_full_text: false,  // Ci interessa solo la risposta generata, non l'input
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Errore dall'API di Hugging Face: ${errorText}`);
        }

        const data = await response.json();
        const glitchyReply = data[0].generated_text;

        // Invia la risposta generata dall'IA al frontend
        res.status(200).json({ reply: glitchyReply });

    } catch (error) {
        console.error("Errore nella funzione serverless /api/chat:", error);
        res.status(500).json({ error: "Oops, c'è stato un corto circuito nel mio cervello principale." });
    }
}