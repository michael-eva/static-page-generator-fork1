'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SelectedCard {
    index: number;
    name: string;
    colorPalette: string;
    iframeSrc: string;
}

interface SelectedCardContextType {
    selectedCard: SelectedCard | null;
    setSelectedCard: (card: SelectedCard | null) => void;
}

const SelectedCardContext = createContext<SelectedCardContextType | undefined>(undefined);

export const SelectedCardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(() => {
        const savedCard = localStorage.getItem('selectedCard');
        return savedCard ? JSON.parse(savedCard) : null;
    });

    useEffect(() => {
        if (selectedCard) {
            localStorage.setItem('selectedCard', JSON.stringify(selectedCard));
        } else {
            localStorage.removeItem('selectedCard');
        }
    }, [selectedCard]);

    return (
        <SelectedCardContext.Provider value={{ selectedCard, setSelectedCard }}>
            {children}
        </SelectedCardContext.Provider>
    );
};

export const useSelectedCard = (): SelectedCardContextType => {
    const context = useContext(SelectedCardContext);
    if (!context) {
        throw new Error('useSelectedCard must be used within a SelectedCardProvider');
    }
    return context;
}; 