export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'open': return '#EF4444';
        case 'in-progress': return '#F59E0B';
        case 'resolved': return '#10B981';
        case 'closed': return '#6B7280';
        default: return '#6B7280';
    }
};

export const getStatusText = (status: string): string => {
    switch (status) {
        case 'open': return 'Aberto';
        case 'in-progress': return 'Em Andamento';
        case 'resolved': return 'Resolvido';
        case 'closed': return 'Fechado';
        default: return 'Desconhecido';
    }
};

export const getPriorityColor = (priority: string): string => {
    switch (priority) {
        case 'low': return '#10B981';
        case 'medium': return '#F59E0B';
        case 'high': return '#EF4444';
        case 'urgent': return '#DC2626';
        default: return '#6B7280';
    }
};

export const formatSupportDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
};
