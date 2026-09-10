import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, saveSettings, resetSettings } from '../../services/api';
import { Icon, ConfirmDialog, Button, Card, Input } from "../../components/ui";
import siteConfig from "../../data/siteConfig";

const settingsToForm = (settings) => ({
  storeName: settings.storeName,
  storeTagline: settings.storeTagline,
  whatsappNumber: settings.whatsappNumber,
  phoneNumber: settings.phoneNumber,
  email: settings.email,
  salesEmail: settings.salesEmail,
  addressLine1: settings.address?.line1 || "",
  addressLine2: settings.address?.line2 || "",
  addressState: settings.address?.state || "",
  hoursWeekday: settings.hours?.weekday || "",
  hoursWeekend: settings.hours?.weekend || "",
  socialFacebook: settings.social?.facebook || "#",
  socialInstagram: settings.social?.instagram || "#",
  socialYoutube: settings.social?.youtube || "#",
  enableReviews: settings.features?.enableReviews ?? localStorage.getItem('ae_enable_reviews') !== 'false',
  enableCalculator: settings.features?.enableCalculator ?? localStorage.getItem('ae_enable_calculator') !== 'false'
});

const formToSettings = (settingsForm) => ({
  storeName: settingsForm.storeName,
  storeTagline: settingsForm.storeTagline,
  whatsappNumber: settingsForm.whatsappNumber,
  phoneNumber: settingsForm.phoneNumber,
  email: settingsForm.email,
  salesEmail: settingsForm.salesEmail,
  address: {
    line1: settingsForm.addressLine1,
    line2: settingsForm.addressLine2,
    state: settingsForm.addressState,
  },
  hours: {
    weekday: settingsForm.hoursWeekday,
    weekend: settingsForm.hoursWeekend,
  },
  social: {
    facebook: settingsForm.socialFacebook,
    instagram: settingsForm.socialInstagram,
    youtube: settingsForm.socialYoutube,
  },
  features: {
    enableReviews: settingsForm.enableReviews,
    enableCalculator: settingsForm.enableCalculator,
  }
});

const persistSettingsLocally = (settings) => {
  const { features, ...configOverrides } = settings;
  localStorage.setItem('ae_site_config', JSON.stringify(configOverrides));
  localStorage.setItem('ae_enable_reviews', features?.enableReviews ? 'true' : 'false');
  localStorage.setItem('ae_enable_calculator', features?.enableCalculator ? 'true' : 'false');
};

