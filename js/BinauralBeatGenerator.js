import { AUDIO_CONFIG } from './constants.js';

/**
 * バイノーラルビート音源を生成するクラス
 */
export class BinauralBeatGenerator {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.pinkNoiseFilter = null;
    }

    /**
     * バイノーラルビート音源を生成
     * @param {Object} params - 生成パラメータ
     * @param {number} params.targetFreq - ターゲット周波数（脳波周波数）
     * @param {number} params.carrierFreq - キャリア周波数
     * @param {number} params.volume - 音量 (0-1)
     * @param {number} params.pinkNoiseLevel - ピンクノイズレベル (0-1)
     * @param {number} params.duration - 生成時間（秒）
     * @returns {AudioBuffer} 生成されたオーディオバッファ
     */
    generate(params) {
        const {
            targetFreq,
            carrierFreq,
            volume = 0.5,
            pinkNoiseLevel = 0.1,
            duration = 300 // デフォルト5分
        } = params;

        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const channels = 2;

        const buffer = this.audioContext.createBuffer(channels, frameCount, sampleRate);

        const fadeInSamples = AUDIO_CONFIG.FADE_IN_TIME * sampleRate;
        const fadeOutSamples = AUDIO_CONFIG.FADE_OUT_TIME * sampleRate;

        // 左右のチャンネルで異なる周波数を生成
        for (let channel = 0; channel < channels; channel++) {
            const channelData = buffer.getChannelData(channel);
            // 左: キャリア周波数、右: キャリア周波数 + ターゲット周波数
            const frequency = channel === 0 ? carrierFreq : carrierFreq + targetFreq;

            for (let i = 0; i < frameCount; i++) {
                const time = i / sampleRate;

                // フェードイン・アウトの振幅計算
                let amplitude = 1.0;
                if (i < fadeInSamples) {
                    amplitude = i / fadeInSamples;
                } else if (i > frameCount - fadeOutSamples) {
                    amplitude = (frameCount - i) / fadeOutSamples;
                }

                // サイン波生成
                const sineWave = Math.sin(2 * Math.PI * frequency * time) * amplitude * volume;

                // ピンクノイズ追加
                const pinkNoise = this.generatePinkNoiseSample() * pinkNoiseLevel * amplitude;

                channelData[i] = sineWave + pinkNoise;
            }
        }

        return buffer;
    }

    /**
     * ピンクノイズのサンプルを生成
     * @returns {number} ピンクノイズサンプル
     */
    generatePinkNoiseSample() {
        const white = Math.random() * 2 - 1;

        // ピンクノイズフィルタの初期化
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

        return pink * 0.11; // ノーマライズ
    }

    /**
     * ピンクノイズフィルタをリセット
     */
    resetPinkNoiseFilter() {
        this.pinkNoiseFilter = null;
    }
}
