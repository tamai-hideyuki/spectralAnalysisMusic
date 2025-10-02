// 脳波帯域の定義
export const BRAINWAVE_RANGES = {
    delta: {
        min: 0.5,
        max: 4,
        color: '#6366f1',
        description: '深い睡眠・回復',
        title: 'デルタ波 (0.5-4Hz)',
        effects: '深い睡眠、身体の回復、成長ホルモンの分泌',
        usage: '就寝前に使用し、深い睡眠を促進します'
    },
    theta: {
        min: 4,
        max: 8,
        color: '#8b5cf6',
        description: '瞑想・創造性',
        title: 'シータ波 (4-8Hz)',
        effects: '瞑想、創造性の向上、記憶の統合',
        usage: '瞑想時や創造的な作業前に使用します'
    },
    alpha: {
        min: 8,
        max: 13,
        color: '#06d6a0',
        description: 'リラックス・集中準備',
        title: 'アルファ波 (8-13Hz)',
        effects: 'リラックス、ストレス軽減、学習準備',
        usage: '休憩時や学習前の準備に使用します'
    },
    beta: {
        min: 13,
        max: 30,
        color: '#ffd60a',
        description: '集中・論理思考',
        title: 'ベータ波 (13-30Hz)',
        effects: '集中力向上、論理的思考、問題解決',
        usage: '作業や勉強時に集中力を高めたい時に使用します'
    },
    gamma: {
        min: 30,
        max: 100,
        color: '#f72585',
        description: '高次認知・洞察',
        title: 'ガンマ波 (30-100Hz)',
        effects: '高次認知機能、洞察力、意識の統合',
        usage: '複雑な問題解決や創造的な洞察が必要な時に使用します'
    }
};

// オーディオ設定
export const AUDIO_CONFIG = {
    FFT_SIZE: 4096,
    SMOOTHING_TIME_CONSTANT: 0.8,
    MAX_VOLUME: 0.8,
    FADE_IN_TIME: 3,
    FADE_OUT_TIME: 3
};

// スペクトラム表示設定
export const SPECTRUM_CONFIG = {
    MAX_FREQUENCY: 100,
    CANVAS_ALPHA: 0.3,
    BAR_ALPHA: 0.8
};
