// File: /api/chat.js
// Versione che usa l'API di Groq con il modello Llama 3.1 8B Instant.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito.' });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Nessun messaggio fornito.' });
    }

    // *** CAMBIATO: Usa la variabile d'ambiente per la tua API Key di Groq ***
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: "Configurazione del server incompleta: GROQ_API_KEY non impostata." });
    }

    const systemPrompt = `Sei Glitchy, un'IA sarcastica e spiritosa. Le tue risposte sono brevi e ironiche.`;

    try {
        const response = await fetch(
            // *** CAMBIATO: URL dell'API di Groq ***
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    // *** CAMBIATO: Usa la variabile GROQ_API_KEY ***
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                // *** CAMBIATO: Payload nel formato Groq/OpenAI Chat Completions ***
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message }
                    ],
                    // *** CAMBIATO: Nome del modello Groq per Llama 3.1 8B Instant ***
                    model: "llama-3.1-8b-instant", 
                    temperature: 0.7,
                    max_tokens: 150, // *** CAMBIATO: max_new_tokens diventa max_tokens per Groq ***
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json(); // Groq spesso restituisce errori in JSON
            throw new Error(`Groq API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        // *** CAMBIATO: Estrazione della risposta per il formato Groq/OpenAI ***
        const glitchyReply = data.choices[0]?.message?.content || "Nessuna risposta generata.";

        res.status(200).json({ reply: glitchyReply });

    } catch (error) {
        console.error("Errore nella funzione serverless /api/chat:", error.message);
        res.status(500).json({ error: `Oops, c'è stato un corto circuito nel mio cervello principale: ${error.message}` });
    }
}