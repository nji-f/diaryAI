// Konfigurasi API
const API_BASE_URL = '/api';

// State aplikasi
let currentMood = 'baik';
let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
let settings = JSON.parse(localStorage.getItem('diarySettings')) || {
    enableAI: true,
    aiTone: 'friendly',
    dailyReminder: true,
    reminderTime: '20:00'
};

// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Set tanggal sekarang
    document.getElementById('currentDate').textContent = formatDate(new Date());
    
    // Load data
    updateStats();
    loadEntries();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load theme
    loadTheme();
    
    // Setup AI jika diaktifkan
    if (settings.enableAI) {
        updateAIInsights();
    }
}

function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });
    
    // Mood selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => selectMood(btn.dataset.mood));
    });
    
    // Diary actions
    document.getElementById('diaryContent').addEventListener('input', updateWordCount);
    document.getElementById('saveBtn').addEventListener('click', saveDiary);
    document.getElementById('aiSuggestBtn').addEventListener('click', getAISuggestions);
    document.getElementById('applySuggestion').addEventListener('click', applySuggestion);
    
    // Settings
    document.getElementById('enableAI').addEventListener('change', updateSettings);
    document.getElementById('aiTone').addEventListener('change', updateSettings);
    document.getElementById('dailyReminder').addEventListener('change', updateSettings);
    document.getElementById('reminderTime').addEventListener('change', updateSettings);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('clearData').addEventListener('click', clearData);
    
    // Insights
    document.getElementById('refreshInsights').addEventListener('click', updateAIInsights);
    
    // Search
    document.getElementById('searchEntries').addEventListener('input', searchEntries);
}

// Fungsi Utilitas
function formatDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const icon = document.querySelector('#themeToggle i');
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = document.querySelector('#themeToggle i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Navigation
function switchPage(page) {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(`${page}Page`).classList.add('active');
}

// Diary Functions
function selectMood(mood) {
    currentMood = mood;
    
    // Update UI
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.mood === mood);
    });
}

function updateWordCount() {
    const content = document.getElementById('diaryContent').value;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    document.getElementById('wordCount').textContent = words;
}

async function saveDiary() {
    const title = document.getElementById('diaryTitle').value.trim();
    const content = document.getElementById('diaryContent').value.trim();
    
    if (!title || !content) {
        showToast('Judul dan konten tidak boleh kosong', 'error');
        return;
    }
    
    const entry = {
        id: Date.now(),
        title,
        content,
        mood: currentMood,
        date: new Date().toISOString(),
        wordCount: content.split(/\s+/).length
    };
    
    entries.unshift(entry);
    localStorage.setItem('diaryEntries', JSON.stringify(entries));
    
    // Clear form
    document.getElementById('diaryTitle').value = '';
    document.getElementById('diaryContent').value = '';
    updateWordCount();
    
    // Update UI
    updateStats();
    loadEntries();
    
    showToast('Diary berhasil disimpan!', 'success');
    
    // Update AI insights jika diaktifkan
    if (settings.enableAI) {
        updateAIInsights();
    }
}

// AI Functions
async function getAISuggestions() {
    const content = document.getElementById('diaryContent').value.trim();
    
    if (!content) {
        showToast('Tulis sesuatu dulu untuk mendapatkan saran AI', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: content,
                tone: settings.aiTone,
                action: 'suggest'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get AI suggestions');
        }
        
        const data = await response.json();
        
        document.getElementById('suggestionContent').textContent = data.suggestion;
        document.getElementById('aiSuggestions').classList.remove('hidden');
        
    } catch (error) {
        console.error('AI Error:', error);
        showToast('Gagal mendapatkan saran AI', 'error');
    } finally {
        showLoading(false);
    }
}

async function updateAIInsights() {
    if (!settings.enableAI || entries.length === 0) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                entries: entries.slice(0, 10), // Ambil 10 entri terbaru
                tone: settings.aiTone,
                action: 'insights'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update insight cards
            document.getElementById('moodAnalysis').textContent = data.moodAnalysis || 'Analisis mood akan muncul di sini...';
            document.getElementById('writingPattern').textContent = data.writingPattern || 'Pola menulis akan dianalisis...';
            document.getElementById('aiRecommendation').textContent = data.recommendation || 'Rekomendasi personal akan diberikan...';
        }
        
    } catch (error) {
        console.error('AI Insights Error:', error);
    } finally {
        showLoading(false);
    }
}

