import { useState, useEffect, useRef } from 'react';
import { PollSocket } from '../services/socketService';

export function useWebSocket(pollId, initialResults = null) {
  const [results, setResults] = useState(initialResults);
  const [activeViewers, setActiveViewers] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (initialResults) {
      setResults(initialResults);
      if (initialResults.activeViewers) {
        setActiveViewers(initialResults.activeViewers);
      }
    }
  }, [initialResults]);

  useEffect(() => {
    if (!pollId) return;

    const handleResultsUpdated = (updatedPayload) => {
      setResults(updatedPayload);
      setLastUpdated(new Date());
    };

    const handleViewerCountUpdated = (viewersCount) => {
      setActiveViewers(viewersCount);
    };

    const socketInstance = new PollSocket(
      pollId,
      handleResultsUpdated,
      handleViewerCountUpdated
    );
    socketRef.current = socketInstance;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [pollId]);

  return {
    results,
    setResults,
    activeViewers,
    lastUpdated,
  };
}

export default useWebSocket;
