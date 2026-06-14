import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const shiftService = {
    clockIn: async (shiftType, employeeId) => {
        const response = await axios.post(`${API_URL}/shifts/clock-in`, { shiftType, employeeId });
        return response.data;
    },
    clockOut: async (shiftId, notes) => {
        const response = await axios.post(`${API_URL}/shifts/clock-out/${shiftId}`, { notes });
        return response.data;
    },
    getCurrentShift: async () => {
        const response = await axios.get(`${API_URL}/shifts/current`);
        return response.data;
    },
    getShiftHistory: async () => {
        const response = await axios.get(`${API_URL}/shifts/history`);
        return response.data;
    }
};

export default shiftService;
