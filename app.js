// Main Application
class DiaryAI {
    constructor() {
        this.notes = [];
        this.diaryEntries = [];
        this.settings = {};
        this.currentNote = null;
        this.aiService = null;
        this.charts = {};
        
        this.init();
    }
    
    async init() {
        this.loadData();
        this.initUI();
        this.initAI();
        this.initEventListeners();
        this.initCharts();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
            }, 500);
        }, 1000);
        
        this.updateDashboard();
    }
    
    loadData() {
        // Load notes
        const savedNotes = localStorage.getItem('diaryAI_notes');
        this.notes = savedNotes ? JSON.parse(savedNotes) : [];
        
        // Load diary entries
        const savedDiary = localStorage.getItem('diaryAI_diary');
        this.diaryEntries = savedDiary ? JSON.parse(savedDiary) : [];
        
        // Load settings
        const savedSettings = localStorage.getItem('diaryAI_settings');
        this.settings = savedSettings ? JSON.parse(savedSettings) : {
            userName: 'User',
            theme: 'light',
            autoSave: 10000,
            defaultNoteColor: '#ffeb3b',
            aiProvider: 'huggingface',
            hfApiKey: '',
            enableMoodAnalysis: true,
            enableAISuggestions: true,
            enableAutoTags: false
        };
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        document.getElementById('themeToggle').checked = this.settings.theme === 'dark';
        
        // Set user name
        document.getElementById('greetingName').textContent = this.settings.userName;
    }
    
    saveData() {
        localStorage.setItem('diaryAI_notes', JSON.stringify(this.notes));
        localStorage.setItem('diaryAI_diary', JSON.stringify(this.diaryEntries));
        localStorage.setItem('diaryAI_settings', JSON.stringify(this.settings));
    }
    
    initUI() {
        // Update date time
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000);
        
        // Render notes
        this.renderNotes();
        
        // Update stats
        this.updateStats();
    }
    
    initAI() {
        // Initialize AI service
        this.aiService = new AIService();
        
        // Load AI settings
        const apiKeys = JSON.parse(localStorage.getItem('diaryAI_apiKeys')) || {};
        const provider = localStorage.getItem('diaryAI_apiProvider') || 'huggingface';
        
        this.aiService.setConfig({
            provider: provider,
            huggingface: {
                token: apiKeys.huggingface || ''
            }
        });
        
        // Test connection
        this.testAIConnection();
    }
    
    initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.navigateTo(e.target.dataset.page));
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('change', (e) => {
            this.settings.theme = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', this.settings.theme);
            this.saveData();
        });
        
        // New note button
        document.getElementById('newNoteBtn').addEventListener('click', () => this.createNewNote());
        
        // AI assistant button
        document.getElementById('aiAssistantBtn').addEventListener('click', () => this.openAIAssistant());
        
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        
        // Voice input
        document.getElementById('voiceInputBtn').addEventListener('click', () => this.startVoiceInput());
        
        // Global search
        document.getElementById('globalSearch').addEventListener('input', (e) => this.searchNotes(e.target.value));
        
        // AI search button
        document.getElementById('aiSearchBtn').addEventListener('click', () => this.openAISearch());
        
        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // Quick actions in AI modal
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAction(e.target.dataset.action));
        });
        
        // Send AI message
        document.getElementById('sendAIMessage').addEventListener('click', () => this.sendAIMessage());
        
        // Enter key in AI input
        document.getElementById('aiMessageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendAIMessage();
            }
        });
        
        // Save settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        
        // Test API button
        document.getElementById('testApiBtn').addEventListener('click', () => this.testAPI());
        
        // Export all data
        document.getElementById('exportAllBtn').addEventListener('click', () => this.exportAllData());
        
        // Import data
        document.getElementById('importDataBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N for new note
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNewNote();
            }
            
            // Ctrl/Cmd + K for AI assistant
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openAIAssistant();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    navigateTo(page) {
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === page) {
                btn.classList.add('active');
            }
        });
        
        // Show selected page
        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.classList.remove('active');
        });
        
        const pageId = `${page}Page`;
        if (page === 'dashboard') {
            this.updateDashboard();
        } else if (page === 'insights') {
            this.updateInsights();
        }
        
        document.getElementById(pageId)?.classList.add('active');
    }
    
    updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('currentDateTime').textContent = 
            now.toLocaleDateString('id-ID', options);
    }
    
    updateDashboard() {
        // Update stats
        document.getElementById('totalNotes').textContent = this.notes.length;
        document.getElementById('totalDiary').textContent = this.diaryEntries.length;
        
        // Get AI usage
        const usage = JSON.parse(localStorage.getItem('diaryAI_usage')) || { totalRequests: 0 };
        document.getElementById('aiRequests').textContent = usage.totalRequests || 0;
        
        // Calculate average mood
        const moods = this.notes.filter(n => n.mood).map(n => n.mood);
        if (moods.length > 0) {
            const moodCount = {};
            moods.forEach(mood => {
                moodCount[mood] = (moodCount[mood] || 0) + 1;
            });
            const mostCommon = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0][0];
            document.getElementById('avgMood').textContent = this.getMoodEmoji(mostCommon);
        }
        
        // Show recent notes
        this.showRecentNotes();
        
        // Load AI suggestions
        this.loadAISuggestions();
    }
    
    updateStats() {
        // Update backup stats in settings
        document.getElementById('backupNotesCount').textContent = this.notes.length;
        document.getElementById('backupDiaryCount').textContent = this.diaryEntries.length;
        
        // Calculate total size
        const totalSize = JSON.stringify(this.notes).length + JSON.stringify(this.diaryEntries).length;
        document.getElementById('backupSize').textContent = Math.round(totalSize / 1024) + ' KB';
    }
    
    showRecentNotes() {
        const recentNotesGrid = document.getElementById('recentNotes');
        const recentNotes = this.notes.slice(0, 4);
        
        if (recentNotes.length === 0) {
            recentNotesGrid.innerHTML = `
                <div class="empty-state">
                    <p>No notes yet. Create your first note!</p>
                </div>
            `;
            return;
        }
        
        recentNotesGrid.innerHTML = recentNotes.map(note => `
            <div class="recent-note" data-id="${note.id}">
                <div class="note-header">
                    <span class="note-date">${note.date}</span>
                </div>
                <div class="note-preview">${note.content.substring(0, 100)}...</div>
                ${note.mood ? `
                    <div class="note-mood">
                        ${this.getMoodEmoji(note.mood)} ${note.mood}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    async loadAISuggestions() {
        const suggestionsList = document.getElementById('suggestionsList');
        
        if (this.notes.length === 0) {
            suggestionsList.innerHTML = `
                <div class="suggestion-item">
                    <i class="fas fa-lightbulb"></i>
                    <span>Start writing notes to get AI suggestions!</span>
                </div>
            `;
            return;
        }
        
        // Use AI service to get suggestions
        try {
            const recentText = this.notes.slice(0, 3).map(n => n.content).join(' ');
            const prompt = `Based on these recent notes: "${recentText.substring(0, 200)}...". Provide 3 writing suggestions for diary or notes. Return as a JSON array of strings.`;
            
            suggestionsList.innerHTML = `
                <div class="suggestion-item">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Getting AI suggestions...</span>
                </div>
            `;
            
            const response = await this.aiService.generateResponse(prompt);
            let suggestions = [];
            
            try {
                // Try to parse as JSON
                suggestions = JSON.parse(response);
            } catch {
                // If not JSON, split by lines
                suggestions = response.split('\n')
                    .filter(line => line.trim().length > 10)
                    .slice(0, 3)
                    .map(line => line.replace(/^\d+\.\s*/, '').trim());
            }
            
            if (suggestions.length === 0) {
                suggestions = [
                    "Write about something that made you smile today",
                    "Describe a challenge you overcame recently",
                    "What are you grateful for this week?"
                ];
            }
            
            suggestionsList.innerHTML = suggestions.map(suggestion => `
                <div class="suggestion-item">
                    <i class="fas fa-lightbulb"></i>
                    <span>${suggestion}</span>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            suggestionsList.innerHTML = `
                <div class="suggestion-item">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Could not load AI suggestions. Check your API key.</span>
                </div>
            `;
        }
    }
    
    renderNotes() {
        const notesGrid = document.getElementById('notesGrid');
        const emptyState = document.getElementById('emptyNotesState');
        
        if (this.notes.length === 0) {
            notesGrid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        notesGrid.innerHTML = this.notes.map(note => `
            <div class="note-card" data-id="${note.id}" style="--note-color: ${note.color}">
                <div class="note-header">
                    <span class="note-date">${note.date} • ${note.time}</span>
                    <div class="note-actions">
                        <button class="btn-icon edit-note" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-note" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="note-content">${note.content}</div>
                ${note.mood ? `
                    <div class="note-mood">
                        ${this.getMoodEmoji(note.mood)} ${note.mood}
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        // Add event listeners to notes
        document.querySelectorAll('.edit-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = e.target.closest('.note-card').dataset.id;
                this.editNote(noteId);
            });
        });
        
        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = e.target.closest('.note-card').dataset.id;
                this.deleteNote(noteId);
            });
        });
    }
    
    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            content: 'Start typing your note here...',
            color: this.settings.defaultNoteColor,
            date: new Date().toLocaleDateString('id-ID'),
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            mood: null,
            tags: [],
            favorite: false
        };
        
        this.notes.unshift(newNote);
        this.saveData();
        this.renderNotes();
        this.updateDashboard();
        this.showToast('New note created!', 'success');
        
        // Open editor
        setTimeout(() => this.editNote(newNote.id), 100);
    }
    
    editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        
        this.currentNote = note;
        
        // Populate editor
        document.getElementById('noteEditorText').value = note.content;
        
        // Set color
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === note.color) {
                option.classList.add('selected');
            }
        });
        
        // Set mood
        document.getElementById('currentMood').textContent = note.mood || 'Not analyzed';
        document.getElementById('moodEmoji').textContent = this.getMoodEmoji(note.mood);
        
        // Show modal
        document.getElementById('noteEditorModal').style.display = 'flex';
    }
    
    saveNote() {
        if (!this.currentNote) return;
        
        const content = document.getElementById('noteEditorText').value;
        if (!content.trim()) {
            this.showToast('Note cannot be empty!', 'error');
            return;
        }
        
        // Update note
        this.currentNote.content = content;
        this.currentNote.color = document.querySelector('.color-option.selected').dataset.color;
        this.currentNote.time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        // Auto analyze mood if enabled
        if (this.settings.enableMoodAnalysis && content.length > 10) {
            this.analyzeNoteMood(this.currentNote);
        }
        
        this.saveData();
        this.renderNotes();
        this.updateDashboard();
        this.closeAllModals();
        this.showToast('Note saved!', 'success');
    }
    
    async analyzeNoteMood(note) {
        try {
            const result = await this.aiService.analyzeSentiment(note.content);
            note.mood = result.mood;
            
            // Update UI if this is the current note
            if (note.id === this.currentNote?.id) {
                document.getElementById('currentMood').textContent = note.mood;
                document.getElementById('moodEmoji').textContent = this.getMoodEmoji(note.mood);
            }
            
            this.saveData();
            this.showToast(`Mood detected: ${note.mood}`, 'info');
            
        } catch (error) {
            console.error('Error analyzing mood:', error);
        }
    }
    
    deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) return;
        
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.saveData();
        this.renderNotes();
        this.updateDashboard();
        this.showToast('Note deleted', 'warning');
    }
    
    searchNotes(query) {
        if (!query.trim()) {
            this.renderNotes();
            return;
        }
        
        const filteredNotes = this.notes.filter(note => 
            note.content.toLowerCase().includes(query.toLowerCase()) ||
            note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        const notesGrid = document.getElementById('notesGrid');
        
        if (filteredNotes.length === 0) {
            notesGrid.innerHTML = `
                <div class="empty-state">
                    <p>No notes found for "${query}"</p>
                </div>
            `;
            return;
        }
        
        notesGrid.innerHTML = filteredNotes.map(note => `
            <div class="note-card" data-id="${note.id}">
                <div class="note-content">
                    ${note.content.replace(
                        new RegExp(query, 'gi'), 
                        match => `<mark>${match}</mark>`
                    )}
                </div>
            </div>
        `).join('');
    }
    
    async openAISearch() {
        const query = document.getElementById('globalSearch').value;
        if (!query.trim()) return;
        
        this.openAIAssistant();
        
        // Add user message
        this.addAIMessage(query, 'user');
        
        // Get AI response
        try {
            const response = await this.aiService.searchNotes(query, this.notes);
            this.addAIMessage(response, 'ai');
        } catch (error) {
            this.addAIMessage('Sorry, I could not process your search request.', 'ai');
        }
    }
    
    openAIAssistant() {
        document.getElementById('aiAssistantModal').style.display = 'flex';
        document.getElementById('aiMessageInput').focus();
    }
    
    async sendAIMessage() {
        const input = document.getElementById('aiMessageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addAIMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        this.showAITyping();
        
        try {
            // Get AI response
            const response = await this.aiService.generateResponse(message);
            this.removeAITyping();
            this.addAIMessage(response, 'ai');
            
        } catch (error) {
            this.removeAITyping();
            this.addAIMessage('Sorry, I encountered an error. Please check your API connection.', 'ai');
        }
    }
    
    addAIMessage(content, sender) {
        const conversation = document.getElementById('aiConversation');
        const messageClass = sender === 'user' ? 'user-message' : 'ai-message';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = messageClass;
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                <p>${content}</p>
                <span class="message-time">Just now</span>
            </div>
        `;
        
        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }
    
    showAITyping() {
        const conversation = document.getElementById('aiConversation');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'aiTyping';
        typingDiv.className = 'ai-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p class="typing-indicator">
                    <span></span><span></span><span></span>
                </p>
            </div>
        `;
        
        conversation.appendChild(typingDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }
    
    removeAITyping() {
        const typingDiv = document.getElementById('aiTyping');
        if (typingDiv) {
            typingDiv.remove();
        }
    }
    
    async handleQuickAction(action) {
        let prompt = '';
        
        switch(action) {
            case 'analyzeMood':
                if (this.notes.length === 0) {
                    this.addAIMessage('No notes to analyze. Create some notes first!', 'ai');
                    return;
                }
                prompt = 'Analyze the overall mood from all my notes and provide insights.';
                break;
                
            case 'summarize':
                if (this.notes.length === 0) {
                    this.addAIMessage('No notes to summarize.', 'ai');
                    return;
                }
                prompt = 'Summarize my recent notes and diary entries.';
                break;
                
            case 'suggestTopic':
                prompt = 'Suggest 3 interesting topics I could write about in my diary today.';
                break;
                
            case 'improveWriting':
                prompt = 'Give me tips to improve my writing style for diary entries.';
                break;
        }
        
        this.addAIMessage(prompt, 'user');
        this.showAITyping();
        
        try {
            const response = await this.aiService.generateResponse(prompt);
            this.removeAITyping();
            this.addAIMessage(response, 'ai');
        } catch (error) {
            this.removeAITyping();
            this.addAIMessage('Error processing request.', 'ai');
        }
    }
    
    async testAIConnection() {
        const statusText = document.getElementById('aiStatusText');
        
        try {
            statusText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing connection...';
            
            const isConnected = await this.aiService.testConnection();
            
            if (isConnected) {
                statusText.innerHTML = '<span class="status-indicator connected"></span> Connected to Hugging Face';
                this.showToast('AI connection successful!', 'success');
            } else {
                statusText.innerHTML = '<span class="status-indicator"></span> Using simulated AI';
                this.showToast('Using simulated AI mode', 'warning');
            }
        } catch (error) {
            statusText.innerHTML = '<span class="status-indicator"></span> Connection failed';
            this.showToast('AI connection failed', 'error');
        }
    }
    
    openSettings() {
        // Load current settings into form
        document.getElementById('userName').value = this.settings.userName;
        document.getElementById('autoSave').value = this.settings.autoSave;
        document.getElementById('aiProvider').value = this.settings.aiProvider;
        document.getElementById('hfApiKey').value = this.settings.hfApiKey;
        document.getElementById('enableMoodAnalysis').checked = this.settings.enableMoodAnalysis;
        document.getElementById('enableAISuggestions').checked = this.settings.enableAISuggestions;
        document.getElementById('enableAutoTags').checked = this.settings.enableAutoTags;
        
        // Set default color
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === this.settings.defaultNoteColor) {
                option.classList.add('selected');
            }
        });
        
        // Update stats
        this.updateStats();
        
        // Show modal
        document.getElementById('settingsModal').style.display = 'flex';
    }
    
    saveSettings() {
        // Save settings from form
        this.settings.userName = document.getElementById('userName').value || 'User';
        this.settings.autoSave = parseInt(document.getElementById('autoSave').value);
        this.settings.aiProvider = document.getElementById('aiProvider').value;
        this.settings.hfApiKey = document.getElementById('hfApiKey').value;
        this.settings.enableMoodAnalysis = document.getElementById('enableMoodAnalysis').checked;
        this.settings.enableAISuggestions = document.getElementById('enableAISuggestions').checked;
        this.settings.enableAutoTags = document.getElementById('enableAutoTags').checked;
        
        // Save default color
        const selectedColor = document.querySelector('.color-option.selected');
        if (selectedColor) {
            this.settings.defaultNoteColor = selectedColor.dataset.color;
        }
        
        // Update greeting
        document.getElementById('greetingName').textContent = this.settings.userName;
        
        // Save to localStorage
        this.saveData();
        
        // Update AI service
        const apiKeys = JSON.parse(localStorage.getItem('diaryAI_apiKeys')) || {};
        apiKeys.huggingface = this.settings.hfApiKey;
        localStorage.setItem('diaryAI_apiKeys', JSON.stringify(apiKeys));
        localStorage.setItem('diaryAI_apiProvider', this.settings.aiProvider);
        
        this.aiService.setConfig({
            provider: this.settings.aiProvider,
            huggingface: {
                token: this.settings.hfApiKey
            }
        });
        
        // Test connection
        this.testAIConnection();
        
        this.closeAllModals();
        this.showToast('Settings saved!', 'success');
    }
    
    async testAPI() {
        const apiKey = document.getElementById('hfApiKey').value;
        
        if (!apiKey) {
            this.showToast('Please enter API key first', 'error');
            return;
        }
        
        try {
            const tempService = new AIService();
            tempService.setConfig({
                provider: 'huggingface',
                huggingface: { token: apiKey }
            });
            
            const isConnected = await tempService.testConnection();
            
            if (isConnected) {
                this.showToast('API connection successful!', 'success');
            } else {
                this.showToast('API connection failed', 'error');
            }
        } catch (error) {
            this.showToast('Error testing API: ' + error.message, 'error');
        }
    }
    
    exportAllData() {
        const data = {
            notes: this.notes,
            diaryEntries: this.diaryEntries,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `diaryai_backup_${Date.now()}.json`;
        downloadLink.click();
        
        this.showToast('Data exported successfully!', 'success');
    }
    
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.notes) this.notes = data.notes;
                if (data.diaryEntries) this.diaryEntries = data.diaryEntries;
                if (data.settings) this.settings = data.settings;
                
                this.saveData();
                this.renderNotes();
                this.updateDashboard();
                this.updateStats();
                
                this.showToast('Data imported successfully!', 'success');
                
            } catch (error) {
                this.showToast('Error importing data: Invalid file format', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }
    
    startVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showToast('Speech recognition not supported in this browser', 'error');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'id-ID';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.start();
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            
            // Create note from voice input
            const newNote = {
                id: Date.now().toString(),
                content: transcript,
                color: this.settings.defaultNoteColor,
                date: new Date().toLocaleDateString('id-ID'),
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                mood: null,
                tags: ['voice'],
                favorite: false
            };
            
            this.notes.unshift(newNote);
            this.saveData();
            this.renderNotes();
            this.updateDashboard();
            
            this.showToast('Note created from voice input!', 'success');
        };
        
        recognition.onerror = (event) => {
            this.showToast('Voice recognition error: ' + event.error, 'error');
        };
    }
    
    initCharts() {
        // Initialize Chart.js charts
        const moodCtx = document.getElementById('moodChartCanvas')?.getContext('2d');
        if (moodCtx) {
            this.charts.mood = new Chart(moodCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Happy', 'Sad', 'Neutral', 'Excited', 'Anxious'],
                    datasets: [{
                        data: [12, 5, 8, 3, 2],
                        backgroundColor: [
                            '#4ade80',
                            '#f87171',
                            '#94a3b8',
                            '#fbbf24',
                            '#f472b6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
    
    updateInsights() {
        // Update mood chart
        if (this.charts.mood) {
            const moodCount = {
                happy: 0,
                sad: 0,
                neutral: 0,
                excited: 0,
                anxious: 0,
                angry: 0,
                grateful: 0
            };
            
            this.notes.forEach(note => {
                if (note.mood && moodCount.hasOwnProperty(note.mood)) {
                    moodCount[note.mood]++;
                }
            });
            
            this.charts.mood.data.datasets[0].data = [
                moodCount.happy,
                moodCount.sad,
                moodCount.neutral,
                moodCount.excited,
                moodCount.anxious
            ];
            this.charts.mood.update();
        }
        
        // Update mood summary
        const moodSummary = document.getElementById('moodSummary');
        const moods = this.notes.filter(n => n.mood).map(n => n.mood);
        
        if (moods.length > 0) {
            const moodCount = {};
            moods.forEach(mood => {
                moodCount[mood] = (moodCount[mood] || 0) + 1;
            });
            
            const total = moods.length;
            const summary = Object.entries(moodCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([mood, count]) => {
                    const percent = Math.round((count / total) * 100);
                    return `${this.getMoodEmoji(mood)} ${mood}: ${percent}%`;
                })
                .join(' • ');
            
            moodSummary.textContent = `Based on ${total} analyzed notes: ${summary}`;
        } else {
            moodSummary.textContent = 'No mood data available. Write more notes!';
        }
        
        // Update topics
        this.updateTopics();
        
        // Update AI recommendations
        this.updateAIRecommendations();
    }
    
    updateTopics() {
        const topicsContainer = document.getElementById('topicsContainer');
        
        // Simple topic extraction (in real app, use AI)
        const commonTopics = ['Work', 'Family', 'Friends', 'Health', 'Hobbies', 'Learning', 'Goals'];
        
        topicsContainer.innerHTML = commonTopics.map(topic => `
            <div class="topic-tag">
                <i class="fas fa-hashtag"></i>
                ${topic}
            </div>
        `).join('');
    }
    
    async updateAIRecommendations() {
        const recommendationsList = document.getElementById('aiRecommendations');
        
        try {
            const prompt = `Based on typical diary writing patterns, provide 3 recommendations to improve writing habits and get more insights from notes.`;
            
            const response = await this.aiService.generateResponse(prompt);
            let recommendations = [];
            
            try {
                recommendations = JSON.parse(response);
            } catch {
                recommendations = response.split('\n')
                    .filter(line => line.trim().length > 10)
                    .slice(0, 3)
                    .map(line => line.replace(/^\d+\.\s*/, '').trim());
            }
            
            if (recommendations.length === 0) {
                recommendations = [
                    "Write for 10 minutes every morning",
                    "Use specific details instead of general statements",
                    "Review your notes weekly to spot patterns"
                ];
            }
            
            recommendationsList.innerHTML = recommendations.map(rec => `
                <div class="recommendation-item">
                    <i class="fas fa-star"></i>
                    <span>${rec}</span>
                </div>
            `).join('');
            
        } catch (error) {
            recommendationsList.innerHTML = `
                <div class="recommendation-item">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Could not load AI recommendations</span>
                </div>
            `;
        }
    }
    
    getMoodEmoji(mood) {
        const emojiMap = {
            'happy': '😊',
            'sad': '😔',
            'excited': '🎉',
            'angry': '😠',
            'neutral': '😐',
            'anxious': '😰',
            'grateful': '🙏'
        };
        return emojiMap[mood] || '📝';
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast';
        
        // Add type class
        toast.classList.add(type);
        
        // Show toast
        toast.style.display = 'flex';
        
        // Auto hide
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.diaryAI = new DiaryAI();
});
