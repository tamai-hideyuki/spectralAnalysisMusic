import { AUDIO_CONFIG } from './constants.js';

/**
 * Web Audio APIを管理するクラス
 */
export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.currentSource = null;
        this.isPlaying = false;
        this.currentBuffer = null;
    }

    /**
     * AudioContextを初期化
     */
    initialize() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;
            this.analyser.smoothingTimeConstant = AUDIO_CONFIG.SMOOTHING_TIME_CONSTANT;
        }
    }

    /**
     * AudioContextを再開（ブラウザのautoplay制限対応）
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * オーディオバッファを設定
     */
    setBuffer(buffer) {
        this.currentBuffer = buffer;
    }

    /**
     * 再生を開始
     */
    play() {
        if (!this.currentBuffer) {
            throw new Error('No audio buffer set');
        }

        this.initialize();
        this.resume();

        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = this.currentBuffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1;

        this.currentSource.connect(gainNode);
        gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.currentSource.start(0);
        this.isPlaying = true;

        return new Promise((resolve) => {
            this.currentSource.onended = () => {
                this.isPlaying = false;
                resolve();
            };
        });
    }

    /**
     * 再生を停止
     */
    stop() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentSource = null;
        }
        this.isPlaying = false;
    }

    /**
     * 周波数データを取得
     */
    getFrequencyData() {
        if (!this.analyser) return null;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    /**
     * 時間領域データを取得
     */
    getTimeDomainData() {
        if (!this.analyser) return null;
        const bufferLength = this.analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);
        return dataArray;
    }

    /**
     * サンプルレートを取得
     */
    getSampleRate() {
        return this.audioContext ? this.audioContext.sampleRate : 44100;
    }

    /**
     * ナイキスト周波数を取得
     */
    getNyquistFrequency() {
        return this.getSampleRate() / 2;
    }

    /**
     * 周波数ビン数を取得
     */
    getFrequencyBinCount() {
        return this.analyser ? this.analyser.frequencyBinCount : 0;
    }

    /**
     * リソースを解放
     */
    dispose() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
