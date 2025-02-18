'use client'
import { Template } from '@/types/template';
import React, { createContext, useContext, useState, useEffect } from 'react';


interface SelectedCardContextType {
    selectedCard: Template | null;
    setSelectedCard: (card: Template | null) => void;
    isLoading: boolean;
}

const SelectedCardContext = createContext<SelectedCardContextType | undefined>(undefined);

export const SelectedCardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedCard, setSelectedCard] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved card from localStorage on client side only
    useEffect(() => {
        try {
            const savedCard = localStorage.getItem('selectedCard');
            if (savedCard) {
                setSelectedCard(JSON.parse(savedCard));
            }
        } catch (error) {
            console.error('Error loading saved card:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save card to localStorage when it changes
    useEffect(() => {
        if (!isLoading) {  // Only save after initial load
            if (selectedCard) {
                localStorage.setItem('selectedCard', JSON.stringify(selectedCard));
            } else {
                localStorage.removeItem('selectedCard');
            }
        }
    }, [selectedCard, isLoading]);

    return (
        <SelectedCardContext.Provider value={{ selectedCard, setSelectedCard, isLoading }}>
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