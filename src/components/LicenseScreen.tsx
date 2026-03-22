import React, { useState } from "react";
import { checkLicenseStatus, bindLicense } from "../utils/license";
import { Eye, EyeOff, Key } from "lucide-react";

interface LicenseScreenProps {
    onValidated: () => void;
    t: any;
}

export default function LicenseScreen({ onValidated, t }: LicenseScreenProps) {
    const [email, setEmail] = useState(() => localStorage.getItem("app-email") || "");
    const [licenseKey, setLicenseKey] = useState(() => localStorage.getItem("app-license-key") || "");
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [unbindPrompt, setUnbindPrompt] = useState<{ id: string } | null>(null);

    const handleValidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await checkLicenseStatus(email, licenseKey);

            if (result.status === "invalid") {
                throw new Error(t.error_invalid || "License not found or invalid email.");
            }

            if (result.status === "mismatch" && result.id) {
                setUnbindPrompt({ id: result.id });
                setLoading(false);
                return;
            }

            if (result.status === "error") {
                throw new Error("Validation error.");
            }

            if (result.id) {
                await bindLicense(result.id);
            }

            // Validated successfully
            localStorage.setItem("app-license-valid", "true");
            localStorage.setItem("app-last-license-check", new Date().toISOString());
            localStorage.setItem("app-email", email);
            localStorage.setItem("app-license-key", licenseKey);
            onValidated();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred during validation.");
        } finally {
            setLoading(false);
        }
    };

    const handleUnbind = async () => {
        if (!unbindPrompt) return;
        setLoading(true);
        setError("");
        try {
            await bindLicense(unbindPrompt.id);

            localStorage.setItem("app-license-valid", "true");
            localStorage.setItem("app-last-license-check", new Date().toISOString());
            localStorage.setItem("app-email", email);
            localStorage.setItem("app-license-key", licenseKey);
            onValidated();
        } catch (err: any) {
            setError(err.message || "Failed to transfer license.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Key size={24} style={{ color: 'var(--brand-colors-500)' }} />
                <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{t.form_title}</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{t.form_desc}</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px', fontSize: '13px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {error}
                </div>
            )}

            {unbindPrompt ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                        {t.in_use_msg}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            className="glass-button"
                            onClick={() => setUnbindPrompt(null)}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </button>
                        <button
                            className="glass-button glass-button-primary"
                            onClick={handleUnbind}
                            disabled={loading}
                            style={{ flex: 2, opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? t.btn_transferring : t.btn_transfer}
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleValidate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 500 }}>{t.label_email}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.placeholder_email}
                            className="glass-input"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 500 }}>{t.label_key}</label>
                        <div style={{ position: 'relative', display: 'flex' }}>
                            <input
                                type={showKey ? "text" : "password"}
                                required
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value)}
                                placeholder={t.placeholder_key}
                                className="glass-input"
                                style={{ width: '100%', paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                title={showKey ? t.hide_key : t.show_key}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0
                                }}
                            >
                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="glass-button glass-button-primary"
                        disabled={loading || !email || !licenseKey}
                        style={{ marginTop: '8px', opacity: (loading || !email || !licenseKey) ? 0.7 : 1, width: '100%' }}
                    >
                        {loading ? t.btn_validating : t.btn_activate}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                        <a href="https://task-goblin.com/nexo-app" target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: 'var(--brand-colors-500)', textDecoration: 'none' }}>
                            {t.buy_link}
                        </a>
                    </div>
                </form>
            )}
        </div>
    );
}
