/**
 * Notification Settings Page (Jyotish/Astrologer)
 * Allow astrologers to configure their notification preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { Card } from '@jyotish/ui';
import { Bell, Mail, MessageSquare, Calendar, CreditCard, Megaphone, Volume2 } from 'lucide-react';
import { notificationSettingsService, NotificationSettings } from '@/services/notificationSettings.service';
import { toast } from 'sonner';

export default function JyotishNotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await notificationSettingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    // Optimistic update
    setSettings({ ...settings, [key]: value });

    try {
      setIsSaving(true);
      const updated = await notificationSettingsService.updateSettings({ [key]: value });
      setSettings(updated);
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
      // Revert on error
      loadSettings();
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAllNotifications = async (enable: boolean) => {
    try {
      setIsSaving(true);
      const updated = await notificationSettingsService.toggleAllNotifications(enable);
      setSettings(updated);
      toast.success(enable ? 'All notifications enabled' : 'All notifications disabled');
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <JyotishLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-500">Loading settings...</div>
        </div>
      </JyotishLayout>
    );
  }

  if (!settings) {
    return (
      <JyotishLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-500">Failed to load settings</div>
        </div>
      </JyotishLayout>
    );
  }

  return (
    <JyotishLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notification Settings</h1>
          <p className="text-gray-400">Manage how and when you receive notifications</p>
        </div>

        {/* Master Toggle */}
        <Card className="p-6 bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-600 rounded-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">All Notifications</h2>
                <p className="text-sm text-gray-400">Enable or disable all notifications at once</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => toggleAllNotifications(e.target.checked)}
                disabled={isSaving}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </Card>

        {/* Notification Types */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Notification Types</h2>
          <div className="space-y-4">
            {/* Chat Notifications */}
            <SettingToggle
              icon={<MessageSquare className="h-5 w-5" />}
              label="Chat Messages"
              description="Get notified when clients message you"
              checked={settings.chatNotifications}
              onChange={(checked) => updateSetting('chatNotifications', checked)}
              disabled={!settings.notificationsEnabled || isSaving}
            />

            {/* Consultation Notifications */}
            <SettingToggle
              icon={<Calendar className="h-5 w-5" />}
              label="Consultations"
              description="New bookings and consultation updates"
              checked={settings.consultationNotifications}
              onChange={(checked) => updateSetting('consultationNotifications', checked)}
              disabled={!settings.notificationsEnabled || isSaving}
            />

            {/* Payment Notifications */}
            <SettingToggle
              icon={<CreditCard className="h-5 w-5" />}
              label="Payments"
              description="Earnings and transaction updates"
              checked={settings.paymentNotifications}
              onChange={(checked) => updateSetting('paymentNotifications', checked)}
              disabled={!settings.notificationsEnabled || isSaving}
            />

            {/* Marketing Notifications */}
            <SettingToggle
              icon={<Megaphone className="h-5 w-5" />}
              label="Platform Updates"
              description="Platform news and feature announcements"
              checked={settings.marketingNotifications}
              onChange={(checked) => updateSetting('marketingNotifications', checked)}
              disabled={!settings.notificationsEnabled || isSaving}
            />
          </div>
        </Card>

        {/* Delivery Methods */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Delivery Methods</h2>
          <div className="space-y-4">
            {/* Email Notifications */}
            <SettingToggle
              icon={<Mail className="h-5 w-5" />}
              label="Email Notifications"
              description="Receive notifications via email"
              checked={settings.emailNotifications}
              onChange={(checked) => updateSetting('emailNotifications', checked)}
              disabled={!settings.notificationsEnabled || isSaving}
            />

            {/* Push Notifications */}
            <SettingToggle
              icon={<Bell className="h-5 w-5" />}
              label="Push Notifications"
              description="Browser and app push notifications"
              checked={settings.pushNotifications}
              onChange={(checked) => updateSetting('pushNotifications', checked)}
              disabled={!settings.notificationsEnabled || isSaving}
            />

            {/* Sound */}
            <SettingToggle
              icon={<Volume2 className="h-5 w-5" />}
              label="Sound"
              description="Play sound when notifications arrive"
              checked={settings.soundEnabled}
              onChange={(checked) => updateSetting('soundEnabled', checked)}
              disabled={!settings.notificationsEnabled || isSaving}
            />
          </div>
        </Card>
      </div>
    </JyotishLayout>
  );
}

// Toggle Component
interface SettingToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function SettingToggle({ icon, label, description, checked, onChange, disabled }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${checked && !disabled ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
          {icon}
        </div>
        <div>
          <p className={`font-medium ${checked && !disabled ? 'text-white' : 'text-gray-400'}`}>{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
      </label>
    </div>
  );
}

