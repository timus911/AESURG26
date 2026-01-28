import React, { useState } from 'react';
import { Play, FileText, ExternalLink, X, ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

const NoteCard = ({ note }) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Zoom & Pan State
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleZoomIn = (e) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.min(prev + 0.5, 4));
    };

    const handleZoomOut = (e) => {
        e.stopPropagation();
        setZoomLevel(prev => {
            const newZoom = Math.max(prev - 0.5, 1);
            if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
            return newZoom;
        });
    };

    const handleMouseDown = (e) => {
        if (zoomLevel > 1) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoomLevel > 1) {
            e.preventDefault();
            setPanPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Reset Zoom on image change
    React.useEffect(() => {
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
    }, [currentImageIndex, lightboxOpen]);

    // Flatten all media for the lightbox (blocks + gallery)
    const allMedia = React.useMemo(() => {
        const media = [];
        if (note.blocks) {
            note.blocks.forEach(block => {
                if (block.type === 'media_caption' || block.type === 'image_caption') {
                    media.push(block.file);
                }
            });
        }
        if (note.gallery) {
            media.push(...note.gallery);
        }
        return media;
    }, [note]);

    const openLightbox = (file) => {
        const index = allMedia.indexOf(file);
        if (index !== -1) {
            setCurrentImageIndex(index);
            setLightboxOpen(true);
        }
    };

    const nextImage = (e) => {
        if (e) e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % allMedia.length);
    };

    const prevImage = (e) => {
        if (e) e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
    };

    // Handle scroll lock and wheel navigation
    React.useEffect(() => {
        if (lightboxOpen) {
            document.body.style.overflow = 'hidden';

            const handleWheel = (e) => {
                // Prevent default scroll behavior
                e.preventDefault();
                // Simple threshold to avoid super fast scrolling on trackpads
                if (Math.abs(e.deltaY) > 20) {
                    if (e.deltaY > 0) nextImage();
                    else prevImage();
                }
            };

            // Add listener to window for capturing events at the top level
            window.addEventListener('wheel', handleWheel, { passive: false });

            return () => {
                document.body.style.overflow = 'unset';
                window.removeEventListener('wheel', handleWheel);
            };
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [lightboxOpen, allMedia.length]); // Dependencies for closure availability


    // Helper to distinguish media types
    const isVideo = (filename) => filename && filename.endsWith('.mp4');
    const isMedicalFile = (filename) => filename && filename.endsWith('.pdf');

    // Helper to get correct path for both local and production
    const getAssetPath = (filename) => {
        return `${import.meta.env.BASE_URL}images/conference/${filename}`;
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 transition-all hover:shadow-md">
                {/* Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                                {note.category}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase tracking-wide">
                                {note.day}
                            </span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">
                            {note.date}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">{note.title || 'Untitled Note'}</h3>
                        {note.speaker && (
                            <p className="text-xs font-semibold text-blue-600 mt-0.5">
                                Speaker: {note.speaker}
                            </p>
                        )}
                    </div>
                </div>

                {/* Content Body - Cohesive Flow */}
                <div className="p-5 flex flex-col gap-3">
                    {note.blocks && note.blocks.length > 0 ? (
                        note.blocks.map((block, idx) => {
                            if (block.type === 'text') {
                                return (
                                    <div key={idx} className="prose prose-slate prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed">
                                        {block.content}
                                    </div>
                                );
                            } else if (block.type === 'media_caption' || block.type === 'image_caption') {
                                return (
                                    <div key={idx} className="flex flex-col gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div
                                            className="relative group rounded-md overflow-hidden cursor-pointer"
                                            onClick={() => openLightbox(block.file)}
                                        >
                                            {isVideo(block.file) ? (
                                                <div className="relative">
                                                    <video
                                                        src={getAssetPath(block.file)}
                                                        className="w-full h-auto max-h-96 object-contain bg-black rounded-md"
                                                        controls={false}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                                        <div className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center pl-1">
                                                            <Play size={16} className="text-slate-900 fill-slate-900" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : isMedicalFile(block.file) ? (
                                                <a
                                                    href={getAssetPath(block.file)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-3 p-3 bg-white rounded border border-slate-200 hover:bg-slate-50 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <FileText size={20} className="text-blue-600" />
                                                    <span className="text-sm font-medium text-slate-700 flex-1 truncate">{block.file}</span>
                                                    <ExternalLink size={16} className="text-slate-400" />
                                                </a>
                                            ) : (
                                                <div className="relative aspect-[16/9] w-full bg-slate-200">
                                                    <img
                                                        src={getAssetPath(block.file)}
                                                        alt="Clinical reference"
                                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white p-1 rounded">
                                                        <Maximize2 size={14} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {block.caption && (
                                            <p className="text-sm text-slate-600 font-medium px-1 italic border-l-2 border-blue-400 pl-2">
                                                {block.caption}
                                            </p>
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        })
                    ) : (
                        // Fallback for old structure if blocks missing
                        note.content && (
                            <div className="prose prose-slate prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed">
                                {note.content}
                            </div>
                        )
                    )}

                    {/* Scrollable Gallery for Remaining Images */}
                    {note.gallery && note.gallery.length > 0 && (
                        <div className="mt-2 pt-3 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Gallery</h4>
                            <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                                {note.gallery.map((mediaFile, idx) => (
                                    <div
                                        key={idx}
                                        className="snap-start shrink-0 w-24 h-24 relative rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                        onClick={() => openLightbox(mediaFile)}
                                    >
                                        {isVideo(mediaFile) ? (
                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                                <Play size={16} className="text-white fill-white" />
                                            </div>
                                        ) : isMedicalFile(mediaFile) ? (
                                            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-2 text-center">
                                                <FileText size={16} className="text-blue-500 mb-1" />
                                                <span className="text-[8px] text-slate-500 leading-tight break-all line-clamp-2">{mediaFile}</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={getAssetPath(mediaFile)}
                                                alt={`Gallery ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox / Video Player Modal */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setLightboxOpen(false)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >

                    {/* Controls */}
                    <div className="absolute top-4 right-4 flex gap-4 z-50">
                        <button
                            onClick={handleZoomIn}
                            className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn size={24} />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut size={24} />
                        </button>
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X size={32} />
                        </button>
                    </div>

                    <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
                    >
                        <ChevronLeft size={40} />
                    </button>

                    <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
                    >
                        <ChevronRight size={40} />
                    </button>

                    <div
                        className="max-w-[90vw] max-h-[90vh] flex flex-col items-center overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isVideo(allMedia[currentImageIndex]) ? (
                            <video
                                key={allMedia[currentImageIndex]}
                                src={getAssetPath(allMedia[currentImageIndex])}
                                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
                                controls
                                autoPlay
                            />
                        ) : isMedicalFile(allMedia[currentImageIndex]) ? (
                            <div className="bg-white p-8 rounded-lg text-center">
                                <FileText size={48} className="mx-auto text-blue-600 mb-4" />
                                <p className="text-lg font-medium mb-4">{allMedia[currentImageIndex]}</p>
                                <a
                                    href={getAssetPath(allMedia[currentImageIndex])}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Open PDF <ExternalLink size={16} />
                                </a>
                            </div>
                        ) : (
                            <img
                                src={getAssetPath(allMedia[currentImageIndex])}
                                alt="Full view"
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-200 ease-out"
                                style={{
                                    transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                                    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                                }}
                                onMouseDown={handleMouseDown}
                                draggable={false}
                            />
                        )}
                        <p className="text-white/60 mt-4 text-sm font-medium">
                            {currentImageIndex + 1} / {allMedia.length}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default NoteCard;
