import React from 'react';
import { Bot, Wand2, ShieldCheck, Globe, ArrowRight } from 'lucide-react';

const WelcomeScreen = ({ onStart, t }) => {
    return (
        <div style={styles.container}>
            <style>
                {`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                        100% { transform: translateY(0px); }
                    }
                `}
            </style>
            {/* Background elements for decoration */}
            <div style={styles.blob1}></div>
            <div style={styles.blob2}></div>

            <div style={styles.content}>
                <div style={{ ...styles.hero, animationDelay: '0.1s' }}>
                    <div style={styles.iconWrapper}>
                        <Bot size={64} className="text-primary" style={{ animation: 'float 3s ease-in-out infinite' }} />
                    </div>
                    <h1 style={styles.title}>{t('welcome.title')}</h1>
                    <p style={styles.subtitle}>{t('welcome.subtitle')}</p>

                    <button onClick={onStart} className="btn btn-primary" style={styles.button}>
                        {t('welcome.getStarted')}
                        <ArrowRight size={20} style={{ marginInlineStart: '0.5rem' }} />
                    </button>
                </div>

                <div style={styles.features}>
                    <FeatureCard
                        icon={<Bot size={32} color="#10b981" />}
                        title={t('welcome.features.smart.title')}
                        desc={t('welcome.features.smart.desc')}
                        delay="0.2s"
                    />
                    <FeatureCard
                        icon={<Wand2 size={32} color="#8b5cf6" />}
                        title={t('welcome.features.auto.title')}
                        desc={t('welcome.features.auto.desc')}
                        delay="0.3s"
                    />
                    <FeatureCard
                        icon={<Globe size={32} color="#3b82f6" />}
                        title={t('welcome.features.bilingual.title')}
                        desc={t('welcome.features.bilingual.desc')}
                        delay="0.4s"
                    />
                    <FeatureCard
                        icon={<ShieldCheck size={32} color="#f59e0b" />}
                        title={t('welcome.features.secure.title')}
                        desc={t('welcome.features.secure.desc')}
                        delay="0.5s"
                    />
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, delay }) => (
    <div style={{ ...styles.card, animationDelay: delay }}>
        <div style={{ marginBottom: '1rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.5 }}>{desc}</p>
    </div>
);

const styles = {
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5000, // On top of everything
        overflow: 'hidden'
    },
    blob1: {
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: -1
    },
    blob2: {
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: -1
    },
    content: {
        maxWidth: '1200px',
        width: '100%',
        padding: '2rem',
        textAlign: 'center',
        zIndex: 1
    },
    hero: {
        marginBottom: '4rem',
        animation: 'fadeInUp 0.8s ease-out forwards',
        opacity: 0
    },
    iconWrapper: {
        width: '120px',
        height: '120px',
        background: 'white',
        borderRadius: '50%',
        boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 2rem auto',
    },
    title: {
        fontSize: '3rem',
        fontWeight: 800,
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #064e3b, #10b981)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        fontSize: '1.25rem',
        color: '#64748b',
        marginBottom: '2.5rem',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto'
    },
    button: {
        padding: '1rem 3rem',
        fontSize: '1.2rem',
        borderRadius: '50px',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
        display: 'inline-flex',
        alignItems: 'center'
    },
    features: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
    },
    card: {
        background: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        border: '1px solid #f1f5f9',
        animation: 'fadeInUp 0.8s ease-out forwards',
        opacity: 0,
        transition: 'transform 0.3s ease',
        cursor: 'default'
    }
};

export default WelcomeScreen;
