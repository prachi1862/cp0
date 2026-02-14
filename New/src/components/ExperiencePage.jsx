import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const ImageSequenceCanvas = ({ progress }) => {
    const canvasRef = useRef(null);
    const [images, setImages] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const frameCount = 240;

    useEffect(() => {
        const loadedImages = [];
        let loadedCount = 0;

        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            const frameIndex = i.toString().padStart(3, '0');
            img.src = `/frames/ezgif-frame-${frameIndex}.jpg`;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === frameCount) {
                    setIsLoaded(true);
                }
            };
            loadedImages.push(img);
        }
        setImages(loadedImages);
    }, []);

    const frameIndex = useTransform(progress, [0, 1], [0, frameCount - 1]);
    const smoothFrame = useSpring(frameIndex, { stiffness: 300, damping: 60 });

    useEffect(() => {
        if (!isLoaded || images.length === 0 || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const render = () => {
            const idx = Math.round(smoothFrame.get());
            const image = images[idx];
            if (image && image.complete) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                const hRatio = canvas.width / image.width;
                const vRatio = canvas.height / image.height;
                const ratio = Math.min(hRatio, vRatio);
                const centerShiftX = (canvas.width - image.width * ratio) / 2;
                const centerShiftY = (canvas.height - image.height * ratio) / 2;

                context.drawImage(
                    image,
                    0, 0, image.width, image.height,
                    centerShiftX, centerShiftY, image.width * ratio, image.height * ratio
                );
            }
            requestAnimationFrame(render);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        const animId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animId);
        };
    }, [isLoaded, images, smoothFrame]);

    return (
        <div className="absolute inset-0 z-0">
            <canvas ref={canvasRef} className="w-full h-full" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary">
                    <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-white/50 tracking-tighter text-xl italic"
                    >
                        Preparing the Experience...
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const StorySection = ({ children, align = 'center' }) => {
    const aligns = {
        left: 'justify-start text-left',
        right: 'justify-end text-right',
        center: 'justify-center text-center'
    };

    return (
        <div className={`h-screen w-full flex items-center px-12 md:px-24 z-10 relative pointer-events-none ${aligns[align]}`}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-200px" }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-xl pointer-events-auto"
            >
                {children}
            </motion.div>
        </div>
    );
};

const ExperiencePage = ({ title, subtitle, accent, sections = [] }) => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <main ref={containerRef} className="relative">
            <div className="sticky top-0 h-screen w-full overflow-hidden">
                <ImageSequenceCanvas progress={scrollYProgress} />

                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-between pb-12">
                    <div />
                    <motion.div
                        style={{ opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]) }}
                        className="flex flex-col items-center text-white/40"
                    >
                        <span className="text-[10px] tracking-[0.3em] uppercase mb-4">Scroll to discover</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <ChevronDown size={20} />
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            <div className="relative z-10">
                <StorySection>
                    <div className="drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                        <h1 className="text-6xl md:text-8xl mb-6 bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 font-light mb-4">{subtitle}</p>
                        <p className="text-sm text-[#FF8A00] tracking-widest uppercase font-medium">Every ingredient placed with intention.</p>
                    </div>
                </StorySection>

                {sections.map((section, idx) => (
                    <StorySection key={idx} align={section.align}>
                        <div className="drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                            <h2 className="text-5xl md:text-7xl mb-8 whitespace-pre-line text-white/95">
                                {section.heading}
                            </h2>
                            <p className={`text-white/80 text-lg md:text-xl leading-relaxed max-w-md ${section.align === 'right' ? 'ml-auto' : ''}`}>
                                {section.content}
                            </p>
                        </div>
                    </StorySection>
                ))}

                <StorySection>
                    <h2 className="text-5xl md:text-7xl mb-8 bg-gradient-to-b from-white via-white to-accent-amber bg-clip-text text-transparent">
                        {accent}
                    </h2>
                    <p className="text-white/60 text-lg md:text-xl mb-12 italic">Food Bridge — {title.includes('Home') ? 'where tradition meets precision.' : 'our journey of craft.'}</p>
                    <div className="flex items-center justify-center space-x-8 pointer-events-auto">
                        <button
                            onClick={onAskDoubt}
                            className="bg-white text-black px-10 py-4 rounded-sm font-medium hover:bg-white/90 transition-colors"
                        >
                            Ask a Doubt
                        </button>
                        <a href="#" className="text-white/70 hover:text-white transition-colors border-b border-white/20 pb-1">
                            View Menu
                        </a>
                    </div>
                </StorySection>
            </div>
        </main>
    );
};

export default ExperiencePage;
