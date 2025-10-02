import { BRAINWAVE_RANGES } from './constants.js';

/**
 * UIの制御とイベント処理を管理するクラス
 */
export class UIController {
    constructor() {
        this.selectedWave = 'theta';
        this.callbacks = {
            onWaveSelect: null,
            onGenerate: null,
            onPlayPause: null,
            onStop: null,
            onDownload: null,
            onFileUpload: null
        };
    }

    /**
     * コールバック関数を設定
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        this.setupWaveButtons();
        this.setupSliders();
        this.setupControlButtons();
        this.setupFileInput();
    }

    /**
     * 脳波選択ボタンのイベント設定
     */
    setupWaveButtons() {
        document.querySelectorAll('.wave-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectBrainwave(btn.dataset.wave);
            });
        });
    }

    /**
     * スライダーのイベント設定
     */
    setupSliders() {
        const sliders = [
            { id: 'targetFreq', valueId: 'targetFreqValue' },
            { id: 'carrierFreq', valueId: 'carrierFreqValue' },
            { id: 'volume', valueId: 'volumeValue' },
            { id: 'pinkNoise', valueId: 'pinkNoiseValue' },
            { id: 'duration', valueId: 'durationValue' }
        ];

        sliders.forEach(({ id, valueId }) => {
            const slider = document.getElementById(id);
            const valueDisplay = document.getElementById(valueId);

            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    valueDisplay.textContent = e.target.value;
                });
            }
        });
    }

    /**
     * 制御ボタンのイベント設定
     */
    setupControlButtons() {
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                if (this.callbacks.onGenerate) {
                    this.callbacks.onGenerate();
                }
            });
        }

        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                if (this.callbacks.onPlayPause) {
                    this.callbacks.onPlayPause();
                }
            });
        }

        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                if (this.callbacks.onStop) {
                    this.callbacks.onStop();
                }
            });
        }

        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                if (this.callbacks.onDownload) {
                    this.callbacks.onDownload();
                }
            });
        }
    }

    /**
     * ファイル入力のイベント設定
     */
    setupFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (this.callbacks.onFileUpload) {
                    this.callbacks.onFileUpload(e);
                }
            });
        }
    }

    /**
     * 脳波タイプを選択
     */
    selectBrainwave(waveType) {
        this.selectedWave = waveType;

        // ボタンのアクティブ状態を更新
        document.querySelectorAll('.wave-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const selectedBtn = document.querySelector(`[data-wave="${waveType}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        // ターゲット周波数の範囲を更新
        const range = BRAINWAVE_RANGES[waveType];
        const targetFreq = document.getElementById('targetFreq');
        const midFreq = (range.min + range.max) / 2;

        if (targetFreq) {
            targetFreq.min = range.min;
            targetFreq.max = range.max;
            targetFreq.value = midFreq;
            document.getElementById('targetFreqValue').textContent = midFreq;
        }

        // 情報パネルを更新
        this.updateInfoPanel(waveType);

        // コールバック実行
        if (this.callbacks.onWaveSelect) {
            this.callbacks.onWaveSelect(waveType);
        }
    }

    /**
     * 情報パネルを更新
     */
    updateInfoPanel(waveType) {
        const info = BRAINWAVE_RANGES[waveType];
        const infoContent = document.getElementById('infoContent');

        if (infoContent) {
            infoContent.innerHTML = `
                <h3>${info.title}</h3>
                <p><strong>効果:</strong> ${info.effects}</p>
                <p><strong>使用方法:</strong> ${info.usage}</p>
                <p>⚠️ ヘッドフォンを使用し、15-30分間お聴きください</p>
            `;
        }
    }

    /**
     * 生成パラメータを取得
     */
    getGenerationParams() {
        return {
            targetFreq: parseFloat(document.getElementById('targetFreq')?.value || 6),
            carrierFreq: parseFloat(document.getElementById('carrierFreq')?.value || 200),
            volume: parseFloat(document.getElementById('volume')?.value || 50) / 100,
            pinkNoiseLevel: parseFloat(document.getElementById('pinkNoise')?.value || 10) / 100,
            duration: parseFloat(document.getElementById('duration')?.value || 5) * 60
        };
    }

    /**
     * 再生/一時停止ボタンのテキストを更新
     */
    updatePlayPauseButton(isPlaying) {
        const btn = document.getElementById('playPauseBtn');
        if (btn) {
            btn.textContent = isPlaying ? '一時停止' : '再生';
        }
    }

    /**
     * コントロールボタンの有効/無効を設定
     */
    setControlsEnabled(enabled) {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        if (playPauseBtn) playPauseBtn.disabled = !enabled;
        if (stopBtn) stopBtn.disabled = !enabled;
        if (downloadBtn) downloadBtn.disabled = !enabled;
    }

    /**
     * ダウンロードボタンの有効/無効を設定
     */
    setDownloadEnabled(enabled) {
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) downloadBtn.disabled = !enabled;
    }

    /**
     * 通知を表示
     */
    showNotification(message, type = 'success') {
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

    /**
     * 選択中の脳波タイプを取得
     */
    getSelectedWave() {
        return this.selectedWave;
    }
}
