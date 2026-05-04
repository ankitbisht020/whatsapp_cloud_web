import React from 'react';
import { ArrowLeft, BookOpen, ExternalLink, KeyRound, MessageSquare, Phone, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const metaAppsUrl = 'https://developers.facebook.com/apps/';
const metaGettingStartedUrl = 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started';
const metaManagerUrl = 'https://business.facebook.com/wa/manage/home/';

const WhatsAppSetupGuidePage: React.FC = () => {
  return (
    <div className="guide-shell">
      <div className="guide-backdrop" />

      <div className="guide-page">
        <div className="guide-topbar">
          <Link className="guide-back-link" to="/register">
            <ArrowLeft size={16} />
            Back to Register
          </Link>
        </div>

        <div className="guide-hero-card">
          <div className="guide-brand">
            <div className="guide-brand-icon">
              <MessageSquare size={22} />
            </div>
            <div>
              <span className="guide-kicker">Public Help Page</span>
              <h1>How to create your WhatsApp credentials</h1>
            </div>
          </div>

          <p className="guide-intro">
            Use this page to collect the 3 values needed on the registration form: WhatsApp
            Access Token, Phone Number ID, and WABA ID.
          </p>

          <div className="guide-action-row">
            <a className="btn btn-primary" href={metaAppsUrl} target="_blank" rel="noreferrer">
              Open Meta App Dashboard
              <ExternalLink size={16} />
            </a>
            <a className="btn btn-secondary" href={metaGettingStartedUrl} target="_blank" rel="noreferrer">
              Official Getting Started
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        <div className="guide-grid">
          <section className="guide-card">
            <div className="guide-card-title">
              <BookOpen size={18} />
              <h2>Step 1: Create your Meta app</h2>
            </div>
            <p>
              Go to the Meta App Dashboard, create an app for your business, and add the WhatsApp
              product to that app.
            </p>
            <p>
              After setup, open the app dashboard and look for the WhatsApp section. Meta creates a
              test setup first, which is useful while you are connecting this project.
            </p>
          </section>

          <section className="guide-card">
            <div className="guide-card-title">
              <KeyRound size={18} />
              <h2>Step 2: Get your Access Token</h2>
            </div>
            <p>
              In the app dashboard, open <strong>WhatsApp &gt; Getting Started</strong>. Meta
              provides a user access token there for quick setup and testing.
            </p>
            <p>
              For production use, Meta recommends creating a longer-lived system user token instead
              of relying on the short-lived testing token.
            </p>
          </section>

          <section className="guide-card">
            <div className="guide-card-title">
              <ShieldCheck size={18} />
              <h2>Step 3: Find your WABA ID</h2>
            </div>
            <p>
              Your WABA ID is the WhatsApp Business Account ID connected to your business. You can
              find it in Meta Business tools or from the WhatsApp business account area after setup.
            </p>
            <p>
              If you want the manager view directly, open WhatsApp Manager and select the business
              account that owns your WhatsApp number.
            </p>
            <a className="guide-inline-link" href={metaManagerUrl} target="_blank" rel="noreferrer">
              Open WhatsApp Manager
              <ExternalLink size={14} />
            </a>
          </section>

          <section className="guide-card">
            <div className="guide-card-title">
              <Phone size={18} />
              <h2>Step 4: Find your Phone Number ID</h2>
            </div>
            <p>
              After you have a WABA ID, you can fetch the connected phone numbers and copy the
              `id` value of the number you want to send messages from.
            </p>
            <pre className="guide-code">
              <code>GET /&#60;WABA-ID&#62;/phone_numbers</code>
            </pre>
            <p>
              Meta&apos;s WhatsApp Cloud API docs and Postman collection both use this step for
              getting the Phone Number ID.
            </p>
          </section>
        </div>

        <section className="guide-card guide-card-wide">
          <div className="guide-card-title">
            <MessageSquare size={18} />
            <h2>What to paste into the register form</h2>
          </div>
          <div className="guide-checklist">
            <div className="guide-check-item">
              <span>1</span>
              <p>
                <strong>WhatsApp Access Token:</strong> from WhatsApp Getting Started or your
                system user token setup.
              </p>
            </div>
            <div className="guide-check-item">
              <span>2</span>
              <p>
                <strong>Phone Number ID:</strong> the numeric `id` for the sending number inside
                your WABA.
              </p>
            </div>
            <div className="guide-check-item">
              <span>3</span>
              <p>
                <strong>WABA ID:</strong> the numeric WhatsApp Business Account ID for your
                business.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WhatsAppSetupGuidePage;
