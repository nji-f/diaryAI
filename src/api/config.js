// API Configuration
export const API_CONFIG = {
    // Hugging Face Configuration
    HUGGINGFACE: {
        BASE_URL: 'https://api-inference.huggingface.co/models',
        TOKEN: '', // Will be loaded from localStorage
        MODELS: {
            SENTIMENT: 'finiteautomata/bertweet-base-sentiment-analysis',
            TEXT_GEN: 'gpt2',
            SUMMARIZATION: 'facebook/bart-large-cnn',
            ZERO_SHOT: 'facebook/bart-large-mnli',
            TRANSLATION: 'Helsinki-NLP/opus-mt-en-id'
        },
        HEADERS: {
            'Content-Type': 'application/json'
        }
    },
    
    // Fallback responses for when API fails
    FALLBACK_RESPONSES: {
        GREETINGS: [
            "Halo! Saya AI Assistant DiaryAI. Bagaimana hari Anda?",
            "Hai! Siap membantu Anda dengan catatan dan diary.",
            "Selamat datang! Ada yang bisa saya bantu hari ini?"
        ],
        SUGGESTIONS: [
            "Coba tulis tentang sesuatu yang membuat Anda tersenyum hari ini.",
            "Bagaimana perasaan Anda tentang minggu ini?",
            "Apa yang paling Anda syukuri hari ini?",
            "Coba buat daftar target untuk besok!",
            "Tuliskan 3 hal baik yang terjadi hari ini."
        ],
        MOOD_ANALYSIS: {
            HAPPY: ["senang", "bahagia", "gembira", "yes", "bagus", "hebat"],
            SAD: ["sedih", "kecewa", "marah", "capek", "lelah", "buruk"],
            EXCITED: ["seru", "asyik", "wow", "keren", "mantap"],
            ANXIOUS: ["cemas", "khawatir", "takut", "nervous", "stress"]
        }
    },
    
    // Rate limiting
    RATE_LIMIT: {
        MAX_REQUESTS_PER_HOUR: 30,
        COOLDOWN_MS: 1000
    }
};

// Default settings
export const DEFAULT_SETTINGS = {
    userName: 'User',
    theme: 'light',
    autoSave: 10000,
    defaultNoteColor: '#ffeb3b',
    aiProvider: 'huggingface',
    enableMoodAnalysis: true,
    enableAISuggestions: true,
    enableAutoTags: false,
    enableVoiceInput: true
};

// Storage keys
export const STORAGE_KEYS = {
    NOTES: 'diaryAI_notes',
    DIARY: 'diaryAI_diary',
    SETTINGS: 'diaryAI_settings',
    API_KEYS: 'diaryAI_apiKeys',
    USAGE: 'diaryAI_usage',
    THEME: 'diaryAI_theme'
};
