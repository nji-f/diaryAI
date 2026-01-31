import { OpenAI } from 'openai';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { content, entries, tone = 'friendly', action = 'suggest' } = req.body;

        // API Key dari environment variable
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            console.error('OPENAI_API_KEY is not set');
            return res.status(500).json({ 
                error: 'Server configuration error',
                suggestion: 'Tulis dengan gaya kamu sendiri! Kamu bisa ceritakan: 1. Apa yang membuat hari ini spesial? 2. Bagaimana perasaanmu? 3. Apa yang kamu pelajari hari ini?'
            });
        }

        const openai = new OpenAI({
            apiKey: apiKey
        });

        let prompt;
        
        if (action === 'suggest' && content) {
            // Prompt untuk saran perbaikan
            const toneMap = {
                friendly: 'ramah dan supportif',
                professional: 'profesional dan terstruktur',
                casual: 'santai dan akrab'
            };

            prompt = `Kamu adalah asisten AI untuk penulisan diary. Berikan saran untuk memperbaiki atau mengembangkan tulisan diary berikut dengan tone ${toneMap[tone] || 'ramah'}:

"${content}"

Saran (maksimal 100 kata):`;

        } else if (action === 'insights' && entries && entries.length > 0) {
            // Prompt untuk analisis insights
            const recentEntries = entries.slice(0, 10);
            const entryTexts = recentEntries.map((e, i) => 
                `Entry ${i + 1} (${new Date(e.date).toLocaleDateString('id-ID')}):
                Judul: ${e.title}
                Mood: ${e.mood}
                Konten: ${e.content.substring(0, 200)}...`
            ).join('\n\n');

            prompt = `Analisis pola dari diary berikut dan berikan insight:

${entryTexts}

Berikan analisis singkat dalam format JSON:
1. moodAnalysis: analisis pola mood (maks 50 kata)
2. writingPattern: pola menulis yang terlihat (maks 50 kata)
3. recommendation: saran untuk penulis (maks 50 kata)

Format JSON:`;

        } else {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Kamu adalah asisten AI yang membantu menulis diary. Gunakan bahasa Indonesia yang natural dan mudah dipahami."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 300,
            temperature: 0.7
        });

        const responseText = completion.choices[0].message.content;

        if (action === 'insights') {
            try {
                // Coba parse JSON response
                const jsonMatch = responseText.match(/\{.*\}/s);
                if (jsonMatch) {
                    const insights = JSON.parse(jsonMatch[0]);
                    return res.status(200).json(insights);
                } else {
                    // Fallback jika bukan JSON
                    return res.status(200).json({
                        moodAnalysis: responseText,
                        writingPattern: "AI memberikan analisis umum",
                        recommendation: "Teruslah menulis diary secara rutin!"
                    });
                }
            } catch (e) {
                console.error('JSON parse error:', e);
                return res.status(200).json({
                    moodAnalysis: "Analisis pola mood dari tulisanmu",
                    writingPattern: "Pola menulismu unik dan personal",
                    recommendation: "Pertahankan kebiasaan menulis diary, itu baik untuk kesehatan mental!"
                });
            }
        } else {
            return res.status(200).json({
                suggestion: responseText
            });
        }

    } catch (error) {
        console.error('AI API Error:', error);
        
        // Fallback responses jika API error
        const fallbackSuggestions = [
            "Coba tulis tentang perasaanmu saat ini. Apa yang membuatmu merasa begitu?",
            "Jelaskan detail dari kejadian hari ini. Apa warna, suara, atau aroma yang kamu ingat?",
            "Bagaimana hari ini mempengaruhi rencanamu untuk besok?",
            "Apa satu hal yang kamu syukuri hari ini?",
            "Jika bisa mengulangi satu momen hari ini, momen apa yang akan kamu ulangi?"
        ];
        
        const fallbackInsights = {
            moodAnalysis: "Dari tulisanmu, terlihat kamu sedang menjalani hari dengan penuh makna.",
            writingPattern: "Kamu memiliki gaya menulis yang jujur dan reflektif.",
            recommendation: "Teruslah menulis! Diary adalah teman terbaik untuk merefleksikan hidup."
        };
        
        return res.status(200).json(
            action === 'insights' 
                ? fallbackInsights 
                : { suggestion: fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)] }
        );
    }
}
