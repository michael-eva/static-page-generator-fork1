'use client'
import { Button } from '@/components/ui/button';
import React, { useEffect } from 'react';
import { useSelectedCard } from '@/context/SelectedCardContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { templates } from '@/data/templates';

const CardComponent = () => {
    const router = useRouter();
    const websites = templates;
    const { selectedCard, setSelectedCard } = useSelectedCard();

    // Initialize with null and update from localStorage in useEffect
    useEffect(() => {
        const savedCard = typeof window !== 'undefined' ? localStorage.getItem('selectedCard') : null;
        if (savedCard) {
            setSelectedCard(JSON.parse(savedCard));
        }
    }, [setSelectedCard]);

    const handleClick = (index: number) => {
        const newCard = {
            index,
            src: websites[index].src,
            name: websites[index].name,
            colorPalette: websites[index].colorPalette,
            iframeSrc: websites[index].iframeSrc,
            description: websites[index].description || '',
            offering: websites[index].offering || [],
            images: (websites[index].images ?? []).map(image => ({ path: image.path, description: image.description })),
            style: websites[index].style || '',
            tagline: websites[index].tagline || '',
            logoUrl: websites[index].logoUrl || ''
        };
        setSelectedCard(newCard);
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedCard', JSON.stringify(newCard));
        }
    };

    return (
        <div className={`h-screen border flex flex-col items-center transition-all duration-300 ${selectedCard !== null ? 'space-y-4' : 'justify-center'}`}>

            <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Choose a Template</h2>
                <p className="text-sm text-gray-600">This is just a guideline of how you want the webpage to look, you can customise the colours and layout later.</p>
            </div>

            <div className={`flex flex-row justify-center items-center space-x-4 transition-all duration-300 ${selectedCard !== null ? 'mt-4' : ''}`}>
                {websites.map((image, index) => (
                    <div
                        key={index}
                        className={`m-2 p-4 border border-gray-300 rounded-lg transition-transform duration-300 cursor-pointer ${selectedCard?.index === index ? 'scale-110' : 'hover:scale-105'}`}
                        onClick={() => handleClick(index)}
                    >
                        <div className="relative w-32 h-32">
                            <Image
                                src={image.src}
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                style={{ objectFit: 'contain' }}
                                className={selectedCard !== null ? 'w-24' : ''}
                            />
                        </div>
                        <p className="text-center mt-2">{image.name}</p>
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
