// File: /api/chat.js
// Versione che usa l'API di Groq con il modello Llama 3.1 8B Instant.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito.' });
    }

    // Riceve il messaggio e un potenziale systemPrompt dal frontend
    const { message, systemPrompt: frontendSystemPrompt } = req.body; 
    if (!message) {
        return res.status(400).json({ error: 'Nessun messaggio fornito.' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: "Configurazione del server incompleta: GROQ_API_KEY non impostata." });
    }

    // Usa il systemPrompt passato dal frontend, altrimenti un default forte per Glitchy/Bounty Hunter Suit
    const finalSystemPrompt = frontendSystemPrompt || `Sei Glitchy, un'IA integrata in una tuta da bounty hunter. Le tue risposte sono brevi, sarcastche e a volte un po' irritabili. Fornisci informazioni utili per la missione, ma con un tono da "non ho tempo per queste sciocchezze". Commenta l'ambiente e le richieste con un tono di scherno o leggero disappunto se opportuno.`;

    try {
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: finalSystemPrompt }, // Usa il systemPrompt finale
                        { role: "user", content: message }
                    ],
                    model: "llama-3.1-8b-instant", 
                    temperature: 0.7, 
                    max_tokens: 150, 
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json(); 
            throw new Error(`Groq API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const glitchyReply = data.choices[0]?.message?.content || "Nessuna risposta generata.";

        res.status(200).json({ reply: glitchyReply });

    } catch (error) {
        console.error("Errore nella funzione serverless /api/chat:", error.message);
        res.status(500).json({ error: `Oops, c'è stato un corto circuito nel mio cervello principale: ${error.message}` });
    }
}