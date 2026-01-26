import { useState } from "react";
import toast from "react-hot-toast"; 
import { t } from '@/utils';

function NewsletterSubscription() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    console.log("Subscribing with email:", email);

    // Simulate async subscription API
    toast.promise(
      new Promise((resolve) =>
        setTimeout(() => resolve(`Thank you for subscribing, ${email}!`), 1000)
      ),
      {
        loading: "Subscribing...",
        success: (msg) => msg,
        error: "Subscription failed. Please try again.",
      }
    );

    setEmail(""); // Clear input immediately (optional)
  };

  return (
    <div>
      <div className="footer_headlines">{t('newsletter')}</div>
      <form
        onSubmit={handleSubmit}
        className="mt-3 d-flex gap-1 align-items-stretch"
      >
        <input
          type="email"
          placeholder={t('enterEmail')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth_input"
          ariaLabel="Email address for newsletter subscription"
        />
        <button
          type="submit"
          className="verf_email_add_btn"
          style={{ whiteSpace: "nowrap" }}
        >
          {t('subscribe')}
        </button>
      </form>
    </div>
  );
}

export default NewsletterSubscription;
