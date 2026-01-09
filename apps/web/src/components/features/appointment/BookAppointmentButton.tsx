/**
 * Book Appointment Button
 * Opens the appointment booking modal
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@jyotish/ui';
import { CalendarDays } from 'lucide-react';
import { BookAppointmentModal } from './BookAppointmentModal';

export const BookAppointmentButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
        size="lg"
      >
        <CalendarDays className="mr-2 h-5 w-5" />
        Book Appointment
      </Button>

      <BookAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Could navigate to appointments page or show success message
        }}
      />
    </>
  );
};



