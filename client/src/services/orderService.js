import axios from 'axios';

const API_URL = 'http://localhost:5000/api/orders';

const getAuthConfig = () => {
    const token = localStorage.getItem('gms_token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const createOrder = async (orderData) => {
    const response = await axios.post(API_URL, orderData, getAuthConfig());
    return response.data;
};

export const getOrders = async () => {
    const response = await axios.get(API_URL, getAuthConfig());
    return response.data;
};

export const getOrderById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
};

export const getSalesAnalytics = async () => {
    const response = await axios.get(`${API_URL}/analytics/overview`, getAuthConfig());
    return response.data;
};
