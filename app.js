class BrainwaveEntrainmentTool {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.isPlaying = false;
        this.currentSource = null;
        this.generatedBuffer = null;
        this.animationId = null;

        this.brainwaveRanges = {
            delta: { min: 0.5, max: 4, color: '#6366f1', description: '深い睡眠・回復' },
            theta: { min: 4, max: 8, color: '#8b5cf6', description: '瞑想・創造性' },
            alpha: { min: 8, max: 13, color: '#06d6a0', description: 'リラックス・集中準備' },
            beta: { min: 13, max: 30, color: '#ffd60a', description: '集中・論理思考' },
            gamma: { min: 30, max: 100, color: '#f72585', description: '高次認知・洞察' }
        };

        this.selectedWave = 'theta';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCanvases();
        this.updateInfoPanel('theta');
    }

    initializeAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;
            this.analyser.smoothingTimeConstant = 0.8;
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.wave-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectBrainwave(btn.dataset.wave);
            });
        });

        document.getElementById('targetFreq').addEventListener('input', (e) => {
            document.getElementById('targetFreqValue').textContent = e.target.value;
        });

        document.getElementById('carrierFreq').addEventListener('input', (e) => {
            document.getElementById('carrierFreqValue').textContent = e.target.value;
        });

        document.getElementById('volume').addEventListener('input', (e) => {
            document.getElementById('volumeValue').textContent = e.target.value;
        });

        document.getElementById('pinkNoise').addEventListener('input', (e) => {
            document.getElementById('pinkNoiseValue').textContent = e.target.value;
        });

        document.getElementById('duration').addEventListener('input', (e) => {
            document.getElementById('durationValue').textContent = e.target.value;
        });

        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateBinauralBeat();
        });

        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stop();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadWAV();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });
    }

    selectBrainwave(waveType) {
        document.querySelectorAll('.wave-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-wave="${waveType}"]`).classList.add('active');

        this.selectedWave = waveType;
        const range = this.brainwaveRanges[waveType];
        const targetFreq = document.getElementById('targetFreq');
        const midFreq = (range.min + range.max) / 2;

        targetFreq.min = range.min;
        targetFreq.max = range.max;
        targetFreq.value = midFreq;
        document.getElementById('targetFreqValue').textContent = midFreq;

        this.updateInfoPanel(waveType);
    }

    updateInfoPanel(waveType) {
        const info = this.brainwaveRanges[waveType];
        const infoContent = document.getElementById('infoContent');

        const waveInfo = {
            delta: {
                title: 'デルタ波 (0.5-4Hz)',
                effects: '深い睡眠、身体の回復、成長ホルモンの分泌',
                usage: '就寝前に使用し、深い睡眠を促進します'
            },
            theta: {
                title: 'シータ波 (4-8Hz)',
                effects: '瞑想、創造性の向上、記憶の統合',
                usage: '瞑想時や創造的な作業前に使用します'
            },
            alpha: {
                title: 'アルファ波 (8-13Hz)',
                effects: 'リラックス、ストレス軽減、学習準備',
                usage: '休憩時や学習前の準備に使用します'
            },
            beta: {
                title: 'ベータ波 (13-30Hz)',
                effects: '集中力向上、論理的思考、問題解決',
                usage: '作業や勉強時に集中力を高めたい時に使用します'
            },
            gamma: {
                title: 'ガンマ波 (30-100Hz)',
                effects: '高次認知機能、洞察力、意識の統合',
                usage: '複雑な問題解決や創造的な洞察が必要な時に使用します'
            }
        };

        const selected = waveInfo[waveType];
        infoContent.innerHTML = `
            <h3>${selected.title}</h3>
            <p><strong>効果:</strong> ${selected.effects}</p>
            <p><strong>使用方法:</strong> ${selected.usage}</p>
            <p>⚠️ ヘッドフォンを使用し、15-30分間お聴きください</p>
        `;
    }

    generateBinauralBeat() {
        this.initializeAudioContext();

        const targetFreq = parseFloat(document.getElementById('targetFreq').value);
        const carrierFreq = parseFloat(document.getElementById('carrierFreq').value);
        const volume = parseFloat(document.getElementById('volume').value) / 100;
        const pinkNoiseLevel = parseFloat(document.getElementById('pinkNoise').value) / 100;
        const duration = parseFloat(document.getElementById('duration').value) * 60;

        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const channels = 2;

        this.generatedBuffer = this.audioContext.createBuffer(channels, frameCount, sampleRate);

        const fadeInTime = 3;
        const fadeOutTime = 3;
        const fadeInSamples = fadeInTime * sampleRate;
        const fadeOutSamples = fadeOutTime * sampleRate;

        for (let channel = 0; channel < channels; channel++) {
            const channelData = this.generatedBuffer.getChannelData(channel);
            const frequency = channel === 0 ? carrierFreq : carrierFreq + targetFreq;

            for (let i = 0; i < frameCount; i++) {
                const time = i / sampleRate;

                let amplitude = 1.0;
                if (i < fadeInSamples) {
                    amplitude = i / fadeInSamples;
                } else if (i > frameCount - fadeOutSamples) {
                    amplitude = (frameCount - i) / fadeOutSamples;
                }

                const sineWave = Math.sin(2 * Math.PI * frequency * time) * amplitude * volume;

                const pinkNoise = this.generatePinkNoiseSample() * pinkNoiseLevel * amplitude;

                channelData[i] = sineWave + pinkNoise;
            }
        }

        document.getElementById('playPauseBtn').disabled = false;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('downloadBtn').disabled = false;

        this.showNotification('音源生成完了', 'success');
    }

    generatePinkNoiseSample() {
        const white = Math.random() * 2 - 1;

        if (!this.pinkNoiseFilter) {
            this.pinkNoiseFilter = {
                b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0
            };
        }

        const f = this.pinkNoiseFilter;
        f.b0 = 0.99886 * f.b0 + white * 0.0555179;
        f.b1 = 0.99332 * f.b1 + white * 0.0750759;
        f.b2 = 0.96900 * f.b2 + white * 0.1538520;
        f.b3 = 0.86650 * f.b3 + white * 0.3104856;
        f.b4 = 0.55000 * f.b4 + white * 0.5329522;
        f.b5 = -0.7616 * f.b5 - white * 0.0168980;

        const pink = f.b0 + f.b1 + f.b2 + f.b3 + f.b4 + f.b5 + f.b6 + white * 0.5362;
        f.b6 = white * 0.115926;

        return pink * 0.11;
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (!this.generatedBuffer) return;

        this.initializeAudioContext();

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = this.generatedBuffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1;

        this.currentSource.connect(gainNode);
        gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.currentSource.start(0);
        this.isPlaying = true;

        document.getElementById('playPauseBtn').textContent = '一時停止';

        this.startVisualization();

        this.currentSource.onended = () => {
            this.stop();
        };
    }

    pause() {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
        }

        this.isPlaying = false;
        document.getElementById('playPauseBtn').textContent = '再生';

        this.stopVisualization();
    }

    stop() {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
        }

        this.isPlaying = false;
        document.getElementById('playPauseBtn').textContent = '再生';

        this.stopVisualization();
        this.clearCanvases();
    }

    initializeCanvases() {
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.waveformCtx = this.waveformCanvas.getContext('2d');

        this.spectrumCanvas = document.getElementById('spectrumCanvas');
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');

        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
        [this.waveformCanvas, this.spectrumCanvas].forEach(canvas => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);
        });
    }

    startVisualization() {
        if (!this.analyser) return;

        const draw = () => {
            this.animationId = requestAnimationFrame(draw);

            this.drawWaveform();
            this.drawSpectrum();
            this.updatePowerMeters();
        };

        draw();
    }

    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    drawWaveform() {
        const bufferLength = this.analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);

        const width = this.waveformCanvas.offsetWidth;
        const height = this.waveformCanvas.offsetHeight;

        this.waveformCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.waveformCtx.fillRect(0, 0, width, height);

        this.waveformCtx.lineWidth = 2;
        this.waveformCtx.strokeStyle = this.brainwaveRanges[this.selectedWave].color;
        this.waveformCtx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;

            if (i === 0) {
                this.waveformCtx.moveTo(x, y);
            } else {
                this.waveformCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.waveformCtx.stroke();
    }

    drawSpectrum() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        const width = this.spectrumCanvas.offsetWidth;
        const height = this.spectrumCanvas.offsetHeight;

        this.spectrumCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.spectrumCtx.fillRect(0, 0, width, height);

        const maxFreq = 100;
        const sampleRate = this.audioContext.sampleRate;
        const nyquist = sampleRate / 2;
        const maxBin = Math.floor((maxFreq / nyquist) * bufferLength);

        const barWidth = width / maxBin;

        for (let i = 0; i < maxBin; i++) {
            const barHeight = (dataArray[i] / 255) * height;
            const freq = (i / bufferLength) * nyquist;

            let color = '#ffffff';
            if (freq <= 4) color = this.brainwaveRanges.delta.color;
            else if (freq <= 8) color = this.brainwaveRanges.theta.color;
            else if (freq <= 13) color = this.brainwaveRanges.alpha.color;
            else if (freq <= 30) color = this.brainwaveRanges.beta.color;
            else color = this.brainwaveRanges.gamma.color;

            this.spectrumCtx.fillStyle = color;
            this.spectrumCtx.globalAlpha = 0.8;
            this.spectrumCtx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }

        this.spectrumCtx.globalAlpha = 1;
    }

    updatePowerMeters() {
        if (!this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        const sampleRate = this.audioContext.sampleRate;
        const nyquist = sampleRate / 2;

        const calculatePower = (minFreq, maxFreq) => {
            const minBin = Math.floor((minFreq / nyquist) * bufferLength);
            const maxBin = Math.floor((maxFreq / nyquist) * bufferLength);

            let sum = 0;
            for (let i = minBin; i <= maxBin; i++) {
                sum += dataArray[i];
            }

            return (sum / ((maxBin - minBin + 1) * 255)) * 100;
        };

        const updateMeter = (waveType) => {
            const range = this.brainwaveRanges[waveType];
            const power = calculatePower(range.min, range.max);
            const meter = document.querySelector(`[data-wave="${waveType}"] .meter-bar`);
            const value = document.querySelector(`[data-wave="${waveType}"] .meter-value`);

            if (meter && value) {
                meter.style.width = `${power}%`;
                value.textContent = `${Math.round(power)}%`;
            }
        };

        ['delta', 'theta', 'alpha', 'beta', 'gamma'].forEach(updateMeter);
    }

    clearCanvases() {
        this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        this.spectrumCtx.clearRect(0, 0, this.spectrumCanvas.width, this.spectrumCanvas.height);

        document.querySelectorAll('.meter-bar').forEach(bar => {
            bar.style.width = '0%';
        });

        document.querySelectorAll('.meter-value').forEach(value => {
            value.textContent = '0%';
        });
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.initializeAudioContext();

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.generatedBuffer = audioBuffer;

            document.getElementById('playPauseBtn').disabled = false;
            document.getElementById('stopBtn').disabled = false;
            document.getElementById('downloadBtn').disabled = true;

            this.showNotification('ファイル読み込み完了', 'success');
        } catch (error) {
            this.showNotification('ファイル読み込みエラー', 'error');
            console.error('Error loading audio file:', error);
        }
    }

    downloadWAV() {
        if (!this.generatedBuffer) return;

        const length = this.generatedBuffer.length;
        const channels = this.generatedBuffer.numberOfChannels;
        const sampleRate = this.generatedBuffer.sampleRate;

        const buffer = new ArrayBuffer(44 + length * channels * 2);
        const view = new DataView(buffer);

        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * channels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * channels * 2, true);
        view.setUint16(32, channels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * channels * 2, true);

        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < channels; channel++) {
                const sample = Math.max(-1, Math.min(1, this.generatedBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }

        const blob = new Blob([buffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brainwave_${this.selectedWave}_${Date.now()}.wav`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('ダウンロード開始', 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        notification.style.background = type === 'success'
            ? 'linear-gradient(135deg, #06d6a0, #8b5cf6)'
            : 'linear-gradient(135deg, #f72585, #f77f00)';

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    new BrainwaveEntrainmentTool();
});