function applySuggestion() {
    const suggestion = document.getElementById('suggestionContent').textContent;
    const currentContent = document.getElementById('diaryContent').value;
    
    document.getElementById('diaryContent').value = currentContent + '\n\n' + suggestion;
    updateWordCount();
    document.getElementById('aiSuggestions').classList.add('hidden');
    
    showToast('Saran AI berhasil diterapkan!');
}

// Entries Management
function loadEntries() {
    const entriesList = document.getElementById('entriesList');
    
    if (entries.length === 0) {
        entriesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>Belum ada diary yang disimpan</p>
            </div>
        `;
        return;
    }
    
    entriesList.innerHTML = entries.map(entry => `
        <div class="entry-card">
            <div class="entry-header">
                <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
                <span class="entry-date">${new Date(entry.date).toLocaleDateString('id-ID')}</span>
            </div>
            <div class="entry-content">${escapeHtml(entry.content.substring(0, 200))}...</div>
            <div class="entry-actions">
                <button class="btn small secondary" onclick="viewEntry(${entry.id})">
                    <i class="fas fa-eye"></i> Baca
                </button>
                <button class="btn small danger" onclick="deleteEntry(${entry.id})">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        </div>
    `).join('');
}

function searchEntries() {
    const searchTerm = document.getElementById('searchEntries').value.toLowerCase();
    const filteredEntries = entries.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm) || 
        entry.content.toLowerCase().includes(searchTerm)
    );
    
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = filteredEntries.map(entry => `
        <div class="entry-card">
            <div class="entry-header">
                <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
                <span class="entry-date">${new Date(entry.date).toLocaleDateString('id-ID')}</span>
            </div>
            <div class="entry-content">${escapeHtml(entry.content.substring(0, 200))}...</div>
        </div>
    `).join('');
}

function viewEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    // Tampilkan di modal atau page khusus
    alert(`Judul: ${entry.title}\n\n${entry.content}`);
}

function deleteEntry(id) {
    if (confirm('Apakah Anda yakin ingin menghapus diary ini?')) {
        entries = entries.filter(entry => entry.id !== id);
        localStorage.setItem('diaryEntries', JSON.stringify(entries));
        loadEntries();
        updateStats();
        showToast('Diary berhasil dihapus');
    }
}

// Settings Functions
function updateSettings() {
    settings = {
        enableAI: document.getElementById('enableAI').checked,
        aiTone: document.getElementById('aiTone').value,
        dailyReminder: document.getElementById('dailyReminder').checked,
        reminderTime: document.getElementById('reminderTime').value
    };
    
    localStorage.setItem('diarySettings', JSON.stringify(settings));
    showToast('Pengaturan berhasil disimpan');
}

function exportData() {
    const data = {
        entries: entries,
        settings: settings,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary-ai-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data berhasil diekspor');
}

function clearData() {
    if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan!')) {
        localStorage.clear();
        entries = [];
        settings = {
            enableAI: true,
            aiTone: 'friendly',
            dailyReminder: true,
            reminderTime: '20:00'
        };
        
        updateStats();
        loadEntries();
        showToast('Semua data berhasil dihapus');
    }
}

// Stats
function updateStats() {
    document.getElementById('totalEntries').textContent = entries.length;
    
    const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
    document.getElementById('totalWords').textContent = totalWords;
    
    const moods = entries.filter(e => e.mood).map(e => e.mood);
    const moodEmoji = moods.length > 0 ? getAverageMoodEmoji(moods) : '😊';
    document.getElementById('avgMood').textContent = moodEmoji;
}

function getAverageMoodEmoji(moods) {
    const moodValues = {
        'sangat-baik': 5,
        'baik': 4,
        'biasa': 3,
        'kurang': 2,
        'buruk': 1
    };
    
    const average = moods.reduce((sum, mood) => sum + (moodValues[mood] || 3), 0) / moods.length;
    
    if (average >= 4.5) return '😄';
    if (average >= 3.5) return '😊';
    if (average >= 2.5) return '😐';
    if (average >= 1.5) return '😔';
    return '😢';
}

// Security
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
