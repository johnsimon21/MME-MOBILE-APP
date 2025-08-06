interface IColor {
    bg: string;
    text: string;
}

export const getStatusColor = (status: string): IColor => {
    const colors: { [key: string]: IColor } = {
        'open': {bg:'bg-red-200', text: 'text-red-800'},
        'in-progress': {bg:'bg-yellow-200', text: 'text-yellow-800'},
        'resolved': {bg:'bg-green-200', text: 'text-green-800'},
        'closed': {bg:'bg-gray-200', text: 'text-gray-800'},
    };
    return colors[status] || {bg: 'bg-gray-200', text: 'text-gray-600'};
};

export const getStatusText = (status: string): string => {
    const texts: { [key: string]: string } = {
        'open': 'Aberto',
        'in-progress': 'Em Andamento',
        'resolved': 'Resolvido',
        'closed': 'Fechado'
    };
    return texts[status] || status;
}

export const getPriorityColor = (priority: string): IColor => {
    const colors: { [key: string]: IColor } = {
        'low': {bg:'bg-blue-200', text: 'text-blue-800'},
        'medium': {bg:'bg-yellow-200', text: 'text-yellow-800'},
        'high': {bg:'bg-orange-200', text: 'text-orange-800'},
        'urgent': {bg:'bg-red-200', text: 'text-red-800'},
    };
    return colors[priority] || {bg: 'bg-gray-200', text: 'text-gray-600'};
};

export const formatSupportDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
        return 'Agora mesmo';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m atrás`;
    } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}h atrás`;
    } else if (diffInMinutes < 10080) {
        const days = Math.floor(diffInMinutes / 1440);
        return `${days}d atrás`;
    } else {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
};

export const validateTicketData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!data.title || data.title.trim().length < 5) {
        errors.push('Título deve ter pelo menos 5 caracteres');
    }
    
    if (!data.description || data.description.trim().length < 10) {
        errors.push('Descrição deve ter pelo menos 10 caracteres');
    }
    
    if (!data.category) {
        errors.push('Categoria é obrigatória');
    }
    
    if (!data.priority) {
        errors.push('Prioridade é obrigatória');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const generateTicketId = (): string => {
    return `TK${Date.now().toString().slice(-6)}`;
};

export const getTicketPriorityWeight = (priority: string): number => {
    const weights: { [key: string]: number } = {
        'urgent': 4,
        'high': 3,
        'medium': 2,
        'low': 1
    };
    return weights[priority] || 1;
};

export const sortTicketsByPriority = (tickets: any[]): any[] => {
    return tickets.sort((a, b) => {
        const weightA = getTicketPriorityWeight(a.priority);
        const weightB = getTicketPriorityWeight(b.priority);
        
        if (weightA !== weightB) {
            return weightB - weightA; // Higher priority first
        }
        
        // If same priority, sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
};
