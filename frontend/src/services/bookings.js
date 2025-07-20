import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const createBooking = async (bookingData) => {
  const response = await axios.post(`${API_URL}/bookings`, bookingData, createAuthHeaders());
  return response.data;
};

export const getUserBookings = async () => {
  const response = await axios.get(`${API_URL}/bookings`, createAuthHeaders());
  return response.data;
};