import { BRAINWAVE_RANGES, SPECTRUM_CONFIG } from './constants.js';

/**
 * スペクトラム・波形を可視化するクラス
 */
export class Visualizer {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.waveformCanvas = null;
        this.waveformCtx = null;
        this.spectrumCanvas = null;
        this.spectrumCtx = null;
        this.animationId = null;
        this.isRunning = false;
        this.selectedWave = 'theta';
    }

    /**
     * Canvasを初期化
     */
    initializeCanvases() {
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.waveformCtx = this.waveformCanvas.getContext('2d');

        this.spectrumCanvas = document.getElementById('spectrumCanvas');
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');

        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    /**
     * Canvasのサイズを調整
     */
    resizeCanvases() {
        [this.waveformCanvas, this.spectrumCanvas].forEach(canvas => {
            if (canvas) {
                canvas.width = canvas.offsetWidth * window.devicePixelRatio;
                canvas.height = canvas.offsetHeight * window.devicePixelRatio;
                canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);
            }
        });
    }

    /**
     * 選択された脳波タイプを設定
     */
    setSelectedWave(waveType) {
        this.selectedWave = waveType;
    }

    /**
     * 可視化を開始
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        const draw = () => {
            if (!this.isRunning) return;

            this.animationId = requestAnimationFrame(draw);
            this.drawWaveform();
            this.drawSpectrum();
            this.updatePowerMeters();
        };

        draw();
    }

    /**
     * 可視化を停止
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 波形を描画
     */
    drawWaveform() {
        const dataArray = this.audioEngine.getTimeDomainData();
        if (!dataArray) return;

        const width = this.waveformCanvas.offsetWidth;
        const height = this.waveformCanvas.offsetHeight;

        this.waveformCtx.fillStyle = `rgba(0, 0, 0, ${SPECTRUM_CONFIG.CANVAS_ALPHA})`;
        this.waveformCtx.fillRect(0, 0, width, height);

        this.waveformCtx.lineWidth = 2;
        this.waveformCtx.strokeStyle = BRAINWAVE_RANGES[this.selectedWave].color;
        this.waveformCtx.beginPath();

        const bufferLength = dataArray.length;
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

    /**
     * スペクトラムを描画
     */
    drawSpectrum() {
        const dataArray = this.audioEngine.getFrequencyData();
        if (!dataArray) return;

        const width = this.spectrumCanvas.offsetWidth;
        const height = this.spectrumCanvas.offsetHeight;

        this.spectrumCtx.fillStyle = `rgba(0, 0, 0, ${SPECTRUM_CONFIG.CANVAS_ALPHA})`;
        this.spectrumCtx.fillRect(0, 0, width, height);

        const bufferLength = this.audioEngine.getFrequencyBinCount();
        const nyquist = this.audioEngine.getNyquistFrequency();
        const maxBin = Math.floor((SPECTRUM_CONFIG.MAX_FREQUENCY / nyquist) * bufferLength);

        const barWidth = width / maxBin;

        for (let i = 0; i < maxBin; i++) {
            const barHeight = (dataArray[i] / 255) * height;
            const freq = (i / bufferLength) * nyquist;

            // 周波数に応じた色を設定
            let color = '#ffffff';
            if (freq <= 4) {
                color = BRAINWAVE_RANGES.delta.color;
            } else if (freq <= 8) {
                color = BRAINWAVE_RANGES.theta.color;
            } else if (freq <= 13) {
                color = BRAINWAVE_RANGES.alpha.color;
            } else if (freq <= 30) {
                color = BRAINWAVE_RANGES.beta.color;
            } else {
                color = BRAINWAVE_RANGES.gamma.color;
            }

            this.spectrumCtx.fillStyle = color;
            this.spectrumCtx.globalAlpha = SPECTRUM_CONFIG.BAR_ALPHA;
            this.spectrumCtx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }

        this.spectrumCtx.globalAlpha = 1;
    }

    /**
     * パワーメーターを更新
     */
    updatePowerMeters() {
        const dataArray = this.audioEngine.getFrequencyData();
        if (!dataArray) return;

        const bufferLength = this.audioEngine.getFrequencyBinCount();
        const nyquist = this.audioEngine.getNyquistFrequency();

        // 指定周波数範囲のパワーを計算
        const calculatePower = (minFreq, maxFreq) => {
            const minBin = Math.floor((minFreq / nyquist) * bufferLength);
            const maxBin = Math.floor((maxFreq / nyquist) * bufferLength);

            let sum = 0;
            for (let i = minBin; i <= maxBin; i++) {
                sum += dataArray[i];
            }

            return (sum / ((maxBin - minBin + 1) * 255)) * 100;
        };

        // 各脳波帯域のメーターを更新
        Object.keys(BRAINWAVE_RANGES).forEach(waveType => {
            const range = BRAINWAVE_RANGES[waveType];
            const power = calculatePower(range.min, range.max);

            const meter = document.querySelector(`[data-wave="${waveType}"] .meter-bar`);
            const value = document.querySelector(`[data-wave="${waveType}"] .meter-value`);

            if (meter && value) {
                meter.style.width = `${power}%`;
                value.textContent = `${Math.round(power)}%`;
            }
        });
    }

    /**
     * Canvasをクリア
     */
    clear() {
        if (this.waveformCtx && this.waveformCanvas) {
            this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        }

        if (this.spectrumCtx && this.spectrumCanvas) {
            this.spectrumCtx.clearRect(0, 0, this.spectrumCanvas.width, this.spectrumCanvas.height);
        }

        // パワーメーターをリセット
        document.querySelectorAll('.meter-bar').forEach(bar => {
            bar.style.width = '0%';
        });

        document.querySelectorAll('.meter-value').forEach(value => {
            value.textContent = '0%';
        });
    }
}
