import React, { createContext, useContext, useState, ReactNode } from 'react';

type FloatingButtonPosition = 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';

interface FloatingButtonContextType {
    position: FloatingButtonPosition;
    setPosition: (position: FloatingButtonPosition) => void;
}

const FloatingButtonContext = createContext<FloatingButtonContextType | undefined>(undefined);

export const FloatingButtonProvider = ({ children }: { children: ReactNode }) => {
    const [position, setPosition] = useState<FloatingButtonPosition>('right-bottom');

    return (
        <FloatingButtonContext.Provider value={{ position, setPosition }}>
            {children}
        </FloatingButtonContext.Provider>
    );
};

export const useFloatingButton = () => {
    const context = useContext(FloatingButtonContext);
    if (!context) {
        throw new Error('useFloatingButton must be used within FloatingButtonProvider');
    }
    return context;
};
