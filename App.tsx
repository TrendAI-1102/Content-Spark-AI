import React, { useState, useEffect, useCallback } from 'react';
import { View, GeneratedItem, GeneratedPost, GeneratedQuote, Tone, ImageStyle, SafetyStatus, ContentType, QuoteCategory, TrendItem, CampaignMetric, ThemeSettings, ThemeMode, AccentColor, GeneratedIllustratedText } from './types';
import * as Icons from './components/icons';
import { saveHistory, loadHistory, saveThemeSettings, loadThemeSettings, defaultTheme } from './services/storageService';
import { generateTextContent, generateImage, generateQuote, generateTrends, generateSimpleText } from './services/geminiService';
import { mockAnalytics } from './services/mockData';

// --- Theme Definitions ---
const themeClasses = {
    [AccentColor.INDIGO]: {
        name: 'Xanh Chàm',
        bg: 'bg-indigo-600',
        hoverBg: 'hover:bg-indigo-700',
        text: 'text-indigo-600',
        darkText: 'dark:text-indigo-400',
        lightBg: 'bg-indigo-100',
        darkLightBg: 'dark:bg-indigo-500/20',
        lightText: 'text-indigo-700',
        darkLightText: 'dark:text-indigo-300',
        border: 'border-indigo-500',
        darkBorder: 'dark:border-indigo-500',
        ring: 'focus:ring-indigo-500',
    },
    [AccentColor.GREEN]: {
        name: 'Xanh Lá',
        bg: 'bg-green-600',
        hoverBg: 'hover:bg-green-700',
        text: 'text-green-600',
        darkText: 'dark:text-green-400',
        lightBg: 'bg-green-100',
        darkLightBg: 'dark:bg-green-500/20',
        lightText: 'text-green-700',
        darkLightText: 'dark:text-green-300',
        border: 'border-green-500',
        darkBorder: 'dark:border-green-500',
        ring: 'focus:ring-green-500',
    },
    [AccentColor.PURPLE]: {
        name: 'Tím',
        bg: 'bg-purple-600',
        hoverBg: 'hover:bg-purple-700',
        text: 'text-purple-600',
        darkText: 'dark:text-purple-400',
        lightBg: 'bg-purple-100',
        darkLightBg: 'dark:bg-purple-500/20',
        lightText: 'text-purple-700',
        darkLightText: 'dark:text-purple-300',
        border: 'border-purple-500',
        darkBorder: 'dark:border-purple-500',
        ring: 'focus:ring-purple-500',
    }
};

type Theme = typeof themeClasses[AccentColor.INDIGO];


// --- Helper Functions ---
const getStatusColor = (status: SafetyStatus) => {
    switch (status) {
        case SafetyStatus.SAFE:
            return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
        case SafetyStatus.NEEDS_REVIEW:
            return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20';
        case SafetyStatus.REJECTED:
            return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
        default:
            return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600';
    }
};

