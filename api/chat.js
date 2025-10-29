// File: /api/chat.js
// Versione blindata e semplificata

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito.' });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Nessun messaggio fornito.' });
    }

    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
    if (!HUGGINGFACE_API_KEY) {
        return res.status(500).json({ error: "Configurazione del server incompleta." });
    }

    // Il System Prompt per la personalità
    const systemPrompt = `Sei Glitchy, un'IA sarcastica e spiritosa. Le tue risposte sono brevi e ironiche.`;

    try {
        const response = await fetch(
            // MODELLO ULTRA-AFFIDABILE E PUBBLICO
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    // Formattazione specifica per i modelli Mistral
                    inputs: `<s>[INST] ${systemPrompt} [/INST]</s>[INST] ${message} [/INST]`,
                    parameters: {
                        max_new_tokens: 150,
                        temperature: 0.7,
                        return_full_text: false,
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            // Restituiamo l'errore esatto da Hugging Face per un debug migliore
            throw new Error(`Hugging Face API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const glitchyReply = data[0].generated_text;

        res.status(200).json({ reply: glitchyReply });

    } catch (error) {
        console.error("Errore nella funzione serverless /api/chat:", error.message);
        res.status(500).json({ error: "Oops, c'è stato un corto circuito nel mio cervello principale." });
    }
}