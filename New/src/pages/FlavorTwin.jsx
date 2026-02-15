import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Zap, ChefHat, Info, ArrowRight, Target, Share2, Bookmark, BarChart3, Wind, Flame, Droplets, Leaf, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRecipeByTitle, getRecipeDetail } from '../services/api';
import { calculateDishVector, calculateCosineSimilarity, normalizeVector, FLAVOR_DIMENSIONS } from '../utils/flavorVector';
import flavorUniverseData from '../data/flavorUniverse.json';

const FlavorTwin = () => {
    const navigate = useNavigate();
    const [dishQuery, setDishQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [step, setStep] = useState(0); // 0: Input, 2: Results
    const [statusText, setStatusText] = useState('');
    const [originalDish, setOriginalDish] = useState(null);
    const [twins, setTwins] = useState([]);
    const [universe, setUniverse] = useState(flavorUniverseData);
    const [error, setError] = useState(null);
    const [selectedTwin, setSelectedTwin] = useState(null);

    const findFlavorTwin = async () => {
        if (!dishQuery.trim()) return;

        setIsSearching(true);
        setStep(1); // Start Processing Sequence
        setError(null);

        try {
            setStatusText("Locating Source Recipe...");
            let selectedSource = null;

            // Search local universe first
            const localMatch = universe.find(r => r.name.toLowerCase().includes(dishQuery.toLowerCase()));

            if (localMatch) {
                selectedSource = {
                    name: localMatch.name,
                    ingredients: localMatch.ingredients,
                    image: localMatch.image,
                    cuisine: localMatch.cuisine,
                    continent: localMatch.continent,
                    subRegion: localMatch.subRegion,
                    nutrients: localMatch.nutrients || { energy: 450, protein: 25, carbs: 45 }
                };
            } else {
                const sourceSearch = await getRecipeByTitle(dishQuery, 1, 1);
                const firstResult = sourceSearch?.payload?.data?.[0] || sourceSearch?.[0];

                if (!firstResult) {
                    throw new Error("Recipe not found in common gastronomy database.");
                }

                setStatusText("Parsing Molecular Structure...");
                const detail = await getRecipeDetail(firstResult.recipe_id || firstResult.Recipe_id);
                const recipeData = detail?.recipe || detail?.payload?.data || detail?.data || firstResult;

                selectedSource = {
                    name: recipeData.recipe_title || recipeData.name || firstResult.recipe_title,
                    ingredients: (detail?.ingredients || recipeData.ingredients || []).map(i => i.ingredient || i),
                    image: recipeData.img_url || recipeData.image_url || firstResult.img_url,
                    cuisine: recipeData.cuisine || recipeData.region || firstResult.cuisine || 'Unknown',
                    continent: recipeData.continent || 'Global',
                    subRegion: recipeData.subRegion || 'Gastronomic Universe',
                    nutrients: {
                        energy: parseInt(recipeData['energy (kcal)'] || recipeData.energy || 450),
                        protein: parseInt(recipeData['protein (g)'] || recipeData.protein || 25),
                        carbs: parseInt(recipeData['carbohydrate, by difference (g)'] || recipeData.carbs || 45)
                    }
                };
            }

            setStatusText("Mapping Flavor Dimensions...");
            await new Promise(r => setTimeout(r, 1000));

            const sourceVector = calculateDishVector(selectedSource.ingredients);
            setOriginalDish({ ...selectedSource, vector: normalizeVector(sourceVector) });

            setStatusText("Scanning Universe for Flavor resonance...");
            await new Promise(r => setTimeout(r, 1200));

            const scoredUniverse = universe
                .filter(recipe =>
                    recipe.name.toLowerCase() !== selectedSource.name.toLowerCase() &&
                    recipe.cuisine !== selectedSource.cuisine
                )
                .map(recipe => {
                    const candVector = calculateDishVector(recipe.ingredients);
                    const flavorSim = calculateCosineSimilarity(sourceVector, candVector);

                    // Nutritional Alignment Score (Parity)
                    const nutMatch = recipe.nutrients ? (
                        1 - (
                            Math.abs(recipe.nutrients.energy - selectedSource.nutrients.energy) / 1000 +
                            Math.abs(recipe.nutrients.protein - selectedSource.nutrients.protein) / 100 +
                            Math.abs(recipe.nutrients.carbs - selectedSource.nutrients.carbs) / 200
                        ) / 3
                    ) : 0.8;

                    const totalSim = (flavorSim * 0.7) + (nutMatch * 0.3);

                    const sharedTraits = FLAVOR_DIMENSIONS
                        .filter(dim => sourceVector[dim] > 0 && candVector[dim] > 0)
                        .sort((a, b) => (candVector[b] + sourceVector[b]) - (candVector[a] + sourceVector[a]));

                    return {
                        ...recipe,
                        similarity: Math.round(totalSim * 100),
                        flavorSim: Math.round(flavorSim * 100),
                        nutMatch: Math.round(nutMatch * 100),
                        sharedTraits: sharedTraits.length > 0 ? sharedTraits : ['Unique']
                    };
                });

            const topTwins = scoredUniverse
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 3);

            setStatusText("Finalizing Neural Match...");
            await new Promise(r => setTimeout(r, 800));

            setTwins(topTwins);
            setStep(2);
        } catch (err) {
            console.error(err);
            setError(err.message || "The Intelligence Engine encountered a culinary anomaly. Please try again.");
            setStep(0);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-24 px-6 md:px-12 lg:px-24">
            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex flex-col items-center text-center space-y-12"
                        >
                            <div className="space-y-6 max-w-2xl">
                                <motion.div
                                    animate={{
                                        boxShadow: ["0 0 20px rgba(177, 18, 38, 0)", "0 0 40px rgba(177, 18, 38, 0.3)", "0 0 20px rgba(177, 18, 38, 0)"]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto"
                                >
                                    <Target className="text-[#B11226]" size={40} />
                                </motion.div>
                                <h1 className="text-6xl md:text-8xl font-display italic bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent leading-tight">
                                    Flavor Twin
                                </h1>
                                <p className="text-white/40 text-lg md:text-xl font-light">
                                    Our Sensory Intelligence Engine maps 10 dimensions of taste to find the molecular twin for any dish across the global culinary spectrum.
                                </p>
                            </div>

                            <div className="w-full max-w-2xl bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#B11226]/10 blur-[60px] -mr-16 -mt-16 rounded-full" />

                                <div className="relative z-10 space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase tracking-[0.4em] text-white/30 block text-left ml-6">Input Dish Name</label>
                                        <div className="relative">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={24} />
                                            <input
                                                type="text"
                                                placeholder="e.g. Butter Chicken, Sushi, Pizza..."
                                                value={dishQuery}
                                                onChange={(e) => setDishQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && findFlavorTwin()}
                                                className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-xl text-white focus:outline-none focus:border-[#B11226] transition-all placeholder:text-white/10"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={findFlavorTwin}
                                        disabled={!dishQuery || isSearching}
                                        className="w-full h-20 bg-white text-black hover:bg-[#B11226] hover:text-white rounded-3xl font-bold uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center space-x-4 group disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        {isSearching ? (
                                            <span className="flex items-center space-x-3">
                                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                <span>{statusText}</span>
                                            </span>
                                        ) : (
                                            <>
                                                <span>Sequence Flavor DNA</span>
                                                <Sparkles size={18} className="group-hover:scale-125 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && <p className="text-[#B11226] text-sm italic animate-pulse">{error}</p>}

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                                {FLAVOR_DIMENSIONS.map(dim => (
                                    <div key={dim} className="px-4 py-2 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-white/60">
                                        {dim}
                                    </div>
                                ))}
                            </div>
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
                                    key={statusText}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl text-white font-display italic"
                                >
                                    {statusText}
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

                    {step === 2 && originalDish && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-16"
                        >
                            {/* Original Dish Profile */}
                            <div className="flex flex-col lg:flex-row gap-12 items-center p-12 bg-white/5 border border-white/10 rounded-[4rem] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#B11226]/5 to-transparent pointer-events-none" />

                                <div className="w-full lg:w-1/3 space-y-8 relative z-10">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 text-[#B11226]">
                                            <Target size={14} />
                                            <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Source Analyzed</span>
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-display italic text-white leading-tight">
                                            {originalDish.name}
                                        </h2>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] uppercase tracking-widest text-white/60">
                                                {originalDish.continent}
                                            </span>
                                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] uppercase tracking-widest text-[#B11226]/60">
                                                {originalDish.subRegion}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full aspect-square rounded-3xl overflow-hidden border border-white/10 group">
                                        <img src={originalDish.image} alt={originalDish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>

                                    <button
                                        onClick={() => setStep(0)}
                                        className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white flex items-center space-x-2 transition-colors"
                                    >
                                        <ArrowRight size={14} className="rotate-180" />
                                        <span>Re-search Palate</span>
                                    </button>
                                </div>

                                <div className="flex-1 w-full space-y-8 relative z-10">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                        {FLAVOR_DIMENSIONS.map(dim => (
                                            <div key={dim} className="space-y-3">
                                                <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/30">
                                                    <span>{dim}</span>
                                                    <span>{Math.round(originalDish.vector[dim])}%</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${originalDish.vector[dim]}% ` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="h-full bg-[#B11226]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
                                        <p className="text-white/60 font-light italic text-lg leading-relaxed">
                                            "Our sensors detect a dominant {Object.entries(originalDish.vector).sort((a, b) => b[1] - a[1])[0][0].toLowerCase()} profile
                                            with subtle {Object.entries(originalDish.vector).sort((a, b) => b[1] - a[1])[1][0].toLowerCase()} notes.
                                            The sensory vector is locked."
                                        </p>
                                    </div>

                                    {/* Nutritional resonance board */}
                                    <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/10">
                                        <div className="text-center">
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1 font-bold">Energy</p>
                                            <p className="text-xl font-display text-accent-red">{originalDish.nutrients?.energy || 450} kcal</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1 font-bold">Protein</p>
                                            <p className="text-xl font-display text-white">{originalDish.nutrients?.protein || 25}g</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1 font-bold">Carbs</p>
                                            <p className="text-xl font-display text-white">{originalDish.nutrients?.carbs || 45}g</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Twins Section */}
                            <div className="space-y-12">
                                <div className="flex items-center space-x-4">
                                    <div className="h-[1px] flex-1 bg-white/10" />
                                    <h3 className="text-3xl font-display text-white">The Flavor Twins</h3>
                                    <div className="h-[1px] flex-1 bg-white/10" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {twins.map((twin, i) => (
                                        <motion.div
                                            key={twin.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + (i * 0.1) }}
                                            className="group bg-white/5 border border-white/10 rounded-[3rem] p-8 space-y-8 hover:bg-white/10 hover:border-[#B11226]/30 transition-all duration-500"
                                        >
                                            <div className="relative">
                                                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10">
                                                    <img src={twin.image} alt={twin.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                </div>
                                                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full">
                                                    <span className="text-[14px] font-bold text-[#B11226]">{twin.similarity}%</span>
                                                    <span className="text-[9px] text-white/40 ml-2 uppercase tracking-wide">Match</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <h4 className="text-2xl text-white font-display leading-tight">{twin.name}</h4>
                                                    <div className="flex gap-2">
                                                        <span className="text-[9px] uppercase tracking-widest text-white/30">{twin.continent}</span>
                                                        <span className="text-[9px] uppercase tracking-widest text-[#B11226]/40">• {twin.subRegion}</span>
                                                    </div>
                                                </div>

                                                {/* Nutritional Alignment Mini-Board */}
                                                <div className="flex gap-4 py-3 px-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] text-white/30 uppercase tracking-tighter">Energy</span>
                                                        <span className="text-xs font-bold text-accent-red">{twin.nutrients?.energy} kcal</span>
                                                    </div>
                                                    <div className="w-[1px] h-6 bg-white/10 self-center" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] text-white/30 uppercase tracking-tighter">Protein</span>
                                                        <span className="text-xs font-bold text-white">{twin.nutrients?.protein}g</span>
                                                    </div>
                                                    <div className="w-[1px] h-6 bg-white/10 self-center" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] text-white/30 uppercase tracking-tighter">Carbs</span>
                                                        <span className="text-xs font-bold text-white">{twin.nutrients?.carbs}g</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {twin.sharedTraits.slice(0, 3).map(trait => (
                                                        <span key={trait} className="px-3 py-1 bg-[#B11226]/10 border border-[#B11226]/30 rounded-full text-[9px] uppercase tracking-widest text-[#B11226]">
                                                            {trait}
                                                        </span>
                                                    ))}
                                                </div>

                                                <p className="text-white/40 text-[13px] leading-relaxed font-light">
                                                    {twin.name} is a high-resonance match because both dishes share dominant {twin.sharedTraits[0]} and {twin.sharedTraits[1]} traits.
                                                </p>
                                            </div>

                                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                                <button
                                                    onClick={() => setSelectedTwin(twin)}
                                                    className="flex-1 bg-white text-black py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#B11226] hover:text-white transition-all"
                                                >
                                                    Details
                                                </button>
                                                <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                                                    <Bookmark size={18} className="text-white/40" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sensory Detail Modal */}
                <AnimatePresence>
                    {selectedTwin && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedTwin(null)}
                                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-5xl bg-[#0A0A0A] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[85vh]"
                            >
                                <button
                                    onClick={() => setSelectedTwin(null)}
                                    className="absolute top-8 right-8 z-20 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/40 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>

                                {/* Left: Image & Info */}
                                <div className="w-full md:w-2/5 relative h-64 md:h-auto border-b md:border-b-0 md:border-r border-white/10">
                                    <img src={selectedTwin.image} alt={selectedTwin.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                    <div className="absolute bottom-10 left-10 space-y-2">
                                        <span className="text-[10px] text-white/40 uppercase tracking-[0.4em]">{selectedTwin.cuisine} Origin</span>
                                        <h3 className="text-4xl font-display italic text-white leading-tight">{selectedTwin.name}</h3>
                                    </div>
                                </div>

                                {/* Right: Sensory Profiles */}
                                <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-12 custom-scrollbar">
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 text-[#B11226]">
                                            <Sparkles size={16} />
                                            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold">10-Dimensional Flavor DNA</h4>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                                            {FLAVOR_DIMENSIONS.map(dim => {
                                                const val = calculateDishVector(selectedTwin.ingredients)[dim];
                                                const normalizedVal = Math.min((val / 3) * 100, 100); // Scale for visual impact

                                                return (
                                                    <div key={dim} className="space-y-2">
                                                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/30">
                                                            <span>{dim}</span>
                                                            <span className={val > 0 ? "text-white" : ""}>{Math.round(normalizedVal)}%</span>
                                                        </div>
                                                        <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${normalizedVal}%` }}
                                                                className={`h-full ${val > 0 ? "bg-[#B11226]" : "bg-white/10"}`}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 text-[#B11226]">
                                            <Info size={16} />
                                            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold">Intelligence Insight</h4>
                                        </div>
                                        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
                                            <p className="text-white/60 font-light italic text-lg leading-relaxed">
                                                {selectedTwin.name} is a high-resonance twin for {originalDish.name} specifically due to its unique balance
                                                of <span className="text-white">{selectedTwin.sharedTraits[0]}</span> and <span className="text-white">{selectedTwin.sharedTraits[1]}</span> markers.
                                                Despite originating from {selectedTwin.cuisine} cuisine, it shares a nearly identical molecular structure.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 text-[#B11226]">
                                            <ChefHat size={16} />
                                            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold">Primary Ingredients</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedTwin.ingredients.map((ing, i) => (
                                                <div key={i} className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/60 hover:text-white transition-colors">
                                                    {ing}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FlavorTwin;
