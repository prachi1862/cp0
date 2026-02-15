import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Languages, Sparkles, ChefHat, Info, History, Bookmark, Flame, Wind, Droplets, Target, RefreshCw } from 'lucide-react';
import { getRecipeDetail, getRecipeByTitle } from '../services/api';
import { calculateDishVector, calculateCosineSimilarity, normalizeVector, FLAVOR_DIMENSIONS } from '../utils/flavorVector';
import flavorUniverseData from '../data/flavorUniverse.json';

const CUISINES = [
    { name: 'Indian', color: '#FF9933', icon: '🍛' },
    { name: 'Mexican', color: '#006341', icon: '🌮' },
    { name: 'Italian', color: '#008C45', icon: '🍝' },
    { name: 'Japanese', color: '#BC002D', icon: '🍣' },
    { name: 'French', color: '#0055A4', icon: '🥖' },
    { name: 'Thai', color: '#A51931', icon: '🍜' },
    { name: 'Chinese', color: '#DE2910', icon: '🥟' }
];

const FoodTranslator = () => {
    const [dishQuery, setDishQuery] = useState('');
    const [targetCuisine, setTargetCuisine] = useState(CUISINES[0]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState(0); // 0: input, 1: processing, 2: result
    const [processText, setProcessText] = useState('');
    const [translationResult, setTranslationResult] = useState(null);
    const [error, setError] = useState(null);
    const [universe, setUniverse] = useState(flavorUniverseData);

    const translateFood = async () => {
        if (!dishQuery.trim()) return;
        setIsProcessing(true);
        setStep(1);
        setError(null);

        try {
            // 1. Identify Source Dish
            setProcessText("Sequencing Culinary DNA...");
            let sourceDish = null;

            // Search local universe first
            const localMatch = universe.find(r => r.name.toLowerCase().includes(dishQuery.toLowerCase()));

            if (localMatch) {
                sourceDish = {
                    name: localMatch.name,
                    ingredients: localMatch.ingredients,
                    image: localMatch.image,
                    cuisine: localMatch.cuisine,
                    vector: normalizeVector(calculateDishVector(localMatch.ingredients))
                };
            } else {
                const sourceSearch = await getRecipeByTitle(dishQuery, 1, 1);
                const firstResult = sourceSearch?.payload?.data?.[0] || sourceSearch?.[0];

                if (!firstResult) throw new Error("Source dish not found in global database.");

                const detail = await getRecipeDetail(firstResult.recipe_id || firstResult.Recipe_id);
                const recipeData = detail?.recipe || detail?.payload?.data || detail?.data || firstResult;
                const ingredients = (detail?.ingredients || recipeData.ingredients || []).map(i => i.ingredient || i);

                sourceDish = {
                    name: recipeData.recipe_title || recipeData.name || firstResult.recipe_title,
                    ingredients: ingredients,
                    image: recipeData.img_url || recipeData.image_url || firstResult.img_url,
                    cuisine: recipeData.cuisine || recipeData.region || 'International',
                    vector: normalizeVector(calculateDishVector(ingredients))
                };
            }

            setProcessText("Mapping Cross-Cultural Parallels...");
            await new Promise(r => setTimeout(r, 1000));

            // 2. Scan Universe for Target Cuisine Candidates
            setProcessText(`Scanning ${targetCuisine.name} Molecular Archives...`);

            const candidates = universe.filter(r =>
                r.cuisine === targetCuisine.name &&
                r.name.toLowerCase() !== sourceDish.name.toLowerCase()
            );

            if (candidates.length === 0) throw new Error(`No deep molecular data available for ${targetCuisine.name} cuisine yet.`);

            // 3. Vector Similarity Matching
            const scoredCandidates = candidates.map(candidate => {
                const candVector = calculateDishVector(candidate.ingredients);
                const similarity = calculateCosineSimilarity(calculateDishVector(sourceDish.ingredients), candVector);

                // Identify Shared Traits
                const sharedTraits = FLAVOR_DIMENSIONS
                    .filter(dim => sourceDish.vector[dim] > 0 && normalizeVector(candVector)[dim] > 0)
                    .sort((a, b) => (candVector[b] + sourceDish.vector[b]) - (candVector[a] + sourceDish.vector[a]));

                return {
                    ...candidate,
                    similarity: similarity * 100,
                    vector: normalizeVector(candVector),
                    sharedTraits
                };
            });

            // Get Top Match
            scoredCandidates.sort((a, b) => b.similarity - a.similarity);
            const bestMatch = scoredCandidates[0];

            setProcessText("Synthesizing Final Translation...");
            await new Promise(r => setTimeout(r, 800));

            setTranslationResult({
                source: sourceDish,
                target: bestMatch,
                similarity: Math.round(bestMatch.similarity)
            });
            setStep(2);

        } catch (err) {
            console.error(err);
            setError(err.message || "Translation Matrix Failed. Please try a different dish.");
            setStep(0);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-24 px-6 md:px-12 lg:px-24">
            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center text-center space-y-12"
                        >
                            <div className="space-y-6">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="w-20 h-20 border-2 border-dashed border-[#B11226]/30 rounded-full flex items-center justify-center mx-auto"
                                >
                                    <Languages className="text-[#B11226]" size={32} />
                                </motion.div>
                                <h1 className="text-5xl md:text-7xl font-display italic bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                                    Food Translator
                                </h1>
                                <p className="text-white/40 text-lg max-w-2xl mx-auto font-light">
                                    Translate any dish into a new cultural dialect. Our engine analyzes molecular flavor vectors to find the mathematical equivalent in any cuisine.
                                </p>
                            </div>

                            <div className="w-full max-w-2xl space-y-8 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 block text-left ml-4">Original Dish</label>
                                    <div className="relative group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#B11226] transition-colors" size={20} />
                                        <input
                                            type="text"
                                            placeholder="e.g. Taco, Pasta, Burger..."
                                            value={dishQuery}
                                            onChange={(e) => setDishQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && translateFood()}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-8 text-white focus:outline-none focus:border-[#B11226] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 block text-left ml-4">Translate To</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {CUISINES.map((c) => (
                                            <button
                                                key={c.name}
                                                onClick={() => setTargetCuisine(c)}
                                                className={`p-4 rounded-2xl border transition-all flex flex-col items-center space-y-2 ${targetCuisine.name === c.name
                                                    ? 'bg-[#B11226]/10 border-[#B11226] text-white'
                                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="text-xl">{c.icon}</span>
                                                <span className="text-[11px] font-medium tracking-wide leading-none">{c.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={translateFood}
                                    disabled={!dishQuery || isProcessing}
                                    className="w-full bg-white text-black hover:bg-[#B11226] hover:text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center space-x-3"
                                >
                                    <span>Initiate Translation</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            {error && <p className="text-[#B11226] text-sm italic">{error}</p>}
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] space-y-12"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 180, 360]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-32 h-32 border-2 border-white/10 rounded-full border-t-[#B11226]"
                                />
                                <ChefHat className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" size={32} />
                            </div>
                            <div className="text-center space-y-4">
                                <motion.p
                                    key={processText}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl text-white font-display italic"
                                >
                                    {processText}
                                </motion.p>
                                <div className="flex space-x-2 justify-center">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                            className="w-2 h-2 bg-[#B11226] rounded-full"
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && translationResult && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-12"
                        >
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/10 pb-12">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3 text-[#B11226]">
                                        <Sparkles size={18} />
                                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Successfully Translated</span>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl text-white font-display">
                                        The <span className="italic text-accent-amber">{translationResult.target.cuisine}</span> {translationResult.source.name}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setStep(0)}
                                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[11px] uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <RefreshCw size={14} /> Translate Another
                                </button>
                            </div>

                            {/* Comparison Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Source Dish */}
                                <div className="space-y-6 opacity-60 hover:opacity-100 transition-opacity">
                                    <div className="aspect-video rounded-3xl overflow-hidden border border-white/10 relative">
                                        <img src={translationResult.source.image} alt={translationResult.source.name} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                            <span className="text-white font-bold">{translationResult.source.name}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                            <Target size={14} className="text-white/40" /> Source Vector
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {FLAVOR_DIMENSIONS.slice(0, 6).map(dim => (
                                                <div key={dim} className="flex justify-between items-center text-xs">
                                                    <span className="text-white/40">{dim}</span>
                                                    <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-white/40" style={{ width: `${translationResult.source.vector[dim]}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Target Dish (Translation) */}
                                <div className="space-y-6 relative">
                                    <div className="absolute -inset-4 bg-[#B11226]/5 rounded-[3rem] blur-xl -z-10" />
                                    <div className="aspect-video rounded-3xl overflow-hidden border border-[#B11226]/30 relative shadow-2xl shadow-[#B11226]/10">
                                        <div className="absolute top-4 right-4 z-10 bg-[#B11226] text-white px-4 py-2 rounded-full font-bold shadow-lg">
                                            {translationResult.similarity}% Match
                                        </div>
                                        <img src={translationResult.target.image} alt={translationResult.target.name} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                            <span className="text-white font-bold">{translationResult.target.name}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-[#B11226] uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles size={14} className="text-[#B11226]" /> Translated Vector
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {FLAVOR_DIMENSIONS.slice(0, 6).map(dim => (
                                                <div key={dim} className="flex justify-between items-center text-xs">
                                                    <span className="text-white/40">{dim}</span>
                                                    <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#B11226]" style={{ width: `${translationResult.target.vector[dim]}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-4">
                                <h3 className="text-2xl font-display text-white italic">Why this works</h3>
                                <p className="text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
                                    The translation engine identified that precise molecular structures in
                                    <span className="text-white font-medium"> {translationResult.source.name} </span>
                                    (specifically {translationResult.target.sharedTraits[0]} and {translationResult.target.sharedTraits[1]} notes)
                                    are mathematically parallel to <span className="text-[#B11226] font-medium">{translationResult.target.name}</span> in {translationResult.target.cuisine} cuisine.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FoodTranslator;
