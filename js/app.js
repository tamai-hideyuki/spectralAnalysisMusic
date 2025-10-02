import { AudioEngine } from './AudioEngine.js';
import { BinauralBeatGenerator } from './BinauralBeatGenerator.js';
import { Visualizer } from './Visualizer.js';
import { FileHandler } from './FileHandler.js';
import { UIController } from './UIController.js';

/**
 * 脳波エントレインメントツールのメインクラス
 */
class BrainwaveEntrainmentTool {
    constructor() {
        this.audioEngine = new AudioEngine();
        this.generator = null;
        this.visualizer = null;
        this.fileHandler = null;
        this.uiController = new UIController();

        this.init();
    }

    /**
     * 初期化
     */
    init() {
        // UIコントローラーのコールバックを設定
        this.uiController.setCallbacks({
            onWaveSelect: (waveType) => this.handleWaveSelect(waveType),
            onGenerate: () => this.handleGenerate(),
            onPlayPause: () => this.handlePlayPause(),
            onStop: () => this.handleStop(),
            onDownload: () => this.handleDownload(),
            onFileUpload: (e) => this.handleFileUpload(e)
        });

        // イベントリスナーを設定
        this.uiController.setupEventListeners();

        // 初期表示を設定
        this.uiController.selectBrainwave('theta');

        // アニメーション用のスタイルを追加
        this.addAnimationStyles();
    }

    /**
     * 脳波タイプ選択時の処理
     */
    handleWaveSelect(waveType) {
        if (this.visualizer) {
            this.visualizer.setSelectedWave(waveType);
        }
    }

    /**
     * 音源生成時の処理
     */
    handleGenerate() {
        this.audioEngine.initialize();

        // ジェネレーターとファイルハンドラーを初期化
        if (!this.generator) {
            this.generator = new BinauralBeatGenerator(this.audioEngine.audioContext);
        }

        // パラメータを取得
        const params = this.uiController.getGenerationParams();

        try {
            // バイノーラルビートを生成
            const buffer = this.generator.generate(params);
            this.audioEngine.setBuffer(buffer);

            // コントロールを有効化
            this.uiController.setControlsEnabled(true);

            this.uiController.showNotification('音源生成完了', 'success');
        } catch (error) {
            console.error('Generation error:', error);
            this.uiController.showNotification('音源生成エラー', 'error');
        }
    }

    /**
     * 再生/一時停止時の処理
     */
    handlePlayPause() {
        if (this.audioEngine.isPlaying) {
            this.handleStop();
        } else {
            this.playAudio();
        }
    }

    /**
     * 音声を再生
     */
    async playAudio() {
        try {
            // ビジュアライザーを初期化（初回のみ）
            if (!this.visualizer) {
                this.visualizer = new Visualizer(this.audioEngine);
                this.visualizer.initializeCanvases();
                this.visualizer.setSelectedWave(this.uiController.getSelectedWave());
            }

            // 再生開始
            const playPromise = this.audioEngine.play();
            this.uiController.updatePlayPauseButton(true);

            // ビジュアライザー開始
            this.visualizer.start();

            // 再生終了を待つ
            await playPromise;

            // 再生終了時の処理
            this.handleStop();
        } catch (error) {
            console.error('Playback error:', error);
            this.uiController.showNotification('再生エラー', 'error');
        }
    }

    /**
     * 停止時の処理
     */
    handleStop() {
        this.audioEngine.stop();
        this.uiController.updatePlayPauseButton(false);

        if (this.visualizer) {
            this.visualizer.stop();
            this.visualizer.clear();
        }
    }

    /**
     * ダウンロード時の処理
     */
    handleDownload() {
        if (!this.audioEngine.currentBuffer) {
            this.uiController.showNotification('ダウンロードするデータがありません', 'error');
            return;
        }

        // ファイルハンドラーを初期化
        if (!this.fileHandler) {
            this.fileHandler = new FileHandler(this.audioEngine.audioContext);
        }

        try {
            const waveType = this.uiController.getSelectedWave();
            const filename = `brainwave_${waveType}`;
            this.fileHandler.downloadAsWAV(this.audioEngine.currentBuffer, filename);
            this.uiController.showNotification('ダウンロード開始', 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.uiController.showNotification('ダウンロードエラー', 'error');
        }
    }

    /**
     * ファイルアップロード時の処理
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.audioEngine.initialize();

        // ファイルハンドラーを初期化
        if (!this.fileHandler) {
            this.fileHandler = new FileHandler(this.audioEngine.audioContext);
        }

        try {
            const buffer = await this.fileHandler.loadAudioFile(file);
            this.audioEngine.setBuffer(buffer);

            // コントロールを有効化（ダウンロードは無効）
            this.uiController.setControlsEnabled(true);
            this.uiController.setDownloadEnabled(false);

            this.uiController.showNotification('ファイル読み込み完了', 'success');
        } catch (error) {
            console.error('File upload error:', error);
            this.uiController.showNotification('ファイル読み込みエラー', 'error');
        }
    }

    /**
     * アニメーション用のスタイルを追加
     */
    addAnimationStyles() {
        if (document.getElementById('animation-styles')) return;

        const style = document.createElement('style');
        style.id = 'animation-styles';
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
    }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', () => {
    new BrainwaveEntrainmentTool();
});
