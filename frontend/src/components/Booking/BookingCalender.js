import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { getUserBookings } from '../../services/bookings';

const BookingCalendar = ({ onDateSelect }) => {
  const [date, setDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getUserBookings();
        setBookings(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  const tileDisabled = ({ date }) => {
    // Disable dates in the past
    if (date < new Date().setHours(0, 0, 0, 0)) return true;
    
    // Check if date is fully booked (example logic)
    const dateBookings = bookings.filter(
      booking => format(new Date(booking.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return dateBookings.length >= 8; // Max 8 bookings per day
  };

  return (
    <div className="booking-calendar">
      <Calendar 
        onChange={(date) => {
          setDate(date);
          onDateSelect(date);
        }}
        value={date}
        tileDisabled={tileDisabled}
        minDate={new Date()}
      />
      
      {!loading && (
        <div className="mt-4">
          <h3 className="font-medium">Booked Slots:</h3>
          <ul className="list-disc pl-5">
            {bookings
              .filter(b => format(new Date(b.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
              .map((booking, index) => (
                <li key={index}>
                  {format(new Date(booking.date), 'hh:mm a')} - {booking.service}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;