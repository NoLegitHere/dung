import React, { createContext, useContext, useEffect, useState } from 'react';

type WebSocketContextType = {
    socket: WebSocket | null;
    isConnected: boolean;
    connect: (classId: number) => void;
    disconnect: () => void;
    sendMessage: (message: any) => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = (classId: number) => {
        if (socket) {
            socket.close();
        }
        // Use localhost for development, should be configured via env
        const ws = new WebSocket(`ws://localhost:8000/api/v1/qa/ws/${classId}`);

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            setSocket(null);
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        setSocket(ws);
    };

    const disconnect = () => {
        if (socket) {
            socket.close();
        }
    };

    const sendMessage = (message: any) => {
        if (socket && isConnected) {
            socket.send(JSON.stringify(message));
        }
    };

    useEffect(() => {
        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ socket, isConnected, connect, disconnect, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
