export const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    // Check if message is within last minute
    const diffSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
    if (diffSeconds < 60) {
      return 'Agora';
    }
    
    // Reset hours to compare just the dates
    const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = todayDateOnly.getTime() - messageDateOnly.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 0) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'ontem';
    } else if (diffDays === 2) {
      return 'anteontem';
    } else {
      return messageDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };
  