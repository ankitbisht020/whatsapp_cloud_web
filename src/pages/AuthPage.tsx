import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, Eye, EyeOff, Lock, Mail, MessageSquare, ShieldCheck, UserCircle2 } from 'lucide-react';
import type { LoginClientInput, RegisterClientInput } from '../data/mockData';
import { useAuthStore, useToastStore } from '../store/useStore';

interface AuthPageProps {
  mode: 'login' | 'register';
}

const metaWhatsAppSetupUrl = 'https://developers.facebook.com/apps/';

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToastStore((state) => state.addToast);
  const registerClient = useAuthStore((state) => state.registerClient);
  const loginClient = useAuthStore((state) => state.loginClient);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [formValues, setFormValues] = useState<RegisterClientInput>({
    name: '',
    email: '',
    password: '',
    businessName: '',
    whatsappAccessToken: '',
    phoneNumberId: '',
    wabaId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const isRegister = mode === 'register';
  const title = isRegister ? 'Create Your Client Workspace' : 'Sign In to Your Workspace';
  const subtitle = isRegister
    ? 'Register your business, connect your WhatsApp credentials, and lock the SaaS to your client account.'
    : 'Only registered clients can use the platform. Sign in with your client credentials to continue.';

  const destinationAfterLogin = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname || '/';
  }, [location.state]);

  const setField = (field: keyof RegisterClientInput, value: string) => {
    clearError();
    setFormErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
    setFormValues((previous) => ({ ...previous, [field]: value }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (isRegister && !formValues.name.trim()) {
      errors.name = 'Client name is required';
    }

    if (!formValues.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!formValues.password.trim()) {
      errors.password = 'Password is required';
    } else if (formValues.password.trim().length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (isRegister && !formValues.businessName.trim()) {
      errors.businessName = 'Business name is required';
    }

    if (isRegister && !formValues.whatsappAccessToken.trim()) {
      errors.whatsappAccessToken = 'WhatsApp access token is required';
    }

    if (isRegister && !formValues.phoneNumberId.trim()) {
      errors.phoneNumberId = 'Phone number ID is required';
    }

    if (isRegister && !formValues.wabaId.trim()) {
      errors.wabaId = 'WABA ID is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      if (isRegister) {
        await registerClient({
          name: formValues.name.trim(),
          email: formValues.email.trim().toLowerCase(),
          password: formValues.password,
          businessName: formValues.businessName.trim(),
          whatsappAccessToken: formValues.whatsappAccessToken.trim(),
          phoneNumberId: formValues.phoneNumberId.trim(),
          wabaId: formValues.wabaId.trim(),
        });

        addToast({
          type: 'success',
          title: 'Workspace Ready',
          message: 'Your client account has been created and secured.',
        });
      } else {
        const payload: LoginClientInput = {
          email: formValues.email.trim().toLowerCase(),
          password: formValues.password,
        };

        await loginClient(payload);
        addToast({
          type: 'success',
          title: 'Signed In',
          message: 'Welcome back to your client workspace.',
        });
      }

      navigate(destinationAfterLogin, { replace: true });
    } catch (error) {
      addToast({
        type: 'error',
        title: isRegister ? 'Registration failed' : 'Login failed',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <MessageSquare size={22} />
          </div>
          <div>
            <h1>BroadcastHub</h1>
            <span>Client-Secured WhatsApp SaaS</span>
          </div>
        </div>

        <div className="auth-copy">
          <span className="auth-kicker">Secure Multi-Tenant Access</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="auth-feature-list">
          <div className="auth-feature-card">
            <ShieldCheck size={18} />
            <div>
              <h3>Client-isolated data</h3>
              <p>Contacts, templates, broadcasts, and logs stay tied to the authenticated client.</p>
            </div>
          </div>
          <div className="auth-feature-card">
            <Lock size={18} />
            <div>
              <h3>Token-protected APIs</h3>
              <p>Every SaaS action uses the JWT-secured collection flow from your latest Postman contract.</p>
            </div>
          </div>
          <div className="auth-feature-card">
            <UserCircle2 size={18} />
            <div>
              <h3>Business onboarding</h3>
              <p>Register once with your WhatsApp business credentials, then manage campaigns safely.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>{isRegister ? 'Register Client' : 'Client Login'}</h2>
            <p>{isRegister ? 'Create a protected workspace' : 'Access your protected workspace'}</p>
          </div>

          {(authError || Object.keys(formErrors).length > 0) && (
            <div className="auth-inline-alert">
              {authError || 'Please fix the highlighted fields and try again.'}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    value={formValues.name}
                    onChange={(event) => setField('name', event.target.value)}
                    placeholder="Rahul Sharma"
                  />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input
                    className={`form-input ${formErrors.businessName ? 'error' : ''}`}
                    value={formValues.businessName}
                    onChange={(event) => setField('businessName', event.target.value)}
                    placeholder="Rahul Traders"
                  />
                  {formErrors.businessName && <div className="form-error">{formErrors.businessName}</div>}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email *</label>
              <div className="auth-input-icon">
                <span className="auth-input-leading-icon">
                  <Mail size={16} />
                </span>
                <input
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                  value={formValues.email}
                  onChange={(event) => setField('email', event.target.value)}
                  placeholder="rahul@example.com"
                  type="email"
                />
              </div>
              {formErrors.email && <div className="form-error">{formErrors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="auth-input-icon">
                <span className="auth-input-leading-icon">
                  <Lock size={16} />
                </span>
                <input
                  className={`form-input auth-password-input ${formErrors.password ? 'error' : ''}`}
                  value={formValues.password}
                  onChange={(event) => setField('password', event.target.value)}
                  placeholder="secret123"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formErrors.password && <div className="form-error">{formErrors.password}</div>}
            </div>

            {isRegister && (
              <>
                <div className="auth-helper-card">
                  <div>
                    <h3>Need WhatsApp API credentials?</h3>
                    <p>
                      Open the official Meta developer setup, create your app, then copy the Access
                      Token, Phone Number ID, and WABA ID back here.
                    </p>
                  </div>
                  <div className="auth-helper-actions">
                    <Link className="btn btn-secondary auth-helper-btn" to="/whatsapp-setup-help">
                      Read Setup Guide
                    </Link>
                    <a
                      className="btn btn-secondary auth-helper-btn"
                      href={metaWhatsAppSetupUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Meta Setup
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Access Token *</label>
                  <textarea
                    className={`form-input form-textarea ${formErrors.whatsappAccessToken ? 'error' : ''}`}
                    value={formValues.whatsappAccessToken}
                    onChange={(event) => setField('whatsappAccessToken', event.target.value)}
                    placeholder="Paste your client WhatsApp access token"
                    rows={3}
                  />
                  {formErrors.whatsappAccessToken && (
                    <div className="form-error">{formErrors.whatsappAccessToken}</div>
                  )}
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Phone Number ID *</label>
                    <input
                      className={`form-input ${formErrors.phoneNumberId ? 'error' : ''}`}
                      value={formValues.phoneNumberId}
                      onChange={(event) => setField('phoneNumberId', event.target.value)}
                      placeholder="123456789012345"
                    />
                    {formErrors.phoneNumberId && (
                      <div className="form-error">{formErrors.phoneNumberId}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">WABA ID *</label>
                    <input
                      className={`form-input ${formErrors.wabaId ? 'error' : ''}`}
                      value={formValues.wabaId}
                      onChange={(event) => setField('wabaId', event.target.value)}
                      placeholder="987654321098765"
                    />
                    {formErrors.wabaId && <div className="form-error">{formErrors.wabaId}</div>}
                  </div>
                </div>
              </>
            )}

            <button className="btn btn-primary auth-submit-btn" type="submit" disabled={isLoading}>
              {isLoading
                ? isRegister
                  ? 'Creating Workspace...'
                  : 'Signing In...'
                : isRegister
                  ? 'Register Client'
                  : 'Login'}
            </button>
          </form>

          <div className="auth-card-footer">
            {isRegister ? 'Already registered?' : 'Need a client account?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Login here' : 'Register here'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