// --- Components ---
const PostCard = ({ post, theme }: { post: GeneratedPost; theme: Theme }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200/80 dark:border-slate-700 flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <h3 className={`text-lg font-bold ${theme.text} ${theme.darkText}`}>{post.topic}</h3>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(post.content.safety_tag)}`}>
                {post.content.safety_tag}
            </span>
        </div>
        <img src={post.imageUrl} alt={post.topic} className="rounded-lg object-cover aspect-video bg-slate-200 dark:bg-slate-700" />
        <div>
            {post.content.disclaimer && <p className="text-sm text-yellow-600 dark:text-yellow-500 mb-2 font-semibold">{post.content.disclaimer}</p>}
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{post.content.hook}</p>
            <p className="text-slate-600 dark:text-slate-400 mt-2">{post.content.context}</p>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="font-semibold text-slate-500 dark:text-slate-400 mb-2">Gợi ý thảo luận:</h4>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                {post.content.discussion_prompts.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
        </div>
        <div className="flex flex-wrap gap-2">
            {post.content.hashtags.map((h, i) => (
                <span key={i} className="text-sm bg-sky-100 text-sky-700 font-medium px-2.5 py-1 rounded-full dark:bg-sky-500/10 dark:text-sky-300">#{h}</span>
            ))}
        </div>
    </div>
);

const QuoteCard = ({ item, theme }: { item: GeneratedQuote; theme: Theme }) => {
    const quoteCategoryLabels: Record<QuoteCategory, string> = {
        [QuoteCategory.TRENDING]: 'Thịnh hành',
        [QuoteCategory.PHILOSOPHY]: 'Triết lý sống',
        [QuoteCategory.LOVE]: 'Tình yêu',
        [QuoteCategory.CONTRARIAN]: 'Quan điểm trái chiều',
        [QuoteCategory.MOTIVATION]: 'Động lực',
        [QuoteCategory.CELEBRITY]: 'Người nổi tiếng',
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200/80 dark:border-slate-700 flex flex-col gap-4">
            <h3 className={`text-lg font-bold ${theme.text} ${theme.darkText}`}>Trích dẫn - {quoteCategoryLabels[item.category]}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.quotes.map((quote, i) => (
                    <blockquote key={i} className={`border-l-4 ${theme.border} pl-4 italic text-slate-600 dark:text-slate-400`}>
                        "{quote}"
                    </blockquote>
                ))}
            </div>
        </div>
    );
};

const IllustratedTextCard = ({ item, theme }: { item: GeneratedIllustratedText; theme: Theme }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-700">
        <img src={item.imageUrl} alt={item.topic} className="w-full aspect-video object-cover bg-slate-200 dark:bg-slate-700" />
        <div className="p-6">
            <h3 className={`text-xl font-bold ${theme.text} ${theme.darkText}`}>{item.topic}</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-line">{item.text}</p>
        </div>
    </div>
);


const LoadingSpinner = ({ text = "Đang tạo..." }: { text?: string }) => (
    <div className="flex flex-col items-center justify-center gap-4 text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-md">
        <Icons.LoaderIcon className="w-12 h-12 animate-spin text-indigo-500 dark:text-indigo-400" />
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">{text}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Quá trình này có thể mất một vài phút. Vui lòng chờ.</p>
    </div>
);

const GeneratorView = ({ addToHistory, seedTopic, onTopicUsed, theme }: { addToHistory: (item: GeneratedItem) => void; seedTopic: string | null; onTopicUsed: () => void; theme: Theme }) => {
    const [contentType, setContentType] = useState<ContentType>(ContentType.SOCIAL_POST);
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState<Tone>(Tone.PROVOCATIVE);
    const [imageStyle, setImageStyle] = useState<ImageStyle>(ImageStyle.EDITORIAL_VECTOR);
    const [quoteCategory, setQuoteCategory] = useState<QuoteCategory>(QuoteCategory.TRENDING);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GeneratedItem | null>(null);

    useEffect(() => {
        if (seedTopic) {
            setContentType(ContentType.SOCIAL_POST);
            setTopic(seedTopic);
            setResult(null);
            onTopicUsed();
        }
    }, [seedTopic, onTopicUsed]);

    const quoteCategoryLabels: Record<QuoteCategory, string> = {
        [QuoteCategory.TRENDING]: 'Thịnh hành',
        [QuoteCategory.PHILOSOPHY]: 'Triết lý sống',
        [QuoteCategory.LOVE]: 'Tình yêu',
        [QuoteCategory.CONTRARIAN]: 'Quan điểm trái chiều',
        [QuoteCategory.MOTIVATION]: 'Động lực',
        [QuoteCategory.CELEBRITY]: 'Người nổi tiếng',
    };
    
    const imageStyleLabels: Record<ImageStyle, string> = {
        [ImageStyle.EDITORIAL_VECTOR]: 'Vector biên tập',
        [ImageStyle.MEME]: 'Phong cách meme (không mặt)',
        [ImageStyle.ILLUSTRATION]: 'Minh họa cách điệu',
        [ImageStyle.INFOGRAPHIC]: 'Đoạn infographic',
    };

    const sampleTopics = [
        'Tương lai của làm việc từ xa',
        'Liệu AI có thể thực sự sáng tạo?',
        'Mặt trái của lối sống "healthy"',
        'Tuần làm việc 4 ngày: Nên hay không?',
        'Du lịch một mình có thực sự an toàn?',
    ];

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            if (contentType === ContentType.SOCIAL_POST) {
                if (!topic) throw new Error("Vui lòng nhập chủ đề cho bài đăng.");
                const [textContent, imageUrl] = await Promise.all([
                    generateTextContent(topic, tone),
                    generateImage(topic, imageStyle),
                ]);
                const post: GeneratedPost = { id: new Date().toISOString(), type: ContentType.SOCIAL_POST, content: textContent, imageUrl, topic, tone, imageStyle };
                setResult(post);
                addToHistory(post);
            } else if (contentType === ContentType.QUOTE) {
                const quoteContent = await generateQuote(quoteCategory);
                if (!quoteContent || !quoteContent.quotes || quoteContent.quotes.length === 0) throw new Error("AI không thể tạo câu nói vào lúc này. Vui lòng thử lại.");
                const quote: GeneratedQuote = { id: new Date().toISOString(), type: ContentType.QUOTE, quotes: quoteContent.quotes, category: quoteCategory };
                setResult(quote);
                addToHistory(quote);
            } else if (contentType === ContentType.ILLUSTRATED_TEXT) {
                 if (!topic) throw new Error("Vui lòng nhập chủ đề hoặc ý tưởng.");
                const [text, imageUrl] = await Promise.all([
                    generateSimpleText(topic),
                    generateImage(topic, ImageStyle.ILLUSTRATION),
                ]);
                const newItem: GeneratedIllustratedText = { 
                    id: new Date().toISOString(), 
                    type: ContentType.ILLUSTRATED_TEXT, 
                    text, 
                    imageUrl, 
                    topic 
                };
                setResult(newItem);
                addToHistory(newItem);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.');
        } finally {
            setIsLoading(false);
        }
    };

    const isGenerateDisabled = isLoading;
    
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200/80 dark:border-slate-700">
                <h2 className={`text-2xl font-bold mb-4 flex items-center gap-3 ${theme.text} ${theme.darkText}`}><Icons.SparklesIcon className="w-6 h-6"/>Tạo Nội Dung</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <button onClick={() => setContentType(ContentType.SOCIAL_POST)} className={`p-4 rounded-lg text-left font-semibold border-2 transition-all ${contentType === ContentType.SOCIAL_POST ? `${theme.lightBg} ${theme.border} ${theme.lightText} ${theme.darkLightBg} ${theme.darkLightText}` : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500'}`}>Bài Đăng Mạng Xã Hội</button>
                    <button onClick={() => setContentType(ContentType.QUOTE)} className={`p-4 rounded-lg text-left font-semibold border-2 transition-all ${contentType === ContentType.QUOTE ? `${theme.lightBg} ${theme.border} ${theme.lightText} ${theme.darkLightBg} ${theme.darkLightText}` : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500'}`}>Bộ Sưu Tập Trích Dẫn</button>
                    <button onClick={() => setContentType(ContentType.ILLUSTRATED_TEXT)} className={`p-4 rounded-lg text-left font-semibold border-2 transition-all ${contentType === ContentType.ILLUSTRATED_TEXT ? `${theme.lightBg} ${theme.border} ${theme.lightText} ${theme.darkLightBg} ${theme.darkLightText}` : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500'}`}>Văn bản & Hình ảnh</button>
                </div>

                {contentType === ContentType.SOCIAL_POST ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="topic" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Chủ đề</label>
                            <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} className={`w-full bg-slate-100/80 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 ${theme.ring}`} placeholder="VD: Tương lai của làm việc từ xa" />
                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                                <span className="text-sm text-slate-500 dark:text-slate-400 mr-1">Gợi ý:</span>
                                {sampleTopics.map(sample => (
                                    <button key={sample} type="button" onClick={() => setTopic(sample)} className={`bg-slate-100 hover:${theme.lightBg} text-slate-600 hover:${theme.lightText} dark:bg-slate-700 dark:hover:${theme.darkLightBg} dark:text-slate-300 dark:hover:${theme.darkLightText} text-xs font-medium px-2.5 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300`}>
                                        {sample}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="tone" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Tông giọng</label>
                            <select id="tone" value={tone} onChange={e => setTone(e.target.value as Tone)} className={`w-full bg-slate-100/80 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 ${theme.ring}`}>
                                {Object.values(Tone).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                           <label htmlFor="imageStyle" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Phong cách ảnh</label>
                           <select id="imageStyle" value={imageStyle} onChange={e => setImageStyle(e.target.value as ImageStyle)} className={`w-full bg-slate-100/80 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 ${theme.ring}`}>
                                {Object.values(ImageStyle).map(s => <option key={s} value={s}>{imageStyleLabels[s]}</option>)}
                           </select>
                        </div>
                    </div>
                ) : contentType === ContentType.QUOTE ? (
                    <div>
                        <label htmlFor="quoteCategory" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Thể loại trích dẫn</label>
                        <select id="quoteCategory" value={quoteCategory} onChange={e => setQuoteCategory(e.target.value as QuoteCategory)} className={`w-full bg-slate-100/80 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 ${theme.ring}`}>
                            {Object.values(QuoteCategory).map(c => <option key={c} value={c}>{quoteCategoryLabels[c]}</option>)}
                        </select>
                    </div>
                ) : ( // ILLUSTRATED_TEXT
                    <div>
                        <label htmlFor="illustrated-topic" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Chủ đề hoặc ý tưởng</label>
                        <input type="text" id="illustrated-topic" value={topic} onChange={e => setTopic(e.target.value)} className={`w-full bg-slate-100/80 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 ${theme.ring}`} placeholder="VD: Một thành phố tương lai trong mây" />
                    </div>
                )}
                <button onClick={handleGenerate} disabled={isGenerateDisabled} className={`mt-6 w-full ${theme.bg} ${theme.hoverBg} disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg`}>
                    {isLoading ? <Icons.LoaderIcon className="w-5 h-5 animate-spin" /> : <Icons.SparklesIcon className="w-5 h-5"/>}
                    {isLoading ? 'Đang tạo...' : 'Tạo Nội Dung'}
                </button>
            </div>
            {error && <div className="bg-red-100 text-red-700 border border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 rounded-lg p-4 font-medium">{error}</div>}
            {isLoading && <LoadingSpinner />}
            {result && result.type === ContentType.SOCIAL_POST && <PostCard post={result as GeneratedPost} theme={theme} />}
            {result && result.type === ContentType.QUOTE && <QuoteCard item={result as GeneratedQuote} theme={theme} />}
            {result && result.type === ContentType.ILLUSTRATED_TEXT && <IllustratedTextCard item={result as GeneratedIllustratedText} theme={theme} />}
        </div>
    );
};

const TrendsView = ({ onSelectTrend, theme }: { onSelectTrend: (topic: string) => void; theme: Theme }) => {
    const [trends, setTrends] = useState<TrendItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrends = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const trendData = await generateTrends();
            setTrends(trendData);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.');
        } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchTrends(); }, [fetchTrends]);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-2xl font-bold flex items-center gap-3 ${theme.text} ${theme.darkText}`}><Icons.TrendingUpIcon className="w-6 h-6"/>Chủ Đề Thịnh Hành</h2>
                <button onClick={fetchTrends} disabled={isLoading} className={`bg-sky-100 hover:bg-sky-200 text-sky-600 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 dark:text-sky-300 font-semibold py-2 px-4 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {isLoading ? <Icons.LoaderIcon className="w-4 h-4 animate-spin" /> : <Icons.RefreshCwIcon className="w-4 h-4" />}
                    Làm mới
                </button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700">
                {isLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-4">
                        <Icons.LoaderIcon className={`w-10 h-10 animate-spin ${theme.text} ${theme.darkText}`} />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">Đang tìm kiếm xu hướng...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg">
                        <p className="font-bold">Không thể tải xu hướng</p>
                        <p className="text-sm">{error}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {trends.map((trend, i) => (
                            <li key={i} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{trend.keyword}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{trend.summary}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Nguồn: {trend.source}</p>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                   <div className="text-right">
                                       <p className={`font-bold text-2xl ${theme.text} ${theme.darkText}`}>{trend.score}</p>
                                       <p className="text-xs text-slate-400 dark:text-slate-500">Điểm xu hướng</p>
                                   </div>
                                   <button onClick={() => onSelectTrend(trend.keyword)} className={`bg-slate-100 group-hover:${theme.lightBg} text-slate-600 group-hover:${theme.lightText} dark:bg-slate-700 dark:group-hover:${theme.darkLightBg} dark:text-slate-300 dark:group-hover:${theme.darkLightText} font-semibold py-2 px-3 rounded-lg flex items-center gap-2 text-sm transition-colors`}>
                                       <Icons.ArrowRightCircleIcon className="w-5 h-5"/>
                                       Sử dụng
                                   </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const ModerationView = ({ theme }: { theme: Theme }) => (
    <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className={`text-2xl font-bold mb-4 flex items-center justify-center gap-3 ${theme.text} ${theme.darkText}`}><Icons.ShieldCheckIcon className="w-6 h-6"/>Kiểm Duyệt Nội Dung</h2>
        <p className="text-slate-500 dark:text-slate-400">Hàng đợi kiểm duyệt và các công cụ sẽ được hiển thị ở đây.</p>
    </div>
);

const AnalyticsView = ({ data, theme }: { data: CampaignMetric[]; theme: Theme }) => (
    <div className="max-w-4xl mx-auto">
        <h2 className={`text-2xl font-bold mb-4 flex items-center gap-3 ${theme.text} ${theme.darkText}`}><Icons.BarChartIcon className="w-6 h-6"/>Phân Tích Chiến Dịch</h2>
         <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-700/50">
                    <tr>
                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Chiến dịch</th>
                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Tương tác</th>
                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">CTR</th>
                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Bình luận</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {data.map(metric => (
                        <tr key={metric.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{metric.name}</td>
                            <td className={`p-4 ${theme.text} ${theme.darkText} font-semibold`}>{metric.engagementRate}%</td>
                            <td className={`p-4 ${theme.text} ${theme.darkText} font-semibold`}>{metric.ctr}%</td>
                            <td className="p-4 text-slate-700 dark:text-slate-300">{metric.comments}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const HistoryView = ({ history, setHistory, theme }: { history: GeneratedItem[], setHistory: React.Dispatch<React.SetStateAction<GeneratedItem[]>>, theme: Theme }) => {
    const clearHistory = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử không?")) setHistory([]);
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex justify-between items-center">
                 <h2 className={`text-2xl font-bold flex items-center gap-3 ${theme.text} ${theme.darkText}`}><Icons.HistoryIcon className="w-6 h-6"/>Lịch Sử Tạo</h2>
                 {history.length > 0 && (
                     <button onClick={clearHistory} className="bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 font-semibold py-2 px-4 rounded-lg flex items-center gap-2 text-sm">
                         <Icons.TrashIcon className="w-4 h-4" /> Xóa Lịch Sử
                     </button>
                 )}
            </div>
            {history.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-16 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/80 dark:border-slate-700">
                    <p>Chưa có nội dung nào được tạo.</p>
                    <p>Hãy vào mục 'Tạo Nội Dung' để bắt đầu sáng tạo!</p>
                </div>
            ) : (
                history.map(item => (
                    <div key={item.id}>
                        {item.type === ContentType.SOCIAL_POST
                            ? <PostCard post={item as GeneratedPost} theme={theme} />
                            : item.type === ContentType.QUOTE
                            ? <QuoteCard item={item as GeneratedQuote} theme={theme} />
                            : <IllustratedTextCard item={item as GeneratedIllustratedText} theme={theme} />}
                    </div>
                ))
            )}
        </div>
    );
};

const ThemeCustomizer = ({ theme, setTheme }: { theme: ThemeSettings, setTheme: React.Dispatch<React.SetStateAction<ThemeSettings>> }) => (
    <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2"><Icons.PaletteIcon className="w-4 h-4" /> Giao diện</h3>
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Chế độ</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => setTheme(t => ({...t, mode: ThemeMode.LIGHT}))} className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold ${theme.mode === ThemeMode.LIGHT ? `bg-slate-200 text-slate-800` : `bg-slate-50 hover:bg-slate-100 text-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300`}`}> <Icons.SunIcon className="w-4 h-4" /> Sáng </button>
                    <button onClick={() => setTheme(t => ({...t, mode: ThemeMode.DARK}))} className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold ${theme.mode === ThemeMode.DARK ? `bg-slate-600 text-white` : `bg-slate-50 hover:bg-slate-100 text-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300`}`}> <Icons.MoonIcon className="w-4 h-4" /> Tối </button>
                </div>
            </div>
             <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Màu nhấn</label>
                <div className="mt-2 flex items-center gap-2">
                    {Object.entries(themeClasses).map(([key, value]) => (
                        <button key={key} onClick={() => setTheme(t => ({...t, accent: key as AccentColor}))} className={`w-8 h-8 rounded-full ${value.bg} ring-2 ring-offset-2 dark:ring-offset-slate-800 transition-all ${theme.accent === key ? `ring-slate-400 dark:ring-slate-300` : `ring-transparent hover:ring-slate-300 dark:hover:ring-slate-500`}`} title={value.name}></button>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const App = () => {
    const [currentView, setCurrentView] = useState<View>(View.GENERATOR);
    const [history, setHistory] = useState<GeneratedItem[]>([]);
    const [seedTopic, setSeedTopic] = useState<string | null>(null);
    const [theme, setTheme] = useState<ThemeSettings>(loadThemeSettings() || defaultTheme);

    useEffect(() => { setHistory(loadHistory()); }, []);
    useEffect(() => { saveHistory(history); }, [history]);
    useEffect(() => { saveThemeSettings(theme); }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme.mode === ThemeMode.DARK) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme.mode]);

    const addToHistory = useCallback((item: GeneratedItem) => { setHistory(prev => [item, ...prev]); }, []);
    const handleSelectTrend = (topic: string) => { setSeedTopic(topic); setCurrentView(View.GENERATOR); };
    const clearSeedTopic = () => { setSeedTopic(null); };

    const currentTheme = themeClasses[theme.accent];

    const navItems = [
        { view: View.GENERATOR, label: 'Tạo Nội Dung', icon: Icons.SparklesIcon },
        { view: View.TRENDS, label: 'Xu Hướng', icon: Icons.TrendingUpIcon },
        { view: View.MODERATION, label: 'Kiểm Duyệt', icon: Icons.ShieldCheckIcon },
        { view: View.ANALYTICS, label: 'Phân Tích', icon: Icons.BarChartIcon },
        { view: View.HISTORY, label: 'Lịch Sử', icon: Icons.HistoryIcon },
    ];

    const renderView = () => {
        switch (currentView) {
            case View.GENERATOR: return <GeneratorView addToHistory={addToHistory} seedTopic={seedTopic} onTopicUsed={clearSeedTopic} theme={currentTheme}/>;
            case View.TRENDS: return <TrendsView onSelectTrend={handleSelectTrend} theme={currentTheme} />;
            case View.MODERATION: return <ModerationView theme={currentTheme}/>;
            case View.ANALYTICS: return <AnalyticsView data={mockAnalytics} theme={currentTheme}/>;
            case View.HISTORY: return <HistoryView history={history} setHistory={setHistory} theme={currentTheme}/>;
            default: return <GeneratorView addToHistory={addToHistory} seedTopic={seedTopic} onTopicUsed={clearSeedTopic} theme={currentTheme}/>;
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen flex font-sans antialiased">
            <nav className="w-64 bg-white dark:bg-slate-800 p-6 flex flex-col justify-between border-r border-slate-200 dark:border-slate-700">
                <div>
                    <div className="flex items-center gap-3 mb-10">
                        <Icons.SparklesIcon className={`w-8 h-8 ${currentTheme.text} ${currentTheme.darkText}`} />
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Sáng Tạo</h1>
                    </div>
                    <ul>
                        {navItems.map(item => (
                            <li key={item.view}>
                                <button onClick={() => setCurrentView(item.view)} className={`w-full flex items-center gap-3 px-4 py-3 my-1 rounded-lg text-left font-semibold transition-colors ${
                                    currentView === item.view
                                        ? `${currentTheme.lightBg} ${currentTheme.text} ${currentTheme.darkLightBg} ${currentTheme.darkText}`
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                                }`}>
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="space-y-2">
                    <ThemeCustomizer theme={theme} setTheme={setTheme} />
                    <div className="text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-700"> v1.3.0 </div>
                </div>
            </nav>
            <main className="flex-1 p-8 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
};

export default App;