export default function AdminSettingsTab({
  showToast,
  addLog
}) {
  const queryClient = useQueryClient();
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Settings tab form state
  const [settingsForm, setSettingsForm] = useState(() => {
    return settingsToForm(siteConfig);
  });

  const { data: savedSettings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (savedSettings) {
      window.setTimeout(() => setSettingsForm(settingsToForm(savedSettings)), 0);
      persistSettingsLocally(savedSettings);
    }
  }, [savedSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: (result) => {
      persistSettingsLocally(result.settings);
      queryClient.setQueryData(['site-settings'], result.settings);
      showToast("Settings saved successfully! Refreshing page to apply...");
      addLog("settings", "Site configurations updated");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: () => showToast("Error saving settings. Session might be expired.")
  });

  const resetSettingsMutation = useMutation({
    mutationFn: resetSettings,
    onSuccess: (result) => {
      localStorage.removeItem('ae_site_config');
      localStorage.removeItem('ae_enable_reviews');
      localStorage.removeItem('ae_enable_calculator');
      queryClient.setQueryData(['site-settings'], result.settings);
      showToast("Configuration reset! Reloading...");
      addLog("settings", "Reset settings to system defaults");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    },
    onError: () => showToast("Error resetting settings. Session might be expired.")
  });

  return (
    <section aria-label="Settings Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="admin-page-title" style={{ margin: 0 }}>System Settings</h2>
          <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            Customize store information, operating hours, social handles, and toggle client-side features.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        saveSettingsMutation.mutate(formToSettings(settingsForm));
      }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Grid Layout of panels */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          
          {/* General Info Panel */}
          <Card>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--white)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="settings" size={16} color="var(--gold)" /> Store Branding & Contacts
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>STORE NAME</label>
                <Input 
                  type="text" 
                  value={settingsForm.storeName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>STORE TAGLINE</label>
                <Input 
                  type="text" 
                  value={settingsForm.storeTagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeTagline: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>WHATSAPP NUMBER</label>
                <Input 
                  type="text" 
                  value={settingsForm.whatsappNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>DISPLAY PHONE NUMBER</label>
                <Input 
                  type="text" 
                  value={settingsForm.phoneNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phoneNumber: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>SUPPORT EMAIL</label>
                <Input 
                  type="email" 
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Address & Hours Panel */}
          <Card>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--white)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="home" size={16} color="var(--gold)" /> Address & Operating Hours
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>ADDRESS LINE 1</label>
                <Input 
                  type="text" 
                  value={settingsForm.addressLine1}
                  onChange={(e) => setSettingsForm({ ...settingsForm, addressLine1: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>ADDRESS LINE 2</label>
                <Input 
                  type="text" 
                  value={settingsForm.addressLine2}
                  onChange={(e) => setSettingsForm({ ...settingsForm, addressLine2: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>STATE & ZIP</label>
                <Input 
                  type="text" 
                  value={settingsForm.addressState}
                  onChange={(e) => setSettingsForm({ ...settingsForm, addressState: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>WEEKDAY HOURS</label>
                <Input 
                  type="text" 
                  value={settingsForm.hoursWeekday}
                  onChange={(e) => setSettingsForm({ ...settingsForm, hoursWeekday: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>WEEKEND HOURS</label>
                <Input 
                  type="text" 
                  value={settingsForm.hoursWeekend}
                  onChange={(e) => setSettingsForm({ ...settingsForm, hoursWeekend: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Feature Toggles & Social */}
          <Card>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--white)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="eye" size={16} color="var(--gold)" /> Platform Preferences
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settingsForm.enableReviews}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enableReviews: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }}
                />
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--white)', display: 'block' }}>Enable Reviews & Ratings</span>
                  <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)' }}>Allow visitors to see ratings and post new customer reviews.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settingsForm.enableCalculator}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enableCalculator: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }}
                />
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--white)', display: 'block' }}>Estimated Quote pricing valuation</span>
                  <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)' }}>Display item price estimation inside the admin Quote detailed pane.</span>
                </div>
              </label>
            </div>

            <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em' }}>SOCIAL CHANNELS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>FACEBOOK LINK</label>
                <Input 
                  type="text" 
                  value={settingsForm.socialFacebook}
                  onChange={(e) => setSettingsForm({ ...settingsForm, socialFacebook: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>INSTAGRAM LINK</label>
                <Input 
                  type="text" 
                  value={settingsForm.socialInstagram}
                  onChange={(e) => setSettingsForm({ ...settingsForm, socialInstagram: e.target.value })}
                />
              </div>
            </div>
          </Card>

        </div>

        {/* Form Footer Action Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '16px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <Button 
            type="button" 
            variant="destructive"
            onClick={() => {
              setConfirmConfig({
                title: "Reset Configuration Defaults?",
                message: "Are you sure you want to reset all configurations to their original system defaults? This will erase your overrides.",
                confirmLabel: "Reset Configuration",
                variant: "warning",
                onConfirm: () => resetSettingsMutation.mutate()
              });
            }}
            style={{ padding: '10px 20px', borderRadius: '8px' }}
          >
            Reset to System Defaults
          </Button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              type="submit" 
              disabled={saveSettingsMutation.isPending}
              style={{ padding: '10px 28px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600 }}
            >
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save configuration'}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={!!confirmConfig}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        confirmLabel={confirmConfig?.confirmLabel}
        cancelLabel={confirmConfig?.cancelLabel}
        variant={confirmConfig?.variant}
        onConfirm={() => {
          confirmConfig?.onConfirm();
          setConfirmConfig(null);
        }}
        onCancel={() => setConfirmConfig(null)}
      />
    </section>
  );
}
