import { useState, useEffect } from 'react';
import api from './api';

const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const [resRes, foliosRes, maintenanceRes, inventoryRes] = await Promise.allSettled([
                api.get('/reservations'),
                api.get('/folios'),
                api.get('/maintenance'),
                api.get('/inventory'),
            ]);

            const items = [];

            // Arrivals today
            if (resRes.status === 'fulfilled') {
                const arrivalsToday = (resRes.value.data || []).filter(r =>
                    r.status === 'BOOKED' && r.dateIn === today
                );
                if (arrivalsToday.length > 0) {
                    items.push({
                        id: 'arrivals',
                        type: 'arrival',
                        icon: '🏨',
                        title: `${arrivalsToday.length} Guest${arrivalsToday.length > 1 ? 's' : ''} Arriving Today`,
                        detail: arrivalsToday.map(r => r.guestName || `Reservation #${r.id}`).join(', '),
                        path: '/check-in',
                        color: 'blue',
                    });
                }
            }

            // Open (unpaid) folios
            if (foliosRes.status === 'fulfilled') {
                const openFolios = (foliosRes.value.data || []).filter(f => f.status === 'OPEN');
                if (openFolios.length > 0) {
                    items.push({
                        id: 'folios',
                        type: 'folio',
                        icon: '💳',
                        title: `${openFolios.length} Open Folio${openFolios.length > 1 ? 's' : ''}`,
                        detail: 'Unsettled guest bills',
                        path: '/folio',
                        color: 'orange',
                    });
                }
            }

            // Unresolved maintenance tickets
            if (maintenanceRes.status === 'fulfilled') {
                const openTickets = (maintenanceRes.value.data || []).filter(m =>
                    m.status !== 'RESOLVED' && m.status !== 'CLOSED'
                );
                if (openTickets.length > 0) {
                    const urgent = openTickets.filter(m => m.priority === 'URGENT' || m.priority === 'HIGH');
                    items.push({
                        id: 'maintenance',
                        type: 'maintenance',
                        icon: '🔧',
                        title: `${openTickets.length} Open Maintenance Ticket${openTickets.length > 1 ? 's' : ''}`,
                        detail: urgent.length > 0 ? `${urgent.length} urgent/high priority` : 'All normal priority',
                        path: '/maintenance',
                        color: urgent.length > 0 ? 'red' : 'yellow',
                    });
                }
            }

            // Low inventory
            if (inventoryRes.status === 'fulfilled') {
                const lowStock = (inventoryRes.value.data || []).filter(item =>
                    item.quantity != null && item.reorderLevel != null && item.quantity <= item.reorderLevel
                );
                if (lowStock.length > 0) {
                    items.push({
                        id: 'inventory',
                        type: 'inventory',
                        icon: '📦',
                        title: `${lowStock.length} Item${lowStock.length > 1 ? 's' : ''} Low on Stock`,
                        detail: lowStock.slice(0, 3).map(i => i.name || i.itemName).filter(Boolean).join(', '),
                        path: '/inventory',
                        color: 'red',
                    });
                }
            }

            setNotifications(items);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 2 minutes
        const interval = setInterval(fetchNotifications, 120000);
        return () => clearInterval(interval);
    }, []);

    return { notifications, totalCount: notifications.length, loading, refresh: fetchNotifications };
};

export default useNotifications;
