/**
 * Client Details Modal
 * Displays client profile details (name, DOB, POB, TOB) for astrologers
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Card,
  CardContent,
} from '@jyotish/ui';
import { Calendar, MapPin, Clock, User, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback, Badge } from '@jyotish/ui';
import { getImageUrl } from '@/utils/image.utils';
import { useQuery } from '@tanstack/react-query';
import { userService, type ClientDetails } from '@/services/user.service';
import { QUERY_KEYS } from '@/constants';

interface ClientDetailsResponse {
  client: ClientDetails;
}

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
}

export function ClientDetailsModal({ isOpen, onClose, clientId }: ClientDetailsModalProps) {
  const { data: response, isLoading } = useQuery<ClientDetailsResponse | null>({
    queryKey: clientId
      ? QUERY_KEYS.USERS.CLIENT_DETAILS(clientId)
      : QUERY_KEYS.USERS.CLIENT_DETAILS(''),
    queryFn: () => (clientId ? userService.getClientDetails(clientId) : null),
    enabled: isOpen && !!clientId,
  });

  // Extract client from response (API returns { client: {...} })
  const client: ClientDetails | null = response?.client || null;

  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'Not provided';
    try {
      return format(new Date(date), 'MMMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-700/50 shadow-2xl">
        <DialogHeader className="border-b border-slate-700/50 pb-4">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            Client Profile Details
          </DialogTitle>
          <DialogDescription className="text-slate-300/80 mt-2">
            Birth details and profile information for astrological analysis
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : client ? (
          <div className="space-y-4 pt-4">
            {/* Profile Header */}
            <Card className="bg-slate-800/60 border border-slate-700/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-blue-500/50 shadow-lg">
                    <AvatarImage
                      src={getImageUrl(client.profilePhoto) || undefined}
                      alt={client.name || 'Client'}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold">
                      {(client.name || client.phone || 'C').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {client.name || client.phone || 'Unknown Client'}
                    </h3>
                    {client.zodiacSign && (
                      <p className="text-blue-300 text-sm font-medium">♈ {client.zodiacSign}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-slate-800/60 border border-slate-700/50 shadow-lg">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-400" />
                  </div>
                  Contact Information
                </h4>
                <div className="space-y-3">
                  {client.email && (
                    <div className="flex items-center gap-3 text-slate-200">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3 text-slate-200">
                      <Phone className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">{client.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Birth Details */}
            <Card className="bg-slate-800/60 border border-slate-700/50 shadow-lg">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-400" />
                  </div>
                  Birth Details
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Date of Birth</p>
                        <p className="text-white font-medium">{formatDate(client.dateOfBirth)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Time of Birth</p>
                        <p className="text-white font-medium">
                          {client.timeOfBirth || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 mb-1">Place of Birth</p>
                      <p className="text-white font-medium">
                        {client.placeOfBirth || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            {(client.currentAddress || client.permanentAddress) && (
              <Card className="bg-slate-800/60 border border-slate-700/50 shadow-lg">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-blue-400" />
                    </div>
                    Address Information
                  </h4>
                  <div className="space-y-4">
                    {client.currentAddress && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Current Address</p>
                        <p className="text-white text-sm">{client.currentAddress}</p>
                      </div>
                    )}
                    {client.permanentAddress && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Permanent Address</p>
                        <p className="text-white text-sm">{client.permanentAddress}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">No client details available</div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-700/50">
          <Button onClick={onClose} variant="ghost" className="border hover:!bg-gray-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
