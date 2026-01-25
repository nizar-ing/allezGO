import { useState, useEffect, useCallback } from 'react';
import { IoChevronBack, IoChevronForward, IoPause, IoPlay } from 'react-icons/io5';


const Carousel = ({
                      images = [],
                      autoPlayInterval = 3000,
                      showControls = true,
                      showDots = true,
                      showPlayPause = true
                  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const goToSlide = useCallback((index) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 500);
    }, [isTransitioning]);

    const goToNext = useCallback(() => {
        const nextIndex = (currentIndex + 1) % images.length;
        goToSlide(nextIndex);
    }, [currentIndex, images.length, goToSlide]);

    const goToPrevious = useCallback(() => {
        const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        goToSlide(prevIndex);
    }, [currentIndex, images.length, goToSlide]);

    const toggleAutoPlay = useCallback(() => {
        setIsAutoPlaying((isAutoPlaying) => !isAutoPlaying);
    }, []);

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(goToNext, autoPlayInterval);
        return () => clearInterval(interval);
    }, [isAutoPlaying, goToNext, autoPlayInterval]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'ArrowLeft') goToPrevious();
            if (event.key === 'ArrowRight') goToNext();
            if (event.key === ' ') {
                event.preventDefault();
                toggleAutoPlay();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [goToNext, goToPrevious, toggleAutoPlay]);

    const handleScroll = (e) => {
        e.preventDefault();
        const currentScroll = window.pageYOffset;
        const isMobile = window.innerWidth <= 768;
        const scrollDistance = isMobile ? window.innerHeight * 0.7 : window.innerHeight;
        const targetScroll = currentScroll + scrollDistance;
        window.scrollTo({
            top: targetScroll * 0.89,
            behavior: 'smooth'
        });
    };

    return (
        <div className="relative w-full h-[calc(63vh-80px)] md:h-[calc(73vh-80px)] overflow-hidden -mt-2 rounded-2xl custom-shadow-heavy">
            {/* Main carousel container */}
            <div
                className="flex transition-all duration-300 ease-in-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((image, index) => (
                    <div key={index} className="relative flex-shrink-0 w-full h-full">
                        {/* Background image with overlay */}
                        <img src={image.url} alt={image.alt} className="w-full h-full aspect-square object-fill" loading="lazy" />
                        <div className="absolute inset-0 flex flex-col justify-center items-center gap-14 md:gap-20 text-white px-8 text-center bg-black/10">
                            <div className="flex flex-col justify-center items-center md:gap-2">
                                <h2 className="text-lg md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 drop-shadow-lg animate-fade-in">
                                    {image.title}
                                </h2>
                                <p className="text-sm md:text-xl lg:text-2xl max-w-3xl opacity-90 drop-shadow-md animate-slide-up">
                                    {image.subtitle}
                                </p>
                            </div>
                            {/*<button className="btn-more btn-gradient-shared px-6 py-3 text-base lg:px-8 lg:py-4 lg:text-lg xl:px-10 xl:py-5 xl:text-xl" onClick={handleScroll}>*/}
                            {/*    <span className="flex items-center justify-center gap-2">*/}
                            {/*        Savoir Plus*/}
                            {/*        <HiArrowDown className="w-6 h-6" />*/}
                            {/*    </span>*/}
                            {/*</button>*/}
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation arrows */}
            {showControls && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group cursor-pointer"
                        aria-label="Previous image"
                    >
                        <IoChevronBack className="w-6 h-6 text-sky-700 group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group cursor-pointer"
                        aria-label="Next image"
                    >
                        <IoChevronForward className="w-6 h-6 text-sky-700 group-hover:scale-110 transition-transform" />
                    </button>
                </>
            )}

            {/* Play/Pause button */}
            {showPlayPause && (
                <button
                    onClick={toggleAutoPlay}
                    className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group cursor-pointer"
                    aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
                >
                    {isAutoPlaying ? (
                        <IoPause className="w-5 h-5 text-sky-700 group-hover:scale-110 transition-transform" />
                    ) : (
                        <IoPlay className="w-5 h-5 text-sky-700 group-hover:scale-110 transition-transform" />
                    )}
                </button>
            )}

            {/* Dot indicators */}
            {showDots && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex space-x-3">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                index === currentIndex
                                    ? 'bg-[#ea580c] scale-150 shadow-lg'
                                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-20 w-full">
                <div
                    className="h-full bg-gradient-to-r from-sky-200 to-sky-900 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
                />
            </div>
        </div>
    );
};

export default Carousel;
