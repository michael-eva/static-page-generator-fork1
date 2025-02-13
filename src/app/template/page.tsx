'use client'
import { Button } from '@/components/ui/button';
import React from 'react';
import { useSelectedCard } from '@/context/SelectedCardContext';
import { useRouter } from 'next/navigation';

const CardComponent = () => {
    const { selectedCard, setSelectedCard } = useSelectedCard();
    const router = useRouter();
    const images = [
        { src: '/thumbnails/Screenshot 2025-02-09 at 3.04.54 pm.png', description: 'Landify', iframe: '/templates/landify.html', colorPalette: 'Vibrant Web' },
        { src: '/thumbnails/Screenshot 2025-02-09 at 3.05.15 pm.png', description: 'Dann Good Coffee', iframe: '/templates/dann-good-coffee.html', colorPalette: 'Chill Vibes' },
        { src: '/thumbnails/Screenshot 2025-02-09 at 3.05.39 pm.png', description: '92 Rhys', iframe: '/templates/92-rhys.html', colorPalette: 'Elegant Contrast' },
    ];

    const handleClick = (index: number) => {
        setSelectedCard({
            index,
            name: images[index].description,
            colorPalette: images[index].colorPalette,
            iframeSrc: images[index].iframe
        });
    };

    return (
        <div className={`h-screen border flex flex-col items-center transition-all duration-300 ${selectedCard !== null ? 'space-y-4' : 'justify-center'}`}>

            <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Choose a Template</h2>
                <p className="text-sm text-gray-600">This is just a guideline of how you want the webpage to look, you can customise the colours and layout later.</p>
            </div>

            <div className={`flex flex-row justify-center items-center space-x-4 transition-all duration-300 ${selectedCard !== null ? 'mt-4' : ''}`}>
                {images.map((image, index) => (
                    <div
                        key={index}
                        className={`m-2 p-4 border border-gray-300 rounded-lg transition-transform duration-300 cursor-pointer ${selectedCard?.index === index ? 'scale-110' : 'hover:scale-105'}`}
                        onClick={() => handleClick(index)}
                    >
                        <img src={image.src} alt={`Thumbnail ${index + 1}`} className={`w-32 h-auto ${selectedCard !== null ? 'w-24' : ''}`} />
                        <p className="text-center mt-2">{image.description}</p>
                    </div>
                ))}
            </div>
            {selectedCard && (
                <div className="relative w-full max-w-[50%] h-[50%]">
                    <iframe
                        src={selectedCard.iframeSrc}
                        className="w-full h-full border-4 border-gray-400"
                        style={{ border: 'none' }}
                        title="Dynamic iFrame"
                    ></iframe>
                </div>
            )}
            {selectedCard !== null && (
                <div className="flex justify-end w-full max-w-[50%] mt-4">
                    <Button onClick={() => router.push('/questionnaire')} className="bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300">
                        Next Step
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CardComponent;
