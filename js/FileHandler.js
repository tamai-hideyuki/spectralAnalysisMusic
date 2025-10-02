/**
 * ファイルのアップロード・ダウンロードを処理するクラス
 */
export class FileHandler {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    /**
     * 音声ファイルを読み込む
     * @param {File} file - 読み込むファイル
     * @returns {Promise<AudioBuffer>} デコードされたオーディオバッファ
     */
    async loadAudioFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            console.error('Error loading audio file:', error);
            throw new Error('ファイルの読み込みに失敗しました');
        }
    }

    /**
     * AudioBufferをWAVファイルとしてダウンロード
     * @param {AudioBuffer} buffer - ダウンロードするオーディオバッファ
     * @param {string} filename - ファイル名（拡張子なし）
     */
    downloadAsWAV(buffer, filename = 'audio') {
        if (!buffer) {
            throw new Error('No audio buffer provided');
        }

        const wavBlob = this.audioBufferToWav(buffer);
        const url = URL.createObjectURL(wavBlob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${Date.now()}.wav`;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * AudioBufferをWAV形式のBlobに変換
     * @param {AudioBuffer} buffer - 変換するオーディオバッファ
     * @returns {Blob} WAV形式のBlob
     */
    audioBufferToWav(buffer) {
        const length = buffer.length;
        const channels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;

        // WAVヘッダー + データのバッファを作成
        const arrayBuffer = new ArrayBuffer(44 + length * channels * 2);
        const view = new DataView(arrayBuffer);

        // WAVヘッダーを書き込む
        this.writeWavHeader(view, length, channels, sampleRate);

        // オーディオデータを書き込む
        this.writeWavData(view, buffer, length, channels);

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * WAVヘッダーを書き込む
     * @private
     */
    writeWavHeader(view, length, channels, sampleRate) {
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        // RIFFチャンク
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * channels * 2, true);
        writeString(8, 'WAVE');

        // fmtチャンク
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // fmtチャンクサイズ
        view.setUint16(20, 1, true); // PCM形式
        view.setUint16(22, channels, true); // チャンネル数
        view.setUint32(24, sampleRate, true); // サンプルレート
        view.setUint32(28, sampleRate * channels * 2, true); // バイトレート
        view.setUint16(32, channels * 2, true); // ブロックアライン
        view.setUint16(34, 16, true); // ビット深度

        // dataチャンク
        writeString(36, 'data');
        view.setUint32(40, length * channels * 2, true); // データサイズ
    }

    /**
     * WAVデータを書き込む
     * @private
     */
    writeWavData(view, buffer, length, channels) {
        let offset = 44;

        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < channels; channel++) {
                const sample = buffer.getChannelData(channel)[i];
                // -1.0 ~ 1.0 を -32768 ~ 32767 に変換
                const clampedSample = Math.max(-1, Math.min(1, sample));
                view.setInt16(offset, clampedSample * 0x7FFF, true);
                offset += 2;
            }
        }
    }

    /**
     * ファイル入力要素にイベントリスナーを設定
     * @param {string} inputId - ファイル入力要素のID
     * @param {Function} callback - ファイルが読み込まれた時のコールバック
     */
    setupFileInput(inputId, callback) {
        const input = document.getElementById(inputId);
        if (!input) {
            console.warn(`File input element with id "${inputId}" not found`);
            return;
        }

        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    const buffer = await this.loadAudioFile(file);
                    callback(buffer, null);
                } catch (error) {
                    callback(null, error);
                }
            }
        });
    }
}
