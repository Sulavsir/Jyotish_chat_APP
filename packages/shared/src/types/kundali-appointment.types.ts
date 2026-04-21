/**
 * Payload for {@link KUNDALI_APPOINTMENT_SOCKET_EVENT.SESSION_READY}
 */
export interface AppointmentSessionReadyPayload {
  appointmentId: string;
  chatId: string;
}
